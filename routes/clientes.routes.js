/**
 * Rutas para gestión de clientes
 * Versión CommonJS
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-10-30
 */

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clientes.controller');

// Listado de rutas para la API
router.get('/', (req, res) => {
  res.json({
    mensaje: 'API de clientes funcionando',
    endpoints: [
      'GET /api/clientes - Lista todos los clientes',
      'GET /api/clientes/contribuyentes - Lista contribuyentes con cantidad de deudas',
      'GET /api/clientes/deudas/:codigo - Obtiene deudas por código',
      'GET /api/clientes/buscar/dni/:dni - Busca cliente por DNI',
      'POST /api/clientes/generar-pago - Genera JSON de pago'
    ]
  });
});

// Listado de Rutas de Clientes
router.get('/clientes/deudas/:codigo', clienteController.obtenerDeudasPorCodigo);
router.get('/clientes', clienteController.obtenerTodosClientes);
router.post('/clientes/generar-pago', clienteController.generarJsonPago);
router.get('/clientes/buscar/dni/:dni', clienteController.obtenerClientePorDni);
router.get('/clientes/contribuyentes', clienteController.listarContribuyentes);


module.exports = router;