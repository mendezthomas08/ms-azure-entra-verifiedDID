// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Verifiable Credentials Issuer Sample

///////////////////////////////////////////////////////////////////////////////////////
// Node packages
var express = require('express')
var session = require('express-session')
const logger = require('./logger');
var base64url = require('base64url')
var secureRandom = require('secure-random');
var bodyParser = require('body-parser')
const multer = require('multer');
const { DefaultAzureCredential } = require("@azure/identity");
const {ManagedIdentityCredential} = require("@azure/identity");
// mod.cjs
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch((error)=> console.log("LINE Ni 14 catch block"));

// const request = require('request');

// const axios = require('axios');
const https = require('https')
const url = require('url')
const { SSL_OP_COOKIE_EXCHANGE } = require('constants');
var msal = require('@azure/msal-node');
var mainApp = require('./app.js');
//mainApp.app.use(bodyParser.json())
var body = bodyParser.json({ limit: '50mb' })
var parser = bodyParser.urlencoded({ extended: false });
const User = require('./models/user')
const AuthorizedUser = require('./models/authorizedUser')
const auth = require('./middleware/auth')

///////////////////////////////////////////////////////////////////////////////////////
// Setup the issuance request payload template
//////////// Setup the issuance request payload template

var requestConfigFile = process.argv.slice(2)[1];
if ( !requestConfigFile ) {
  requestConfigFile = process.env.ISSUANCEFILE || './issuance_request_config.json';
}
var issuanceConfig = require( requestConfigFile );
issuanceConfig.registration.clientName = "Node.js Verified ID sample";


// get the manifest from config.json, this is the URL to the credential created in the azure portal. 
// the display and rules file to create the credential can be found in the credentialfiles directory
// make sure the credentialtype in the issuance payload ma

//issuanceConfig.manifest = mainApp.config["CredentialManifest"]
// if there is pin code in the config, but length is zero - remove it. It really shouldn't be there




if ( issuanceConfig.pin && issuanceConfig.pin.length == 0 ) {
  issuanceConfig.pin = null;
}
if ( issuanceConfig.callback.headers ) {
  issuanceConfig.callback.headers['api-key'] = mainApp.config["apiKey"];
}

// console.log( `api-key: ${mainApp.config["apiKey"]}` );

function requestTrace( req ) {
  
  var dateFormatted = new Date().toISOString().replace("T", " ");
  var h1 = '//****************************************************************************';
  console.log( `${h1}\n${dateFormatted}: ${req.method} ${req.protocol}://${req.headers["host"]}${req.originalUrl}` );
  console.log( `Headers:`)
  console.log(req.headers);
}
var getToken = async () => {
  logger.info('Get token function started');
  var accessToken = "";
  try {
   
    const result = await mainApp.msalCca.acquireTokenByClientCredential({
      scopes: [ '3db474b9-6a0c-4840-96ac-1fceb342124f/.default' ],
      skipCache: false
    });
    logger.info('The Token:');
    console.log("Result: ++++++++++++++++++++++++++++++++++++++++++")
    console.log(result.accessToken)
    if (result) {
      accessToken = result.accessToken;
    }
  } catch {
    console.log("failed to get access token");
    // res.status(401).json({
    //   'error': 'Could not acquire credentials to access your Azure Key Vault'
    // });
    return;
  }
  logger.info("Access token generated: " + accessToken);
  return accessToken

}
function generatePin( digits ) {
  logger.info('Pin generation for random checks');
  var add = 1, max = 12 - add;
  max        = Math.pow(10, digits+add);
  var min    = max/10; // Math.pow(10, n) basically
  var number = Math.floor( Math.random() * (max - min + 1) ) + min;
  return ("" + number).substring(add); 
}
/**
 * This method is called from the UI to initiate the issuance of the verifiable credential
 */
// mainApp.app.get('/api/issuer/issuance-request', async (req, res) => {
//   requestTrace( req );
//   console.log("*****+++++++++++++++++++++++++++++++++******************")
//   //console.log(req.query)
//   var issuanceConfig1 = JSON.parse(req.query.issuanceConfig)
//   //console.log(issuanceConfig1)
  

// issuanceConfig.manifest = issuanceConfig1.manifest
// issuanceConfig.type = issuanceConfig1.type


