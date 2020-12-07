const { Sequelize } = require('sequelize');

const clients = require('./clients.js'),
    stores = require('./stores.js'),
    credits = require('./credits.js')

const models = {}
const initModels = (sequelize) => {
    if (!(sequelize instanceof Sequelize)) {
        throw new Error('No DB connection instance provided');
    }

    models.client = sequelize.define('client', clients.model, clients.options);
    models.store = sequelize.define('store', stores.model, stores.options);
    models.credit = sequelize.define('credit', credits.model, credits.options);
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
}

module.exports = { initModels, models }