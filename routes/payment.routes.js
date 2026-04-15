/**
 * Rutas de Pago
 * Maneja redirects del gateway y el inicio del flujo de pago
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
 * POST /pagos/iniciar
 * Inicia el proceso de pago, llama al API Gateway y devuelve URL de redirección
 */
router.post('/iniciar', paymentController.iniciarPago);

/**
 * GET /pagos/exitoso
 * Página de pago exitoso (redirigido desde el gateway)
 */
router.get('/exitoso', paymentController.pagoExitoso);

/**
 * GET /pagos/error
 * Página de pago rechazado o inválido (redirigido desde el gateway)
 */
router.get('/error', paymentController.pagoFallido);
router.get('/fallido', paymentController.pagoFallido);

/**
 * GET /pagos/pendiente
 * Página de pago pendiente (redirigido desde el gateway)
 */
router.get('/pendiente', paymentController.pagoPendiente);

/**
 * GET /pagos/error-generico
 * Vista sin token válido o redirect inconsistente
 */
router.get('/error-generico', paymentController.pagoErrorGenerico);

module.exports = router;
