const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clientes.controller');

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Portal de Pagos',
    cliente: null,
    deudas: [],
    totalGeneral: 0,
    clienteNoEncontrado: false,
    dni: '',
    mensaje: null
  });
});

router.post('/buscar', clienteController.buscarPorDni);

module.exports = router;