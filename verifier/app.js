// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Verifiable Credentials Sample

///////////////////////////////////////////////////////////////////////////////////////
// Node packages
var express = require('express')
const cors = require('cors');
var session = require('express-session')
var base64url = require('base64url')
var secureRandom = require('secure-random');
var bodyParser = require('body-parser')
// mod.cjs
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)).catch(error => console.log("In catch block"));
const https = require('https')
const url = require('url')
const { SSL_OP_COOKIE_EXCHANGE } = require('constants');
var msal = require('@azure/msal-node');
const fs = require('fs');
const crypto = require('crypto');
var uuid = require('uuid');
// const User = require('./models/user')
// const auth = require('./middleware/auth')
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDefinition = require('./swaggerDefinition')
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Specify the path to your API routes
};
const swaggerSpec = swaggerJsdoc(options);


//require('./db/mongoose')
///////////////////////////////////////////////////////////////////////////////////////
// config file can come from command line, env var or the default
var configFile = process.argv.slice(2)[0];
if (!configFile) {
  configFile = process.env.CONFIGFILE || './config.json';
}
const config = require(configFile)
config.azTenantId = process.env.AZ_TENANT_ID
config.azClientId = process.env.AZ_CLIENT_ID
config.azClientSecret = process.env.AZ_CLIENT_SECRET
config.IssuerAuthority = process.env.DID
config.VerifierAuthority = process.env.DID
if (!config.azTenantId) {
  throw new Error('The config.json file is missing.')
}
module.exports.config = config;

config.apiKey = uuid.v4();
///////////////////////////////////////////////////////////////////////////////////////
// Check that the manifestURL have the matching tenantId with the config file
// var manifestUrl = config.CredentialManifest.split("/")[5];
// if ( config.azTenantId != manifestUrl ) {
//   throw new Error( `TenantId in ManifestURL ${manifestUrl}. does not match tenantId in config file ${config.azTenantId}` );
// }

// Check that the issuer in the config file match the manifest
// fetch( config.CredentialManifest, { method: 'GET'} )
//   .then((res) => res.json())
//   .then((resp) => {
//     if ( !resp.token ) {
//       throw new Error( `Could not retrieve manifest from URL ${config.CredentialManifest}` );
//     }
//     config.manifest = JSON.parse(base64url.decode(resp.token.split(".")[1]));
//     // if you don't specify IssuerAuthority or VerifierAuthority in the config file, use the issuer DID from the manifest
//     if ( config.IssuerAuthority == "" ) {
//       config.IssuerAuthority = config.manifest.iss;
//     }
//     if ( config.VerifierAuthority == "" ) {
//       config.VerifierAuthority = config.manifest.iss;
//     }
//     if ( config.manifest.iss != config.IssuerAuthority ) {
//       throw new Error( `Wrong IssuerAuthority in config file ${config.IssuerAuthority}. Issuer in manifest is ${config.manifest.iss}` );
//     }
//   }); 

