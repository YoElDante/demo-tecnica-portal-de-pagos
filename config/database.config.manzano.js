/**
 * Configuración de la conexión a la base de datos Azure SQL - El Manzano
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-18
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('X9adQvSSfS5Hlhw', process.env.DB_USER, process.env.DB_PASS, {
  host: 'alcaldiasmlqdsprueba.database.windows.net',
  port: process.env.DB_PORT || 1433,
  dialect: process.env.DB_DIALECT || 'mssql',
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: false,
      hostNameInCertificate: '*.database.windows.net'
    }
  },
  logging: false // Desactivar logs para presentación
});

module.exports = sequelize;