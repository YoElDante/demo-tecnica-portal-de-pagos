/**
 * Servicio de Deudas
 * Contiene toda la lógica de negocio relacionada con deudas y pagos
 * 
 * @author Dante Marcos Delprato
 * @version 2.0
 * @date 2026-07-02 — integración con intereses.service.js (fórmula del contador)
 */

const { ClientesCtaCte, sequelize } = require('../models/model.index');
const { Op } = require('sequelize');
const { calcularMovimiento } = require('./intereses.service');
const { obtenerConfigIntereses } = require('./datos-generales.service');

// ============================================
// CONFIGURACIÓN DE TASA DE INTERÉS (fallback)
// ============================================
// Capa 3: process.env — último recurso si DatosGenerales y municipio config fallan
const TASA_INTERES_ANUAL = Number(process.env.TASA_INTERES_ANUAL) || 0;


// ============================================
// DICCIONARIO TIPOS DE DEUDA
// ============================================
const TIPO_DESCRIPCIONES = {
  AUAU: 'Automotores',
  ININ: 'Serv. Propiedad',
  CICI: 'Comercio e Industria',
  CACA: 'Catastro',
  OBSA: 'Servicio de Agua',
  CEM1: 'Cementerio',
  PEPE: 'Licencias / Tasas',
  NDND: 'Nota Débito',
  NCNC: 'Nota Crédito',
  RRPP: 'Plan de Pagos',
  RREF: 'Efectivo',
  RRTC: 'Tarjeta Crédito',
  RRTD: 'Tarjeta Débito',
  RRCH: 'Cheque',
  RRTR: 'Transferencia',
  FAPP: 'Cuota Plan'
};

const TIPO_ICONOS = {
  AUAU: '🚗',
  ININ: '🏠',
  CICI: '🏬',
  CACA: '🗺️',
  OBSA: '💧',
  CEM1: '⚰️',
  PEPE: '🪪',
  NDND: '📄➕',
  NCNC: '📄➖',
  RRPP: '📑',
  RREF: '💵',
  RRTC: '💳',
  RRTD: '💳',
  RRCH: '🧾',
  RRTR: '🔁',
  FAPP: '🧮'
};

// ============================================
// ATRIBUTOS BASE PARA QUERIES
// ============================================
const QUERY_ATTRIBUTES = [
  'IdTrans',
  [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
  [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('FechaVto'), 120), 'FechaVto'],
  'Detalle',
  'Dominio',
  'NRO_CUOTA',
  'ANO_CUOTA',
  'TIPO_BIEN',
  'ID_BIEN',
  'Importe',
  'Saldo',
  // ── Columnas necesarias para el motor de fórmula ──
  'CoeficienteCuota',
  'TipoMovim',
  'TIPO_PLAN',
  'ACTUALIZACION_COBRADO',
  'RecIntereses',
];

// Cache de configuración por request (se resuelve una vez por consulta)
let _configCache = null;
let _configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minuto

async function obtenerConfig() {
  const now = Date.now();
  if (_configCache && (now - _configCacheTime) < CONFIG_CACHE_TTL) {
    return _configCache;
  }

  // Capa 1: DatosGenerales (BD)
  const dbConfig = await obtenerConfigIntereses();

  // Capa 2: municipio config (tasaInteresAnual desde config municipal)
  let municipioConfig = {};
  try {
    const munConfig = require('../config/municipalidad.config.elmanzano');
    municipioConfig = { tasaInteres: munConfig.tasaInteresAnual || null };
  } catch (_) { /* no disponible */ }

  // Capa 3: process.env
  const envTasa = TASA_INTERES_ANUAL || null;

  // Resolución: primer valor no-null
  _configCache = {
    tasaInteres: dbConfig?.tasaInteres ?? municipioConfig.tasaInteres ?? envTasa ?? 40,
    tasaDescuento: dbConfig?.tasaDescuento ?? 0,
    indiceFinal: dbConfig?.indiceFinal ?? null,
    fechaDesdeIntereses: dbConfig?.fechaDesdeIntereses ?? null,
  };
  _configCacheTime = now;
  return _configCache;
}

