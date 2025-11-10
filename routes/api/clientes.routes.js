/**
 * Rutas API v1 - Clientes
 * Endpoints REST para gestión de clientes y deudas
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

const express = require('express');
const router = express.Router();
const clientesApiController = require('../../controllers/api/clientes.api.controller');

// Rutas de clientes
router.get('/', clientesApiController.listarClientes);
router.get('/contribuyentes', clientesApiController.listarContribuyentes);
router.get('/buscar/dni/:dni', clientesApiController.obtenerClientePorDni);
router.get('/:codigo', clientesApiController.obtenerClientePorCodigo);
router.get('/:codigo/deudas', clientesApiController.obtenerDeudasPorCodigo);

// Rutas de pagos
router.post('/generar-pago', clientesApiController.generarJsonPago);

module.exports = router;