const { Sequelize } = require('sequelize');

const clients = require('./clients.js'),
    stores = require('./stores.js'),
    credits = require('./credits.js'),
    users = require('./users.js'),
    access_tokens = require('./access_tokens.js'),
    transactions = require('./transactions.js')

const models = {}
const initModels = (sequelize) => {
    if (!(sequelize instanceof Sequelize)) {
        throw new Error('No DB connection instance provided');
    }

    models.client = sequelize.define('client', clients.model, clients.options);
    models.store = sequelize.define('store', stores.model, stores.options);
    models.credit = sequelize.define('credit', credits.model, credits.options);
    models.user = sequelize.define('user', users.model, users.options);
    models.access_token = sequelize.define('access_token', access_tokens.model, access_tokens.options);
    models.access_token.removeAttribute('id') //remove auto added by sequelize id column 
    models.transaction = sequelize.define('transaction', transactions.model, transactions.options);
    models.client.hasMany(models.store);
    models.store.belongsTo(models.client, {
        foreignKey: 'id',
        as: 'clientStore', key: 'id'
    });
    models.store.hasOne(models.credit);
    models.credit.belongsTo(models.store, {
        foreignKey: 'id',
        as: 'storeCredits', key: 'id'
    });
    models.user.hasMany(models.access_token);
    models.access_token.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'userToken', key: 'userId'
    });
    models.user.hasMany(models.transaction);
    models.store.hasMany(models.transaction);
    models.transaction.belongsTo(models.store, {
        foreignKey: 'id',
        as: 'storeTransaction', key: 'id'
    });
    models.transaction.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'userTransaction', key: 'userId'
    });
}

module.exports = { initModels, models }