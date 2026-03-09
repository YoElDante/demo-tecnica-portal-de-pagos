/**
 * Configuración ÚNICA de conexión a Base de Datos
 * 
 * Este archivo reemplaza a los archivos individuales por municipio:
 * - database.config.elmanzano.js (OBSOLETO)
 * - database.config.sanjosedelassalinas.js (OBSOLETO)
 * - database.config.tinoco.js (OBSOLETO)
 * 
 * Todas las credenciales se leen de variables de entorno.
 * En Azure App Service, configurar estas variables en:
 * Configuración → Configuración de la aplicación
 * 
 * Variables requeridas:
 * - DB_HOST: Host del servidor (ej: xxx.database.windows.net)
 * - DB_NAME: Nombre de la base de datos
 * - DB_USER: Usuario de la base de datos
 * - DB_PASS: Contraseña de la base de datos
 * 
 * Variables opcionales:
 * - DB_PORT: Puerto (default: 1433)
 * - DB_DIALECT: Dialecto SQL (default: mssql)
 * - NODE_ENV: Entorno (development|test|production)
 * 
 * @author Dante Marcos Delprato
 * @version 2.0
 * @date 2026-03-09
 * @refactored-from Archivos individuales por municipio
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// ============================================
// VALIDACIÓN DE VARIABLES REQUERIDAS
// ============================================

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERROR: Faltan variables de entorno de Base de Datos      ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error(`║  Variables faltantes: ${missing.join(', ')}`);
  console.error('║                                                              ║');
  console.error('║  En DESARROLLO:                                              ║');
  console.error('║    - Crear archivo .env con las variables requeridas         ║');
  console.error('║    - O copiar desde envs/.env.{municipio}                    ║');
  console.error('║                                                              ║');
  console.error('║  En AZURE APP SERVICE:                                       ║');
  console.error('║    - Configuración → Configuración de la aplicación          ║');
  console.error('║    - Agregar las variables faltantes                         ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

// ============================================
// CONFIGURACIÓN DE SEQUELIZE
// ============================================

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 1433,
    dialect: process.env.DB_DIALECT || 'mssql',

    // Opciones específicas para Azure SQL
    dialectOptions: {
      options: {
        encrypt: true,                              // Obligatorio para Azure
        trustServerCertificate: false,
        hostNameInCertificate: '*.database.windows.net'
      }
    },

    // Logging: solo en desarrollo
    logging: process.env.NODE_ENV === 'development'
      ? (msg) => console.log(`[SQL] ${msg}`)
      : false,

    // Pool de conexiones
    pool: {
      max: 5,           // Máximo de conexiones en el pool
      min: 0,           // Mínimo de conexiones en el pool
      acquire: 30000,   // Tiempo máximo para obtener conexión (ms)
      idle: 10000       // Tiempo máximo de inactividad antes de liberar (ms)
    }
  }
);

// ============================================
// LOG DE CONEXIÓN (solo info básica, sin credenciales)
// ============================================

if (process.env.NODE_ENV === 'development') {
  console.log(`📊 Base de datos configurada:`);
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Usuario: ${process.env.DB_USER}`);
}

module.exports = sequelize;
