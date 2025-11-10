/**
 * API v1 - Router Principal
 * Punto de entrada para todas las rutas API v1
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

const express = require('express');
const router = express.Router();

// Importar rutas específicas
const clientesRoutes = require('./clientes.routes');

// Documentación de la API
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'API Portal de Pagos Municipal',
    description: 'API REST para gestión de clientes y deudas',
    endpoints: {
      clientes: '/api/clientes',
      contribuyentes: '/api/clientes/contribuyentes',
      buscarPorDni: '/api/clientes/buscar/dni/:dni',
      deudas: '/api/clientes/:codigo/deudas',
      generarPago: '/api/clientes/generar-pago'
    },
    documentation: 'Próximamente: Swagger UI'
  });
});

// Montar rutas
router.use('/clientes', clientesRoutes);

module.exports = router;