/**
 * Rutas Web (Views)
 * Rutas que renderizan vistas EJS
 * 
 * @author Dante Marcos Delprato
 * @version 2.0
 * @date 2025-11-08
 */

const express = require('express');
const router = express.Router();
const webController = require('../controllers/web.controller');
const ticketController = require('../controllers/web.ticket.controller');
const { sequelize } = require('../config');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ============================================
// Health Check (Azure App Service)
// ============================================
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness check: valida dependencias críticas (BD)
router.get('/health/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      status: 'READY',
      db: 'OK',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (!IS_PRODUCTION) {
      const errorCode = error?.original?.code || error?.parent?.code || error?.code;
      return res.status(503).json({
        status: 'NOT_READY',
        db: 'ERROR',
        reason: 'database-unavailable',
        error_code: errorCode || 'UNKNOWN',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(503).json({
      status: 'NOT_READY',
      reason: 'service-unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Página principal
router.get('/', webController.renderIndex);

// Búsqueda de cliente por DNI
router.post('/buscar', webController.buscarPorDni);

// Generación de ticket de pago
router.post('/generar-ticket', ticketController.generarTicket);

module.exports = router;