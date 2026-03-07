/**
 * Configuración Centralizada de Municipio
 * 
 * Este archivo lee la variable MUNICIPIO desde .env y exporta
 * las configuraciones correctas (BD y datos del municipio).
 * 
 * USO:
 *   const { sequelize, municipalidad, MUNICIPIO } = require('../config');
 * 
 * CAMBIAR MUNICIPIO:
 *   En .env: MUNICIPIO=manzano (o sanjosedelassalinas, etc.)
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2026-01-20
 */

require('dotenv').config();

const MUNICIPIO = process.env.MUNICIPIO || 'manzano';

// ============================================
// REGISTRO DE MUNICIPIOS DISPONIBLES
// ============================================
// Para agregar un nuevo municipio:
// 1. Crear database.config.NUEVO.js
// 2. Crear municipalidad.config.NUEVO.js
// 3. Agregar entrada aquí abajo

const municipiosDisponibles = {
  manzano: {
    database: () => require('./database.config.manzano'),
    municipalidad: () => require('./municipalidad.config.manzano')
  },
  sanjosedelassalinas: {
    database: () => require('./database.config.sanjosedelassalinas'),
    municipalidad: () => require('./municipalidad.config.sanjosedelassalinas')
  },
  tinoco: {
    database: () => require('./database.config.tinoco'),
    municipalidad: () => require('./municipalidad.config.tinoco')
  }
};

// ============================================
// VALIDACIÓN
// ============================================

if (!municipiosDisponibles[MUNICIPIO]) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERROR: Municipio no configurado                          ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error(`║  Municipio solicitado: "${MUNICIPIO}"`);
  console.error(`║  Municipios disponibles: ${Object.keys(municipiosDisponibles).join(', ')}`);
  console.error('║                                                              ║');
  console.error('║  Solución: Verificar variable MUNICIPIO en archivo .env      ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

// ============================================
// CARGA DE CONFIGURACIÓN
// ============================================

const config = municipiosDisponibles[MUNICIPIO];
const sequelize = config.database();
const municipalidad = config.municipalidad();

console.log(`🏛️  Municipio activo: ${municipalidad.nombreCompleto || MUNICIPIO}`);

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Identificador del municipio
  MUNICIPIO,

  // Conexión a base de datos (Sequelize instance)
  sequelize,

  // Datos del municipio (nombre, logo, dirección, etc.)
  municipalidad,

  // Lista de municipios disponibles (para debugging/admin)
  municipiosDisponibles: Object.keys(municipiosDisponibles)
};