//   var id = req.session.id;
//   // prep a session state of 0
//   mainApp.sessionStore.get( id, (error, session) => {
//     var sessionData = {
//       "status" : 0,
//       "message": "Waiting for QR code to be scanned"
//     };
//     if ( session ) {
//       session.sessionData = sessionData;
//       mainApp.sessionStore.set( id, session);  
//     }
//   });

//   // get the Access Token
//   var accessToken = await getToken()
  
//   console.log( `accessToken: ${accessToken}` );

//   issuanceConfig.authority = issuanceConfig1.authority
//   // modify the callback method to make it easier to debug 
//   // with tools like ngrok since the URI changes all the time
//   // this way you don't need to modify the callback URL in the payload every time
//   // ngrok changes the URI
//   issuanceConfig.callback.url = `https://${req.hostname}/api/issuer/issuance-request-callback`;
//   // modify payload with new state, the state is used to be able to update the UI when callbacks are received from the VC Service
//   issuanceConfig.callback.state = id;
//   // check if pin is required, if found make sure we set a new random pin
//   // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
//   if ( issuanceConfig.pin ) {
//     // don't use pin if user is on mobile device
//     if ( req.headers["user-agent"].includes("Android") || req.headers["user-agent"].includes('iPhone')) {
//       delete issuanceConfig.pin;
//     } else {
//       issuanceConfig.pin.value = generatePin( issuanceConfig.pin.length );
//     }
//   }
//   // here you could change the payload manifest and change the firstname and lastname
//   issuanceConfig.claims = issuanceConfig1.claims
//   if ( issuanceConfig.claims ) {
//     // if ( issuanceConfig.claims.given_name ) {
//     //   issuanceConfig.claims.given_name = req.query.firstName;
      
//     // }
//     // if ( issuanceConfig.claims.family_name ) {
//     //   issuanceConfig.claims.family_name = req.query.lastName;
      
//     // }
//     // if ( issuanceConfig.claims.given_age ) {
//     //   issuanceConfig.claims.given_age = req.query.age;
      
//     // }
//   }

//   console.log( 'Request Service API Request' );
//   var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/createIssuanceRequest`;
//   console.log( client_api_request_endpoint );
//   console.log(issuanceConfig)
//   var payload = JSON.stringify(issuanceConfig);
//   console.log(payload)
//   const fetchOptions = {
//     url: client_api_request_endpoint,
//     method: 'POST',
//     body: payload,
//     json: true,
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': payload.length.toString(),
//       'Authorization': `Bearer ${accessToken}`
//     }
//   };
//   // try {
//   //   const response = await axios.post(
//   //     client_api_request_endpoint,
//   //     payload,
//   //     {
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //         'Content-Length': payload.length.toString(),
//   //         Authorization: `Bearer ${accessToken}`,
//   //       },
        
//   //     }
//   //   );

//   //   console.log('Response:', response.data);
//   // } catch (error) {
//   //   console.error('Error:', error.message);
//   // }  
//   // request(fetchOptions, (error, response, body) => {
//   //   if (error) {
//   //     console.error('Error:', error);
//   //   } else {
//   //     console.log("*********")
//   //     console.log('Response:', body);
//   //   }
//   // });

//   const response = await fetch(client_api_request_endpoint, fetchOptions);
  
//   var resp = await response.json()
//   // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
//   // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
//   // the javascript in the UI will use that QR code to display it on the screen to the user.            
//   resp.id = id;                              // add session id so browser can pull status
//   if ( issuanceConfig.pin ) {
//     resp.pin = issuanceConfig.pin.value;   // add pin code so browser can display it
//   }
//   console.log( 'VC Client API Response' );
//   console.log( response.status );
//   console.log( resp );  
//   if ( response.status > 299 ) {
//     res.status(400).json( resp.error );  
// } else {
//     res.status(200).json( resp );       
//   }
// })
/**
 * This method is called by the VC Request API when the user scans a QR code and presents a Verifiable Credential to the service
 */
