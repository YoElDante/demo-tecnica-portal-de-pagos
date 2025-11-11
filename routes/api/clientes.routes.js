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
const {
  validatePagination,
  validateDni,
  validateCodigo,
  validateGenerarPago
} = require('../../middlewares/validator');
const pagination = require('../../middlewares/pagination');

// Rutas de clientes
router.get('/', validatePagination, pagination, clientesApiController.listarClientes);
router.get('/contribuyentes', validatePagination, pagination, clientesApiController.listarContribuyentes);
router.get('/buscar/dni/:dni', validateDni, clientesApiController.obtenerClientePorDni);
router.get('/:codigo', validateCodigo, clientesApiController.obtenerClientePorCodigo);
router.get('/:codigo/deudas', validateCodigo, clientesApiController.obtenerDeudasPorCodigo);

// Rutas de pagos
router.post('/generar-pago', validateGenerarPago, clientesApiController.generarJsonPago);

module.exports = router;