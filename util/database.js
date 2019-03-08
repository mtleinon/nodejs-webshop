const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const passwords = require('../passwords/passwords');

let _db;

const mongoConnect = (callback) => {
    const connectionString = 'mongodb+srv://test:' 
            + passwords.test
            + '@cluster0-ipmon.mongodb.net/test?retryWrites=true';
    MongoClient.connect(connectionString, { useNewUrlParser: true })
        .then(client => { 
            console.log('Connected to Mango');
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log('CATCH: Mango ', err);
            throw err;
        });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

