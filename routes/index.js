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

// Página principal
router.get('/', webController.renderIndex);

// Búsqueda de cliente por DNI
router.post('/buscar', webController.buscarPorDni);

// Generación de ticket de pago
router.post('/generar-ticket', ticketController.generarTicket);

module.exports = router;