/**
 * Servicio de Deudas
 * Contiene toda la lógica de negocio relacionada con deudas y pagos
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

const { ClientesCtaCte, sequelize } = require('../models/model.index');
const { Op } = require('sequelize');

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
  const descuento = Number((importe * 0.01).toFixed(2));
  const total = Number((importe - descuento).toFixed(2));

  return {
    IdTrans: deuda.IdTrans,
    Fecha: deuda.Fecha || '',
    Detalle: `${deuda.Detalle || ''} ${deuda.Dominio || ''}`.trim(),
    Cuota: deuda.NRO_CUOTA && deuda.ANO_CUOTA ? `${deuda.NRO_CUOTA}/${deuda.ANO_CUOTA}` : '',
    Importe: importe,
    Descuento: descuento,
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