/**
 * Calcula los días de mora entre dos fechas
 * @param {Date|string} fechaVencimiento - Fecha de vencimiento
 * @param {Date} fechaActual - Fecha actual (por defecto hoy)
 * @returns {number} Días de mora (0 si no está vencido)
 */
function calcularDiasMora(fechaVencimiento, fechaActual = new Date()) {
  if (!fechaVencimiento) return 0;

  const vencimiento = normalizarFechaCivil(fechaVencimiento);
  const hoy = new Date(fechaActual);

  if (!vencimiento) return 0;

  // Normalizar a medianoche para comparación exacta
  vencimiento.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = hoy - vencimiento;
  const diasMora = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

  return diasMora > 0 ? diasMora : 0;
}

/**
 * Convierte fechas de vencimiento a fecha civil local para evitar
 * corrimientos por zona horaria (caso típico: YYYY-MM-DD interpretado como UTC).
 * @param {Date|string} valor
 * @returns {Date|null}
 */
function normalizarFechaCivil(valor) {
  if (!valor) return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate(), 12, 0, 0);
  }

  if (typeof valor === 'string') {
    const fechaOnly = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (fechaOnly) {
      const year = Number(fechaOnly[1]);
      const month = Number(fechaOnly[2]) - 1;
      const day = Number(fechaOnly[3]);
      return new Date(year, month, day, 12, 0, 0);
    }
  }

  const parsed = new Date(valor);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
}

