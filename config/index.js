/**
 * Configuración Centralizada de Municipio
 * 
 * Este archivo lee las variables de entorno y exporta:
 * - sequelize: Conexión a BD (ÚNICA para todos los municipios)
 * - municipalidad: Datos visuales del municipio (nombre, logo, etc.)
 * - MUNICIPIO: Identificador del municipio activo
 * 
 * USO:
 *   const { sequelize, municipalidad, MUNICIPIO } = require('../config');
 * 
 * CAMBIAR MUNICIPIO:
 *   En .env configurar:
 *   - MUNICIPIO=manzano (controla datos visuales)
 *   - DB_HOST, DB_NAME, DB_USER, DB_PASS (controla conexión a BD)
 * 
 * @author Dante Marcos Delprato
 * @version 2.0
 * @date 2026-03-09
 * @refactored Unificación de configuración de BD
 */

require('dotenv').config();

// ============================================
// VALIDACIÓN DE MUNICIPIO
// ============================================

const MUNICIPIO = process.env.MUNICIPIO;

if (!MUNICIPIO) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERROR: Variable MUNICIPIO no definida                    ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error('║  La variable MUNICIPIO es requerida para cargar los datos    ║');
  console.error('║  visuales del municipio (nombre, logo, dirección, etc.)      ║');
  console.error('║                                                              ║');
  console.error('║  Solución:                                                   ║');
  console.error('║    En .env agregar: MUNICIPIO=elmanzano                      ║');
  console.error('║    Valores: elmanzano, sanjosedelassalinas, tinoco           ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

// ============================================
// REGISTRO DE MUNICIPIOS DISPONIBLES
// ============================================
// Para agregar un nuevo municipio:
// 1. Copiar config/municipalidad.config.demo.js como municipalidad.config.NUEVO.js
// 2. Completar los datos del municipio en ese archivo
// 3. Agregar 'nuevo' a la lista de abajo
// 4. Crear carpeta public/images/NUEVO/ con los logos
// 5. Crear envs/.env.NUEVO con las credenciales de BD
// 6. Configurar variables de BD en Azure App Service para producción

const municipiosDisponibles = ['elmanzano', 'sanjosedelassalinas', 'tinoco', 'demo'];

if (!municipiosDisponibles.includes(MUNICIPIO)) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERROR: Municipio no configurado                          ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error(`║  Municipio solicitado: "${MUNICIPIO}"`);
  console.error(`║  Municipios disponibles: ${municipiosDisponibles.join(', ')}`);
  console.error('║                                                              ║');
  console.error('║  Solución: Verificar variable MUNICIPIO en archivo .env      ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

// ============================================
// CARGA DE CONFIGURACIÓN
// ============================================

// Base de datos: UN SOLO archivo para todos los municipios
// Las credenciales vienen de variables de entorno
const sequelize = require('./database.config');

// Datos del municipio: archivo específico según MUNICIPIO
const municipalidad = require(`./municipalidad.config.${MUNICIPIO}`);

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
  municipiosDisponibles
};