mainApp.app.post('/api/issuer/issuance-request-callback', parser, async (req, res) => {
  logger.info('Issuance request API started');
  var body = '';
  req.on('data', function (data) {
    console.log("Inside callback function")
    body += data;
  });
  req.on('end', function () {
    logger.info('function body print');
    requestTrace( req );
    console.log("****************************")
    console.log("Before Printing body")
    console.log( body );
    // the api-key is set at startup in app.js. If not present in callback, the call should be rejected
    if ( req.headers['api-key'] != mainApp.config["apiKey"] ) {
      res.status(401).json({'error': 'api-key wrong or missing'});  
      return; 
    }
    logger.info("Inside callback function");
    var issuanceResponse = JSON.parse(body.toString());
    console.log(issuanceResponse)
    var cacheData;
    switch ( issuanceResponse.requestStatus ) {
      // this callback signals that the request has been retrieved (QR code scanned, etc)
      case "request_retrieved":
        cacheData = {
          "status": issuanceResponse.requestStatus,
          "message": "QR Code is scanned. Waiting for validation..."
        };
      break;
      // this callback signals that issuance of the VC was successful and the VC is now in the wallet
      case "issuance_successful":
        var cacheData = {
          "status" : issuanceResponse.requestStatus,
          "message": "Credential successfully issued"
        };
      break;
      // this callback signals that issuance did not complete. It could be for technical reasons or that the user didn't accept it
      case "issuance_error":
        var cacheData = {
          "status" : issuanceResponse.requestStatus,
          "message": issuanceResponse.error.message,
          "payload": issuanceResponse.error.code
        };
      break;
      default:
        console.log( `400 - Unsupported requestStatus: ${issuanceResponse.requestStatus}` );
        res.status(400).json({'error': `Unsupported requestStatus: ${issuanceResponse.requestStatus}`});      
        return;
    }
    // store the session state so the UI can pick it up and progress
    mainApp.sessionStore.get( issuanceResponse.state, (error, session) => {
      if ( session ) {
        session.sessionData = cacheData;
        mainApp.sessionStore.set( issuanceResponse.state, session, (error) => {
          console.log( "200 - OK");
          res.status(200).send();
        });
      } else {
        console.log( `400 - Unknown state: ${issuanceResponse.state}` );
        res.status(400).json({'error': `Unknown state: ${issuanceResponse.state}`});      
        return;
      }
    })      
  });  
})

var getTokenForGetAllContracts = async () => {
  logger.info('getTokenForGetAllContracts API started')
  var accessToken = "";
  try {
    var msalClientCredentialRequest2 = mainApp.msalClientCredentialRequest
    console.log(msalClientCredentialRequest2)  
    msalClientCredentialRequest2.scopes = ["6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default"]
    console.log(msalClientCredentialRequest2)
    const result = await mainApp.msalCca.acquireTokenByClientCredential(msalClientCredentialRequest2);
    if (result) {
      accessToken = result.accessToken;
      return accessToken
    }
  } catch (error){
    console.error(error);
    console.log("failed to get access token");
    // res.status(401).json({
    //   'error': 'Could not acquire credentials to access your Azure Key Vault'
    // });
    return;
  }

  return accessToken

}


async function getTokenForAdminApi() {

  const resource = "6a8b4b39-c021-437c-b060-5a14a3fd65f3";

// Create a DefaultAzureCredential
//const credential = new DefaultAzureCredential();
const credential = new ManagedIdentityCredential();
// Use the credential to acquire a token for the specified resource
try{
const tokenResponse = await credential.getToken(resource);
const accessToken = tokenResponse.token;
console.log(accessToken)
return accessToken;
}
catch (error) {
  console.error("Failed to acquire a token:", error);
}


}

