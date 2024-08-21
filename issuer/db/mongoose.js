const mongoose = require('mongoose')


// Retrieve MongoDB connection string from environment variable
const mongoConnectionString = process.env.MONGODB_CONNECTION_STRING;
mongoose.connect(mongoConnectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})
