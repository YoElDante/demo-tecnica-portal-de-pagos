/**
 * Rutas de Pago
 * Maneja todas las rutas relacionadas con el proceso de pago
 * 
 * @author Generado para integración MP
 * @version 1.0
 * @date 2025-12-13
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// ============================================
// RUTAS PARA EL USUARIO (Vistas)
// ============================================

/**
 * POST /pago/iniciar
 * Inicia el proceso de pago, llama al API Gateway y devuelve URL de redirección
 */
router.post('/iniciar', paymentController.iniciarPago);

/**
 * GET /pago/exitoso
 * Página de pago exitoso (redirigido desde MercadoPago)
 */
router.get('/exitoso', paymentController.pagoExitoso);

/**
 * GET /pago/fallido
 * Página de pago fallido (redirigido desde MercadoPago)
 */
router.get('/fallido', paymentController.pagoFallido);

/**
 * GET /pago/pendiente
 * Página de pago pendiente (redirigido desde MercadoPago)
 */
router.get('/pendiente', paymentController.pagoPendiente);

module.exports = router;