mainApp.app.get('/api/admin/verifiableCredentials/authorities/:authorityId', async (req, res) => {
logger.info('Get API for authorities by authorityID');
  var accessToken = await getTokenForGetAllContracts()

  var authorityId = req.params.authorityId

  console.log(`accessToken: ${accessToken}`);

  var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/authorities/${authorityId}`;

  console.log(client_api_request_endpoint)
  const response = await fetch(client_api_request_endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  // var resp = await response.json()

  // if (response.status > 299) {
  //   res.status(400).json(resp.error);
  // } else {
  //   res.status(200).json(resp);
  // }
  const responseBody = await response.json();

    // Check if the response status is not in the 2xx range
    if (response.status < 200 || response.status >= 300) {
      // Handle the error scenario with an appropriate status code
      res.status(response.status).json(responseBody.error || "Unknown Error");
    } else {
      // Return a success response with a 200 status code
      res.status(200).json(responseBody);
    }

})

//Contracts......
//no request body
mainApp.app.get('/api/issuer/verifiableCredentials/authorities/:authorityId/contracts/:contractId', async (req, res) => {
logger.info('Contracts API');
  const authId = req.params.authorityId;
  const conId = req.params.contractId;
  console.log(authId)
  console.log(conId)
  var accessToken = await getTokenForGetAllContracts()

  console.log(`accessToken: ${accessToken}`);

  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  }

  var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/authorities/${authId}/contracts/${conId}`;

  console.log(client_api_request_endpoint)
  const response = await fetch(client_api_request_endpoint, fetchOptions)

  const responseBody = await response.json();

    // Check if the response status is not in the 2xx range
    if (response.status < 200 || response.status >= 300) {
      // Handle the error scenario with an appropriate status code
      res.status(response.status).json(responseBody.error || "Unknown Error");
    } else {
      // Return a success response with a 200 status code
      res.status(200).json(responseBody);
    }

})

//List contracts
//This API lists all contracts configured in the current tenant for the specified authority.
//no request body
mainApp.app.get('/api/issuer/verifiableCredentials/authorities/:authorityId/contracts', async (req, res) => {
logger.info('API lists all contracts configured in the current tenant for the specified authority');
  var accessToken = await getTokenForGetAllContracts()
  //var accessToken = await getTokenForAdminApi()

  console.log(`accessToken: ${accessToken}`);

  const fetchOptions = {
    method: 'GET',

    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  }

  var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/authorities/${req.params.authorityId}/contracts`;
  console.log(client_api_request_endpoint)

  const response = await fetch(client_api_request_endpoint, fetchOptions)
  console.log(response.json)
  const responseBody = await response.json();

    // Check if the response status is not in the 2xx range
    if (response.status < 200 || response.status >= 300) {
      // Handle the error scenario with an appropriate status code
      res.status(response.status).json(responseBody.error || "Unknown Error");
    } else {
      // Return a success response with a 200 status code
      res.status(200).json(responseBody);
    }
})

//create contract
mainApp.app.post('/api/issuer/verifiableCredentials/authorities/:authorityId/contracts', body,async (req, res) => {
logger.info('API to create contracts started here')
  var accessToken = await getTokenForAdminApi()

  console.log(`accessToken: ${accessToken}`);

  const fetchOptions = {
    method: 'POST',
    body: JSON.stringify(req.body),
    json: true,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  }
  console.log(JSON.stringify(req.body))


  var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/authorities/${req.params.authorityId}/contracts`;

  const response = await fetch(client_api_request_endpoint, fetchOptions)

//  var resp = await response.json()

  const responseBody = await response.json();

    // Check if the response status is not in the 2xx range
    if (response.status < 200 || response.status >= 300) {
      // Handle the error scenario with an appropriate status code
      res.status(response.status).json(responseBody.error || "Unknown Error");
    } else {
      // Return a success response with a 200 status code
      res.status(201).json(responseBody);
    }

})

/////////////////////new code for get to post api/////////////////

