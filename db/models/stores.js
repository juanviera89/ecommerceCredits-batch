const {  DataTypes } = require('sequelize');

const model = {
    id : {
        type: DataTypes.INTEGER, 
        autoIncrement: true,
        allowNull: false , 
        unique: true ,
        primaryKey: true
    },
    clientId : {
        type: DataTypes.INTEGER ,
        allowNull: false 
    },
    name : {
        type: DataTypes.STRING(64)  ,
        allowNull: false
    }
}

const options = {
    timestamps: false
}

module.exports = {model, options};