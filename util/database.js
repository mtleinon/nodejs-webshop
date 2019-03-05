const Sequelize = require('sequelize');

const passwords = require('../passwords/passwords');

const sequelize = new Sequelize('node-complete', 'nodetest', passwords.nodetest, {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;