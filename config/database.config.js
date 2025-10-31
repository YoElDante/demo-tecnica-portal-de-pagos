/**
 * Configuración de la conexión a la base de datos Azure SQL usando Sequelize.
 *
 * Utiliza variables de entorno para la configuración sensible.
 * Requiere las siguientes variables en el archivo .env:
 * - DB_HOST: Host de la base de datos
 * - DB_NAME: Nombre de la base de datos
 * - DB_USER: Usuario de la base de datos
 * - DB_PASS: Contraseña de la base de datos
 * - DB_DIALECT: Dialecto de la base de datos (ej. 'mssql')
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-09-20
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  dialectOptions: {
    options: {
      encrypt: true, // obligatorio para Azure
      trustServerCertificate: false, // true si no se usa SSL
    }
  },
  logging: true // opcional, false para no mostrar logs de SQL
});

module.exports = sequelize;