function formatearFechaCivil(valor) {
  const fecha = normalizarFechaCivil(valor);
  if (!fecha) return '';

  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Calcula el interés por mora
 * @param {number} importe - Importe original de la deuda
 * @param {number} diasMora - Días de mora
 * @returns {number} Interés calculado
 */
function calcularInteres(importe, diasMora) {
  if (diasMora <= 0 || importe <= 0) return 0;

  const interes = importe * TASA_DIARIA * diasMora;
  return Number(interes.toFixed(2));
}

/**
 * Obtiene las deudas de un cliente por su código
 * @param {string} codigo - Código del cliente
 * @returns {Promise<Array>} Array de deudas formateadas
 */
exports.obtenerDeudasPorCodigo = async (codigo) => {
  const deudasRaw = await ClientesCtaCte.findAll({
    where: {
      Codigo: codigo.trim(),
      CodMovim: 'H',
      Saldo: { [Op.ne]: 0 }
    },
    attributes: QUERY_ATTRIBUTES,
    order: [['Fecha', 'DESC']],
    raw: true
  });

  const config = await obtenerConfig();
  return deudasRaw.map(d => exports.formatearDeuda(d, config));
};

/**
 * Obtiene deudas por código, DNI o dominio
 * @param {string} codigo - Código, DNI o dominio
 * @returns {Promise<Object>} Objeto con cliente y deudas
 */
exports.obtenerDeudasPorCodigoODni = async (codigo) => {
  let clienteInfo = null;
  let codigoBusqueda = codigo.trim();

  // Si es DNI (8 dígitos), buscar en tabla Clientes
  if (codigo.length === 8) {
    const ClientesService = require('./clientes.service');
    const cliente = await ClientesService.buscarPorDni(codigo);

    if (!cliente) {
      return {
        cliente: null,
        deudas: []
      };
    }

    clienteInfo = {
      codigo: cliente.Codigo.trim(),
      nombre: cliente.Nombre || '',
      apellido: cliente.Apellido || ''
    };
    codigoBusqueda = cliente.Codigo.trim();
  }

  // Determinar tipo de búsqueda en ClientesCtaCte
  let whereCondition = {};

  if (codigoBusqueda.length === 7) {
    if (codigoBusqueda.startsWith('00')) {
      whereCondition = { Codigo: codigoBusqueda };
    } else {
      whereCondition = {
        TIPO_BIEN: 'AUAU',
        Dominio: codigoBusqueda
      };
    }
  } else if (codigoBusqueda.length === 6) {
    whereCondition = {
      TIPO_BIEN: 'AUAU',
      Dominio: codigoBusqueda
    };
  } else {
    throw new Error('Formato de código inválido');
  }

  whereCondition.CodMovim = 'H';
  whereCondition.Saldo = { [Op.ne]: 0 };

  const deudas = await ClientesCtaCte.findAll({
    where: whereCondition,
    attributes: QUERY_ATTRIBUTES,
    order: [['Fecha', 'DESC']],
    raw: true
  });

  const config = await obtenerConfig();

  return {
    cliente: clienteInfo,
    deudas: deudas.map(d => exports.formatearDeuda(d, config))
  };
};

/**
 * Formatea una deuda individual usando el motor de fórmula del contador
 * @param {Object} deuda - Deuda sin formatear
 * @param {Object} config - Configuración de tasas (opcional, usa defaults si no se provee)
 * @returns {Object} Deuda formateada
 */
exports.formatearDeuda = (deuda, config = {}) => {
  const importe = Number(deuda.Importe) || 0;
  const saldo = Number(deuda.Saldo) || 0;

  // Usar el motor de fórmula del contador
  const resultado = calcularMovimiento(deuda, config);

  // Total = Saldo + Interés (o descuento)
  const total = Number((saldo + resultado.interes).toFixed(2));

  return {
    IdTrans: deuda.IdTrans,
    Fecha: deuda.Fecha || '',
    FechaVto: deuda.FechaVto || '',
    FechaVtoDisplay: formatearFechaCivil(deuda.FechaVto),
    Detalle: `${deuda.Detalle || ''} ${deuda.Dominio || ''}`.trim(),
    IdBien: deuda.ID_BIEN || '-',
    Cuota: deuda.NRO_CUOTA || '',
    Anio: deuda.ANO_CUOTA || '',
    Tipo: deuda.TIPO_BIEN || '',
    TipoDescripcion: TIPO_DESCRIPCIONES[deuda.TIPO_BIEN] || deuda.TIPO_BIEN || '',
    TipoIcono: TIPO_ICONOS[deuda.TIPO_BIEN] || '❓',
    Importe: importe,
    Saldo: saldo,
    DiasMora: resultado.dias,
    Interes: resultado.interes,
    TipoCalculo: resultado.tipo,    // C=coeficiente, T=tasa, D=descuento, A=actualizacion
    DisplayFormula: resultado.display,
    Total: total,
  };
};

/**
 * Calcula el total de un array de deudas
 * @param {Array} deudas - Array de deudas
 * @returns {number} Total calculado
 */
exports.calcularTotal = (deudas) => {
  return deudas.reduce((acc, deuda) => acc + (deuda.Total || 0), 0);
};

/**
 * Obtiene deudas por IDs de transacciones (para generar pago)
 * @param {Array<number>} ids - Array de IDs de transacciones
 * @returns {Promise<Array>} Array de deudas seleccionadas
 */
exports.obtenerDeudasPorIds = async (ids) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error('Debe proporcionar un array de IDs válido');
  }

  const deudas = await ClientesCtaCte.findAll({
    where: {
      IdTrans: { [Op.in]: ids }
    },
    attributes: QUERY_ATTRIBUTES,
    raw: true
  });

  const config = await obtenerConfig();
  return deudas.map(d => exports.formatearDeuda(d, config));
};

// Exportar funciones auxiliares para testing (compatibilidad hacia atrás)
exports.calcularDiasMora = calcularDiasMora;
exports.calcularInteres = (importe, diasMora) => {
  // wrapper legacy — usa la tasa de entorno como fallback
  if (diasMora <= 0 || importe <= 0) return 0;
  const tasa = Number(process.env.TASA_INTERES_ANUAL) || 40;
  return Number((importe * (tasa / 36500) * diasMora).toFixed(2));
};
exports.TASA_DIARIA = TASA_INTERES_ANUAL / 100 / 365;

// Exportar diccionarios
exports.TIPO_DESCRIPCIONES = TIPO_DESCRIPCIONES;
exports.TIPO_ICONOS = TIPO_ICONOS;