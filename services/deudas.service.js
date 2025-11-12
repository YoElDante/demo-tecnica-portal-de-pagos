/**
 * Servicio de Deudas
 * Contiene toda la lógica de negocio relacionada con deudas y pagos
 * 
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2025-11-12
 */

const { ClientesCtaCte, sequelize } = require('../models/model.index');
const { Op } = require('sequelize');

// ============================================
// CONFIGURACIÓN DE TASA DE INTERÉS
// ============================================
// Para modificar el porcentaje de interés anual, cambiar este valor
const TASA_INTERES_ANUAL = 40; // Porcentaje anual (ejemplo: 40 = 40%)
const DIAS_POR_ANIO = 365;
const TASA_DIARIA = TASA_INTERES_ANUAL / 100 / DIAS_POR_ANIO; // 0.0010958904...

/**
 * Calcula los días de mora entre dos fechas
 * @param {Date|string} fechaVencimiento - Fecha de vencimiento
 * @param {Date} fechaActual - Fecha actual (por defecto hoy)
 * @returns {number} Días de mora (0 si no está vencido)
 */
function calcularDiasMora(fechaVencimiento, fechaActual = new Date()) {
  if (!fechaVencimiento) return 0;

  const vencimiento = new Date(fechaVencimiento);
  const hoy = new Date(fechaActual);

  // Normalizar a medianoche para comparación exacta
  vencimiento.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const diferenciaMilisegundos = hoy - vencimiento;
  const diasMora = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

  return diasMora > 0 ? diasMora : 0;
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
      Saldo: { [Op.ne]: 0 }
    },
    attributes: [
      'IdTrans',
      [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
      'FechaVto',
      'Detalle',
      'Dominio',
      'NRO_CUOTA',
      'ANO_CUOTA',
      'ID_BIEN',
      'Importe',
      'Saldo'
    ],
    order: [['Fecha', 'DESC']],
    raw: true
  });

  return deudasRaw.map(d => this.formatearDeuda(d));
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

  whereCondition.Saldo = { [Op.ne]: 0 };

  const deudas = await ClientesCtaCte.findAll({
    where: whereCondition,
    attributes: [
      'IdTrans',
      [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
      'FechaVto',
      'Detalle',
      'Dominio',
      'NRO_CUOTA',
      'ANO_CUOTA',
      'ID_BIEN',
      'Importe'
    ],
    order: [['Fecha', 'DESC']],
    raw: true
  });

  return {
    cliente: clienteInfo,
    deudas: deudas.map(d => this.formatearDeuda(d))
  };
};

/**
 * Formatea una deuda individual
 * @param {Object} deuda - Deuda sin formatear
 * @returns {Object} Deuda formateada
 */
exports.formatearDeuda = (deuda) => {
  const importe = Number(deuda.Importe) || 0;

  // Calcular días de mora
  const diasMora = calcularDiasMora(deuda.FechaVto);

  // Calcular interés
  const interes = calcularInteres(importe, diasMora);

  // Total = Importe + Interés
  const total = Number((importe + interes).toFixed(2));

  return {
    IdTrans: deuda.IdTrans,
    Fecha: deuda.Fecha || '',
    FechaVto: deuda.FechaVto || '',
    Detalle: `${deuda.Detalle || ''} ${deuda.Dominio || ''}`.trim(),
    Cuota: deuda.NRO_CUOTA && deuda.ANO_CUOTA ? `${deuda.NRO_CUOTA}/${deuda.ANO_CUOTA}` : '',
    Importe: importe,
    DiasMora: diasMora,
    Interes: interes, // Ahora es interés, no descuento
    Total: total
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
    attributes: [
      [sequelize.fn('CONVERT', sequelize.literal('VARCHAR(10)'), sequelize.col('Fecha'), 120), 'Fecha'],
      'FechaVto',
      'Detalle',
      'Dominio',
      'NRO_CUOTA',
      'ANO_CUOTA',
      'ID_BIEN',
      'Importe'
    ],
    raw: true
  });

  return deudas.map(d => this.formatearDeuda(d));
};

// Exportar funciones auxiliares para testing
exports.calcularDiasMora = calcularDiasMora;
exports.calcularInteres = calcularInteres;
exports.TASA_DIARIA = TASA_DIARIA;