///////////////////////////////////////////////////////////////////////////////////////
// MSAL
var msalConfig = {
  auth: {
    clientId: config.azClientId,
    authority: `https://login.microsoftonline.com/${config.azTenantId}`,
    clientSecret: config.azClientSecret,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
};

// if certificateName is specified in config, then we change the MSAL config to use it
if (config.azCertificateName !== '') {
  const privateKeyData = fs.readFileSync(config.azCertificatePrivateKeyLocation, 'utf8');
  console.log(config.azCertThumbprint);
  const privateKeyObject = crypto.createPrivateKey({
    key: privateKeyData, format: 'pem',
    passphrase: config.azCertificateName.replace("CN=", "") // the passphrase is the appShortName (see Configure.ps1)    
  });
  msalConfig.auth = {
    clientId: config.azClientId,
    authority: `https://login.microsoftonline.com/${config.azTenantId}`,
    clientCertificate: {
      thumbprint: config.azCertThumbprint,
      privateKey: privateKeyObject.export({ format: 'pem', type: 'pkcs8' })
    }
  };
}

const cca = new msal.ConfidentialClientApplication(msalConfig);
const msalClientCredentialRequest = {
  scopes: ["3db474b9-6a0c-4840-96ac-1fceb342124f/.default"],
  skipCache: false,
};
module.exports.msalCca = cca;
module.exports.msalClientCredentialRequest = msalClientCredentialRequest;

 config.msIdentityHostName = "https://verifiedid.did.msidentity.com/v1.0/";

console.log(msalClientCredentialRequest) 
///////////////////////////////////////////////////////////////////////////////////////
// check that we a) can acquire an access_token and b) that it has the needed permission for this sample
cca.acquireTokenByClientCredential(msalClientCredentialRequest).then((result) => {
  if (!result.accessToken) {
    throw new Error(`Could not acquire access token. Check your configuration for tenant ${config.azTenantId} and clientId ${config.azClientId}`);
  } else {
    console.log(`access_token: ${result.accessToken}`);
    var accessToken = JSON.parse(base64url.decode(result.accessToken.split(".")[1]));
    if (accessToken.roles != "VerifiableCredential.Create.All") {
      throw new Error(`Access token do not have the required scope 'VerifiableCredential.Create.All'.`);
    }
  }
}).catch((error) => {
  console.log(error);
  throw new Error(`Could not acquire access token. Check your configuration for tenant ${config.azTenantId} and clientId ${config.azClientId}`);
});

///////////////////////////////////////////////////////////////////////////////////////
// Check if it is an EU tenant and set up the endpoint for it
fetch(`https://login.microsoftonline.com/${config.azTenantId}/v2.0/.well-known/openid-configuration`, { method: 'GET' })
  .then(res => res.json())
  .then((resp) => {
    console.log(`tenant_region_scope = ${resp.tenant_region_scope}`);
    config.tenant_region_scope = resp.tenant_region_scope;
    // Check that the Credential Manifest URL is in the same tenant Region and throw an error if it's not
    try {
      if (!config.CredentialManifest.startsWith(msIdentity)) {
        throw new Error('Error in config file. CredentialManifest URL configured for wrong tenant region. Should start with: ${msIdentity}');
      }
    }
    catch (error) {
      console.error("An error occurred:", error.message);
    }
  });

///////////////////////////////////////////////////////////////////////////////////////
// Main Express server function
// Note: You'll want to update port values for your setup.
const app = express()
const port = process.env.PORT || 4000;

var parser = bodyParser.urlencoded({ extended: false });

// Serve static files out of the /public directory
app.use(express.static('public'))

//app.use(bodyParser.json())


// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Set up a simple server side session store.
// The session store will briefly cache issuance requests
// to facilitate QR code scanning.
var sessionStore = new session.MemoryStore();
app.use(session({
  secret: 'cookie-secret-key',
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}))

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
  next();
});


//app.use(cors({ origin: 'http://localhost:3000',credentials: true, }));
app.use(cors());
module.exports.sessionStore = sessionStore;
module.exports.app = app;

function requestTrace(req) {
  var dateFormatted = new Date().toISOString().replace("T", " ");
  var h1 = '//****************************************************************************';
  console.log(`${h1}\n${dateFormatted}: ${req.method} ${req.protocol}://${req.headers["host"]}${req.originalUrl}`);
  console.log(`Headers:`)
  console.log(req.headers);
}

// echo function so you can test that you can reach your deployment
app.get("/echo",
  function (req, res) {
    requestTrace(req);
    res.status(200).json({
      'date': new Date().toISOString(),
      'api': req.protocol + '://' + req.hostname + req.originalUrl,
      'Host': req.hostname,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-original-host': req.headers['x-original-host'],
      'IssuerAuthority': config.IssuerAuthority,
      'VerifierAuthority': config.VerifierAuthority,
      'manifestURL': config.CredentialManifest,
      'clientId': config.azClientId,
      'configFile': configFile
    });
  }
);

// Serve index.html as the home page
app.get('/', function (req, res) {
  requestTrace(req);
  res.sendFile('public/index.html', { root: __dirname })
})


// app.post('/users', async (req, res) => {
//   const user = new User(req.body)
//   console.log(user)

//   try {
//     await user.save()

//     const token = await user.generateAuthToken()
//     res.status(201).send({ user, token })
//   } catch (e) {
//     console.log("error " + e)
//     res.status(400).send(e)
//   }
// })

// app.post('/users/bulk', async (req, res) => {
//   const usersToInsert = req.body

//   try {
//     const result = await User.insertMany(usersToInsert)



//     res.status(201).send({ result })
//   } catch (e) {
//     console.log("error " + e)
//     res.status(400).send(e)
//   }
// })

// app.post('/users/login', async (req, res) => {
//   try {
//     const user = await User.findByCredentials(req.body.email, req.body.password)
//     const token = await user.generateAuthToken()
//     res.send({ user, token })
//   } catch (e) {
//     res.status(400).send()
//   }
// })

// app.post('/users/logout', auth, async (req, res) => {
//   try {
//     req.user.tokens = req.user.tokens.filter((token) => {
//       return token.token !== req.token
//     })
//     await req.user.save()

//     res.send()
//   } catch (e) {
//     res.status(500).send()
//   }
// })

// app.post('/users/logoutAll', auth, async (req, res) => {
//   try {
//     req.user.tokens = []
//     await req.user.save()
//     res.send()
//   } catch (e) {
//     res.status(500).send()
//   }
// })

 var verifier = require('./verifier.js');
//var issuer = require('./issuer.js');
//var admin = require('./admin.js')

// start server
app.listen(port, () => console.log(`Example issuer app listening on port ${port}!`))
