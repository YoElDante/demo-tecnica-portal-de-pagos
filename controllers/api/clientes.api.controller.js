/**
 * Clientes API Controller
 * Controlador REST para endpoints de clientes (solo JSON)
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

const ClientesService = require('../../services/clientes.service');
const DeudasService = require('../../services/deudas.service');
const { success, error, successWithPagination } = require('../../utils/response');
const { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } = require('../../utils/constants');

/**
 * Lista todos los clientes con paginación
 * GET /api/clientes
 */
exports.listarClientes = async (req, res) => {
  try {
    // Usar datos preparados por el middleware de paginación
    const { page, limit, offset } = req.pagination || { page: 1, limit: 50, offset: 0 };

    const resultado = await ClientesService.listarClientes(limit, offset);

    return successWithPagination(
      res,
      resultado.clientes,
      page,
      limit,
      resultado.total,
      '/api/clientes'
    );
  } catch (err) {
    console.error('Error en listarClientes:', err);
    return error(
      res,
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      err.message
    );
  }
};

/**
 * Obtiene un cliente específico por código
 * GET /api/clientes/:codigo
 */
exports.obtenerClientePorCodigo = async (req, res) => {
  try {
    const codigo = req.params.codigo;
    const cliente = await ClientesService.obtenerPorCodigo(codigo);

    if (!cliente) {
      return error(
        res,
        ERROR_MESSAGES.CLIENT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.CLIENT_NOT_FOUND
      );
    }

    return success(res, {
      cliente,
      links: {
        self: `/api/clientes/${codigo}`,
        deudas: `/api/clientes/${codigo}/deudas`
      }
    });

  } catch (err) {
    console.error('Error en obtenerClientePorCodigo:', err);
    return error(
      res,
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      err.message
    );
  }
};

/**
 * Obtiene las deudas de un cliente por código
 * GET /api/clientes/:codigo/deudas
 */
exports.obtenerDeudasPorCodigo = async (req, res) => {
  try {
    const codigo = req.params.codigo;
    const deudas = await DeudasService.obtenerDeudasPorCodigo(codigo);

    if (!deudas || deudas.length === 0) {
      return error(
        res,
        ERROR_MESSAGES.NO_DEBTS_FOUND,
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NO_DEBTS_FOUND
      );
    }

    const total = DeudasService.calcularTotal(deudas);

    return success(res, {
      codigo,
      deudas,
      total,
      cantidad: deudas.length,
      links: {
        self: `/api/clientes/${codigo}/deudas`,
        cliente: `/api/clientes/${codigo}`
      }
    });

  } catch (err) {
    console.error('Error en obtenerDeudasPorCodigo:', err);
    return error(
      res,
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      err.message
    );
  }
};

/**
 * Busca cliente por DNI y retorna sus datos
 * GET /api/clientes/buscar/dni/:dni
 */
exports.obtenerClientePorDni = async (req, res) => {
  try {
    const dni = req.params.dni;

    if (!ClientesService.validarDni(dni)) {
      return error(
        res,
        ERROR_MESSAGES.INVALID_DNI,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DNI
      );
    }

    const cliente = await ClientesService.buscarPorDni(dni);

    if (!cliente) {
      return error(
        res,
        ERROR_MESSAGES.CLIENT_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.CLIENT_NOT_FOUND,
        { dni }
      );
    }

    const deudas = await DeudasService.obtenerDeudasPorCodigo(cliente.Codigo);
    const total = DeudasService.calcularTotal(deudas);

    return success(res, {
      cliente,
      deudas,
      total,
      cantidad: deudas.length,
      links: {
        self: `/api/clientes/buscar/dni/${dni}`,
        cliente: `/api/clientes/${cliente.Codigo}`,
        deudas: `/api/clientes/${cliente.Codigo}/deudas`
      }
    });

  } catch (err) {
    console.error('Error en obtenerClientePorDni:', err);
    return error(
      res,
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      err.message
    );
  }
};

/**
 * Lista contribuyentes con cantidad de deudas
 * GET /api/clientes/contribuyentes
 */
exports.listarContribuyentes = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination || { page: 1, limit: 50, offset: 0 };

    const resultado = await ClientesService.listarContribuyentes(limit, offset);

    return successWithPagination(
      res,
      resultado.contribuyentes,
      page,
      limit,
      resultado.total,
      '/api/clientes/contribuyentes'
    );
  } catch (err) {
    console.error('Error en listarContribuyentes:', err);
    return error(
      res,
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      err.message
    );
  }
};

/**
 * Genera JSON de pago con las deudas seleccionadas
 * POST /api/clientes/generar-pago
 * Body: { ids: [123, 456, 789] }
 */
exports.generarJsonPago = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(
        res,
        ERROR_MESSAGES.INVALID_IDS,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_IDS
      );
    }

    const deudas = await DeudasService.obtenerDeudasPorIds(ids);
    const total = DeudasService.calcularTotal(deudas);

    return success(res, {
      pagos: deudas,
      total,
      cantidad: deudas.length,
      ids
    }, HTTP_STATUS.OK);

  } catch (err) {
    console.error('Error en generarJsonPago:', err);
    return error(
      res,
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      err.message
    );
  }
};