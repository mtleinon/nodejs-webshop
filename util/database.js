const mysql = require('mysql2');
const passwords = require('../passwords/passwords');
console.log(passwords);
const pool = mysql.createPool({
    host: 'localhost',
    user: 'nodetest',
    database: 'node-complete',
    password: passwords.nodetest
});

module.exports = pool.promise();