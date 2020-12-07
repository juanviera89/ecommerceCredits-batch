const {  DataTypes } = require('sequelize');

const model = {
    id : {
        type: DataTypes.INTEGER, 
        autoIncrement: true,
        primaryKey: true
    },
    email : {
        type: DataTypes.STRING(64) ,
        allowNull: false , 
        unique: true
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