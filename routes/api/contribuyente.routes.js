/**
 * Portal de Pagos Municipal — Rutas API de Contribuyente
 * @description Expone endpoint protegido para obtener datos personales del contribuyente autenticado.
 *
 * Key Variables:
 *   router — Router de Express para /api/contribuyente.
 *
 * Exports:
 *   router — Configuración de rutas del contribuyente.
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const contribuyenteController = require('../../controllers/api/contribuyente.controller');

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
router.get('/:codigo', contribuyenteController.obtenerContribuyente);

module.exports = router;
