/**
 * Configuración de la conexión a la base de datos Azure SQL - San José de las Salinas
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-11
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('s586W5bxyqU7VDu', process.env.DB_USER, process.env.DB_PASS, {
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