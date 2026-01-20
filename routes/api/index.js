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
const paymentController = require('../../controllers/payment.controller');

// Documentación de la API
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'API Portal de Pagos Municipal - Demo',
    description: 'API REST para gestión de clientes, deudas y pagos',
    base_url: '/api',
    endpoints: {
      // === CLIENTES ===
      clientes: {
        listar: {
          method: 'GET',
          path: '/api/clientes',
          descripcion: 'Lista todos los clientes con paginación',
          parametros: '?page=1&limit=50'
        },
        contribuyentes: {
          method: 'GET',
          path: '/api/clientes/contribuyentes',
          descripcion: 'Lista contribuyentes con cantidad de deudas',
          parametros: '?page=1&limit=50'
        },
        buscarPorDni: {
          method: 'GET',
          path: '/api/clientes/buscar/dni/:dni',
          descripcion: 'Busca cliente por DNI',
          ejemplo: '/api/clientes/buscar/dni/12345678'
        },
        obtenerPorCodigo: {
          method: 'GET',
          path: '/api/clientes/:codigo',
          descripcion: 'Obtiene cliente por código interno'
        },
        deudas: {
          method: 'GET',
          path: '/api/clientes/:codigo/deudas',
          descripcion: 'Obtiene deudas de un cliente por su código'
        },
        generarPago: {
          method: 'POST',
          path: '/api/clientes/generar-pago',
          descripcion: 'Genera JSON de pago para conceptos seleccionados',
          body: '{ codigo, conceptos_ids: [1,2,3] }'
        }
      },
      // === PAGOS (Webhook) ===
      pagos: {
        confirmacion: {
          method: 'POST',
          path: '/api/pagos/confirmacion',
          descripcion: 'Recibe confirmación de pago desde API Gateway (webhook interno)',
          nota: 'Solo debe ser llamado por el API Gateway, no por el frontend'
        }
      }
    },
    rutas_web: {
      nota: 'Estas rutas no son API, son vistas del portal',
      iniciarPago: 'POST /pago/iniciar',
      pagoExitoso: 'GET /pago/exitoso',
      pagoFallido: 'GET /pago/fallido',
      pagoPendiente: 'GET /pago/pendiente'
    },
    documentation: 'Ver /docs/INTEGRACION_PAGOS.md'
  });
});

// Montar rutas
router.use('/clientes', clientesRoutes);

// Ruta para recibir confirmaciones de pago del API Gateway
router.post('/pagos/confirmacion', paymentController.confirmacion);

module.exports = router;