const { Sequelize } = require('sequelize');
const config = require('config');
const sequelize = new Sequelize(config.get('db.dbname'), config.get('db.username'), config.get('db.secret'), { 
    host: config.get('db.host'),
    port: config.get('db.port'),
    logging: ['development', 'test'].includes((process.env.NODE_ENV || '').toLowerCase())  ? console.log : false,
    dialect: config.get('db.dialect'),
    dialectOptions: {
        encrypt: true,
        options: { requestTimeout: 90000 } //tedious connection timeout
    }
});

module.exports = sequelize;