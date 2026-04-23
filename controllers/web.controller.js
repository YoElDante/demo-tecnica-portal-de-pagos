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
const { municipalidad, MUNICIPIO } = require('../config');

const demoModoHabilitado = String(MUNICIPIO || '').toUpperCase() === 'DEMO';

const BASE_RENDER = { municipalidad, demoModoHabilitado };

// Cache simple de sugerencias — se refresca cada 5 minutos
let _sugerenciasCache = { data: null, ts: 0 };
const SUGERENCIAS_TTL_MS = 5 * 60 * 1000;

async function obtenerSugerenciasDemo() {
  if (!demoModoHabilitado) return [];
  const ahora = Date.now();
  if (_sugerenciasCache.data && (ahora - _sugerenciasCache.ts) < SUGERENCIAS_TTL_MS) {
    return _sugerenciasCache.data;
  }
  try {
    const data = await ClientesService.obtenerPrimerosConDeuda(5);
    _sugerenciasCache = { data, ts: ahora };
    return data;
  } catch {
    return [];
  }
}

/**
 * Renderiza la página principal
 * GET /
 */
exports.renderIndex = async (req, res) => {
  const sugerenciasDemo = await obtenerSugerenciasDemo();
  res.render('index', {
    ...BASE_RENDER,
    title: 'Portal de Pagos',
    cliente: null,
    deudas: [],
    tiposDeuda: [],
    tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
    tipoIconos: DeudasService.TIPO_ICONOS,
    totalGeneral: 0,
    clienteNoEncontrado: false,
    dni: '',
    mensaje: null,
    sugerenciasDemo
  });
};

/**
 * Busca cliente por DNI y muestra sus deudas
 * POST /buscar
 */
exports.buscarPorDni = async (req, res) => {
  try {
    const dni = String(req.body?.dni || '').trim();
    const sugerenciasDemo = await obtenerSugerenciasDemo();

    if (!ClientesService.validarDni(dni)) {
      return res.render('index', {
        ...BASE_RENDER,
        title: 'Portal de Pagos',
        dni,
        cliente: null,
        deudas: [],
        tiposDeuda: [],
        tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
        tipoIconos: DeudasService.TIPO_ICONOS,
        totalGeneral: 0,
        clienteNoEncontrado: false,
        mensaje: 'El DNI debe tener entre 7 y 10 números.',
        sugerenciasDemo
      });
    }

    const cliente = await ClientesService.buscarPorDni(dni);

    if (!cliente) {
      return res.render('index', {
        ...BASE_RENDER,
        title: 'Portal de Pagos',
        dni,
        cliente: null,
        deudas: [],
        tiposDeuda: [],
        tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
        tipoIconos: DeudasService.TIPO_ICONOS,
        totalGeneral: 0,
        clienteNoEncontrado: true,
        mensaje: null,
        sugerenciasDemo
      });
    }

    const deudas = await DeudasService.obtenerDeudasPorCodigo(cliente.Codigo);
    const tiposDeuda = [...new Set(deudas.map(d => d.Tipo).filter(Boolean))];
    const tipoDescripciones = DeudasService.TIPO_DESCRIPCIONES;
    const tipoIconos = DeudasService.TIPO_ICONOS;
    const totalGeneral = DeudasService.calcularTotal(deudas);

    return res.render('index', {
      ...BASE_RENDER,
      title: 'Portal de Pagos',
      dni,
      cliente,
      deudas,
      tiposDeuda,
      tipoDescripciones,
      tipoIconos,
      totalGeneral,
      clienteNoEncontrado: false,
      mensaje: null,
      sugerenciasDemo
    });

  } catch (error) {
    console.error('Error en buscarPorDni (web):', error);
    const sugerenciasDemo = await obtenerSugerenciasDemo();
    return res.render('index', {
      ...BASE_RENDER,
      title: 'Portal de Pagos',
      dni: req.body?.dni || '',
      cliente: null,
      deudas: [],
      tiposDeuda: [],
      tipoDescripciones: DeudasService.TIPO_DESCRIPCIONES,
      tipoIconos: DeudasService.TIPO_ICONOS,
      totalGeneral: 0,
      clienteNoEncontrado: false,
      mensaje: 'Error interno al buscar los datos.',
      sugerenciasDemo
    });
  }
};