mainApp.app.post('/api/issuer/issuance-request', body,auth, async (req, res) => {
  logger.info('API issuance-request API started');
  requestTrace( req );
  console.log("*****+++++++++++++++++++++++++++++++++******************")
  console.log(req.body)
  var issuanceConfig1 = req.body
  console.log(issuanceConfig1)


issuanceConfig.manifest = issuanceConfig1.manifest
issuanceConfig.type = issuanceConfig1.type


  var id = req.session.id;
  // prep a session state of 0
  mainApp.sessionStore.get( id, (error, session) => {
    var sessionData = {
      "status" : 0,
      "message": "Waiting for QR code to be scanned"
    };
    if ( session ) {
      session.sessionData = sessionData;
      mainApp.sessionStore.set( id, session);
    }
  });

  // get the Access Token
  var accessToken = await getToken()

  console.log( `accessToken: ${accessToken}` );

  issuanceConfig.authority = issuanceConfig1.authority
  // modify the callback method to make it easier to debug
  // with tools like ngrok since the URI changes all the time
  // this way you don't need to modify the callback URL in the payload every time
  // ngrok changes the URI
  issuanceConfig.callback.url = `https://${req.hostname}/api/issuer/issuance-request-callback`;
  // modify payload with new state, the state is used to be able to update the UI when callbacks are received from the VC Service
  issuanceConfig.callback.state = id;
  // check if pin is required, if found make sure we set a new random pin
  // pincode is only used when the payload contains claim value pairs which results in an IDTokenhint
  if ( issuanceConfig.pin ) {
    // don't use pin if user is on mobile device
    if ( req.headers["user-agent"].includes("Android") || req.headers["user-agent"].includes('iPhone')) {
      delete issuanceConfig.pin;
    } else {
      issuanceConfig.pin.value = generatePin( issuanceConfig.pin.length );
    }
  }
  // here you could change the payload manifest and change the firstname and lastname
  issuanceConfig.claims = issuanceConfig1.claims
  if ( issuanceConfig.claims ) {
    // if ( issuanceConfig.claims.given_name ) {
    //   issuanceConfig.claims.given_name = req.query.firstName;

    // }
    // if ( issuanceConfig.claims.family_name ) {
    //   issuanceConfig.claims.family_name = req.query.lastName;

    // }
    // if ( issuanceConfig.claims.given_age ) {
    //   issuanceConfig.claims.given_age = req.query.age;

    // }
  }

  console.log( 'Request Service API Request' );
  var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/createIssuanceRequest`;
  console.log( client_api_request_endpoint );
  console.log(issuanceConfig)
  var payload = JSON.stringify(issuanceConfig);
  console.log(payload)
  const fetchOptions = {
    url: client_api_request_endpoint,
    method: 'POST',
    body: payload,
    json: true,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length.toString(),
      'Authorization': `Bearer ${accessToken}`
    }
  };
  // try {
  //   const response = await axios.post(
  //     client_api_request_endpoint,
  //     payload,
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Content-Length': payload.length.toString(),
  //         Authorization: `Bearer ${accessToken}`,
  //       },

  //     }
  //   );

  //   console.log('Response:', response.data);
  // } catch (error) {
  //   console.error('Error:', error.message);
  // }
  // request(fetchOptions, (error, response, body) => {
  //   if (error) {
  //     console.error('Error:', error);
  //   } else {
  //     console.log("*********")
  //     console.log('Response:', body);
  //   }
  // });

  const response = await fetch(client_api_request_endpoint, fetchOptions);

  var resp = await response.json()
  // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
  // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
  // the javascript in the UI will use that QR code to display it on the screen to the user.
  resp.id = id;                              // add session id so browser can pull status
  if ( issuanceConfig.pin ) {
    resp.pin = issuanceConfig.pin.value;   // add pin code so browser can display it
  }
  console.log( 'VC Client API Response' );
  console.log( response.status );
  console.log( resp );
  if ( response.status > 299 ) {
    res.status(400).json( resp.error );
} else {
    res.status(200).json( resp );
  }
})

/**
 * this function is called from the UI polling for a response from the AAD VC Service.
 * when a callback is received at the presentationCallback service the session will be updated
 * this method will respond with the status so the UI can reflect if the QR code was scanned and with the result of the presentation
 */
mainApp.app.get('/api/issuer/issuance-response', async (req, res) => {
  logger.info('issuance-response API started')
  var id = req.query.id;
  requestTrace( req );
  mainApp.sessionStore.get( id, (error, session) => {
    if (session && session.sessionData) {
      console.log(`200 - status: ${session.sessionData.status}, message: ${session.sessionData.message}`);
      res.status(200).json(session.sessionData);   
    } else {
      console.log("Iside issuance response")
      console.log( `400 - Unknown state: ${id}` );
      res.status(400).json({'error': `Unknown state: ${id}`});      
    }
  })
})

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg');
  },
});
const upload = multer({ storage: storage });

// // Simple in-memory database for user data
// const users = [];
// // Simulated in-memory database
// const authorizedUsers = new Set();
//const authorizedUsers = new Set();
//const authorizationLinks = new Map(); // Store links with their associated emails
// Azure Face API endpoint and subscription key
const azureFaceApiEndpoint = 'YOUR_AZURE_FACE_API_ENDPOINT';
const azureFaceApiKey = 'YOUR_AZURE_FACE_API_KEY';

//this code is old one for register user
// mainApp.app.post('/api/holder/register',body,async (req,res) => {
//   try {
//     // Parse user data from the request
//     const { name, email ,password,authorizationLink} = req.body;
//     console.log('Name:', name);
//     console.log('Email:', email);
//     console.log('Authorization Link:', authorizationLink);

//     // Check if the link is valid

//     const authorisedUser = await AuthorizedUser.findOne({name,email,authorizationLink})
//     if(!authorisedUser){
//       return res.status(403).json({ message: 'Invalid authorization link.' });
//     }
    
//     const user = new User({name,email,password})
//     await user.save()
    
    
//     res.status(201).json({ message: 'User registered successfully.' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error during registration.' });
//   }
  
// })
mainApp.app.post('/api/holder/register',body,async (req,res) => {
  try {
    logger.info("Register API started here");
    // Parse user data from the request
    const { name, email ,password,authorizationLink} = req.body;

    // Check if required fields are provided
    if (!name || !email || !password || !authorizationLink) {
      logger.warn("Name or Email or Password not filled");
      return res.status(400).json({ message: 'All fields are required.' });
  }
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Authorization Link:', authorizationLink);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Invalid Email farmat");
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Check if the link is valid
    const authorisedUser = await AuthorizedUser.findOne({name,email,authorizationLink})
    if(!authorisedUser){
      logger.warn("Invalid authorization link");
      return res.status(403).json({ message: 'Invalid authorization link.' });
    }
   
    const user = new User({name,email,password})
    await user.save()
    logger.info("Register API registered successfully");
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Error during registration.' });
  }
  
})


// Endpoint for issuer to authorize users
mainApp.app.post('/api/issuer/authorize',body,async (req, res) => {
  try {
    logger.info("Authorize API started here");
    const { name,email } = req.body;
    // Check if required fields are provided
    if (!name || !email) {
      logger.warn("Name or Email not entered");
      return res.status(400).json({ message: 'Name and email are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Invalid Email farmat");
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    const authorizationLink = generateSecureLink(email);

    
    // Store the link with the associated email
    const authorizedUser = new AuthorizedUser({name,email,authorizationLink})
    
    // authorizationLinks.set(email, authorizationLink);
    // console.log(authorizationLinks)
    await authorizedUser.save()
    logger.info("Authorize API successful");
    console.log("Name: ", name);
	  console.log("Email: ", email);
    res.status(200).json({ authorizationLink });
  } catch (error) {
    logger.error("Error during registration:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tenant already exist.' });
  }
    res.status(500).json({ message: 'Error during link generation.' });
  }
});

const crypto = require('crypto');

// Function to generate a secure link
const generateSecureLink = (email) => {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');

  // Create a secure link using the token and user's email
  const secureLink = `https://holder.com/authorize?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  return secureLink;
};

mainApp.app.post('/users/login',body,async (req, res) => {
  try {
   logger.info("Login API strated here");
   const { email,password } = req.body;
    // Check if required fields are provided
    if (!password || !email) {
      logger.warn("Email or Password- not filled");
      return res.status(400).json({ message: 'Name and password are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Invalid Email farmat");
        return res.status(400).json({ message: 'Invalid email format.' });
    }
    const user = await User.findByCredentials(req.body.email, req.body.password)
    if (!user) {
      logger.warn("Invalid email or password");
      return res.status(401).json({ message: 'Invalid email or password.' });
  }
    const token = await user.generateAuthToken()
    logger.info("Logging successful");
    res.status(200).json({ user, token });
  } catch (e) {
    logger.error("Error during login:", error);
    res.status(400).send()
  }
})

mainApp.app.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()

    res.send()
  } catch (e) {
    res.status(500).send()
  }
})


mainApp.app.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

mainApp.app.get('/api/issuer/get-manifest', async (req, res) => {
  var id = req.query.id;
  requestTrace( req );
  res.status(200).json(mainApp.config["manifest"]);   
})
