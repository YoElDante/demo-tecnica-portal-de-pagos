/**
 * Web Controller
 * Controlador para renderizar vistas EJS (interfaz web)
 * Solo maneja renderizado, la lógica está en services
 * 
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2026-01-20
 */

const ClientesService = require('../services/clientes.service');
const DeudasService = require('../services/deudas.service');
// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { municipalidad } = require('../config');

/**
 * Renderiza la página principal
 * GET /
 */
exports.renderIndex = (req, res) => {
  res.render('index', {
    title: 'Portal de Pagos',
    municipalidad,
    cliente: null,
    deudas: [],
    tiposDeuda: [],
    tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
    tipoIconos: DeudasService.TIPO_ICONOS,
    totalGeneral: 0,
    clienteNoEncontrado: false,
    dni: '',
    mensaje: null
  });
};

/**
 * Busca cliente por DNI y muestra sus deudas
 * POST /buscar
 */
exports.buscarPorDni = async (req, res) => {
  try {
    const dni = String(req.body?.dni || '').trim();

    // Validar DNI
    if (!ClientesService.validarDni(dni)) {
      return res.render('index', {
        title: 'Portal de Pagos',
        municipalidad,
        dni,
        cliente: null,
        deudas: [],
        tiposDeuda: [],
        tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
        tipoIconos: DeudasService.TIPO_ICONOS,
        totalGeneral: 0,
        clienteNoEncontrado: false,
        mensaje: 'El DNI debe tener entre 7 y 10 números.'
      });
    }

    // Buscar cliente
    const cliente = await ClientesService.buscarPorDni(dni);

    if (!cliente) {
      return res.render('index', {
        title: 'Portal de Pagos',
        municipalidad,
        dni,
        cliente: null,
        deudas: [],
        tiposDeuda: [],
        tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
        tipoIconos: DeudasService.TIPO_ICONOS,
        totalGeneral: 0,
        clienteNoEncontrado: true,
        mensaje: null
      });
    }

    // Obtener deudas del cliente
    const deudas = await DeudasService.obtenerDeudasPorCodigo(cliente.Codigo);

    // Lista de tipos presentes
    const tiposDeuda = [...new Set(deudas.map(d => d.Tipo).filter(Boolean))];

    // Pasar diccionarios (una sola vez)
    const tipoDescripciones = DeudasService.TIPO_DESCRIPCIONES;
    const tipoIconos = DeudasService.TIPO_ICONOS;

    // Calcular total
    const totalGeneral = DeudasService.calcularTotal(deudas);

    // Render
    return res.render('index', {
      title: 'Portal de Pagos',
      municipalidad,
      dni,
      cliente,
      deudas,
      tiposDeuda,
      tipoDescripciones,
      tipoIconos,
      totalGeneral,
      clienteNoEncontrado: false,
      mensaje: null
    });

  } catch (error) {
    console.error('Error en buscarPorDni (web):', error);
    return res.render('index', {
      title: 'Portal de Pagos',
      municipalidad,
      dni: req.body?.dni || '',
      cliente: null,
      deudas: [],
      tiposDeuda: [],
      tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
      tipoIconos: DeudasService.TIPO_ICONOS,
      totalGeneral: 0,
      clienteNoEncontrado: false,
      mensaje: 'Error interno al buscar los datos.'
    });
  }
};