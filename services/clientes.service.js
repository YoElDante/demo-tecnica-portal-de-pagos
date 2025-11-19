/**
 * Servicio de Clientes
 * Contiene toda la lógica de negocio relacionada con clientes
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-19
 */

const { Cliente } = require('../models/model.index');
const { Op } = require('sequelize');

/**
 * Busca un cliente por DNI
 * @param {string} dni - Número de documento del cliente
 * @returns {Promise<Object|null>} Cliente encontrado o null
 */
exports.buscarPorDni = async (dni) => {
  if (!dni || dni.length < 6) {
    return null;
    //throw new Error('DNI inválido: debe tener al menos 6 caracteres');
  }

  const cliente = await Cliente.findOne({
    where: { DOCUMENTO: dni.trim() },
    attributes: ['Codigo', 'Nombre', 'Apellido', 'DOCUMENTO', 'Email', 'Telefono']
  });

  return cliente;
};

/**
 * Obtiene un cliente por código
 * @param {string} codigo - Código del cliente
 * @returns {Promise<Object|null>} Cliente encontrado o null
 */
exports.obtenerPorCodigo = async (codigo) => {
  const cliente = await Cliente.findOne({
    where: { Codigo: codigo.trim() },
    attributes: ['Codigo', 'Nombre', 'Apellido', 'DOCUMENTO', 'Email', 'Telefono']
  });

  return cliente;
};

/**
 * Lista todos los clientes con paginación
 * @param {number} limit - Cantidad de registros por página
 * @param {number} offset - Desplazamiento
 * @returns {Promise<Object>} Objeto con clientes y metadatos
 */
exports.listarClientes = async (limit = 50, offset = 0) => {
  const { count, rows } = await Cliente.findAndCountAll({
    limit,
    offset,
    attributes: ['Codigo', 'Nombre', 'Apellido', 'DOCUMENTO', 'Email', 'Telefono'],
    order: [['Codigo', 'ASC']]
  });

  return {
    clientes: rows,
    total: count,
    limit,
    offset
  };
};

/**
 * Lista contribuyentes con cantidad de deudas
 * @param {number} limit - Cantidad de registros
 * @param {number} offset - Desplazamiento
 * @returns {Promise<Object>} Contribuyentes con cantidad de deudas
 */
exports.listarContribuyentes = async (limit = 50, offset = 0) => {
  const { sequelize } = require('../models/model.index');

  // Cambiar findAll por findAndCountAll
  const { count, rows: contribuyentes } = await Cliente.findAndCountAll({
    attributes: [
      'Codigo',
      'Nombre',
      'Apellido',
      'DOCUMENTO',
      [
        sequelize.literal(`(
          SELECT COUNT(*)
          FROM ClientesCtaCte
          WHERE ClientesCtaCte.Codigo = Cliente.Codigo
          AND ClientesCtaCte.Saldo != 0
        )`),
        'cantidadDeudas'
      ]
    ],
    limit,
    offset,
    order: [['Apellido', 'ASC'], ['Nombre', 'ASC']],
    raw: true
  });

  const contribuyentesFormateados = contribuyentes.map(c => ({
    codigo: c.Codigo?.trim(),
    nombreCompleto: `${c.Apellido || ''} ${c.Nombre || ''}`.trim(),
    documento: c.DOCUMENTO?.trim(),
    cantidadDeudas: parseInt(c.cantidadDeudas) || 0
  }));

  return {
    contribuyentes: contribuyentesFormateados,
    total: count,  // Usar el count real de la base de datos
    limit,
    offset
  };
};

/**
 * Valida el formato de un DNI
 * @param {string} dni - DNI a validar
 * @returns {boolean} True si es válido
 */
exports.validarDni = (dni) => {
  const dniString = String(dni || '').trim();
  return /^\d{7,10}$/.test(dniString);
};