/**
 * Middleware de manejo centralizado de errores
 * Captura y formatea todos los errores de la aplicación
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-09
 */

const { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware para errores 404 (Not Found)
 * Debe ir ANTES del errorHandler en app.js
 */
exports.notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

/**
 * Middleware principal de manejo de errores
 * Captura todos los errores y los formatea de manera consistente
 */
exports.errorHandler = (err, req, res, next) => {
  // Determinar código de estado HTTP
  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_ERROR;

  // Determinar código de error personalizado
  const errorCode = err.code || ERROR_CODES.DATABASE_ERROR;

  // Determinar mensaje de error
  const message = err.message || ERROR_MESSAGES.DATABASE_ERROR;

  // Log del error en consola (en producción usar logger como Winston)
  console.error('❌ Error capturado:', {
    code: errorCode,
    status: statusCode,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Estructura de respuesta de error
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details || null;
  }

  // Si es un error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    errorResponse.error.code = ERROR_CODES.VALIDATION_ERROR;
    errorResponse.error.message = 'Error de validación en la base de datos';
    errorResponse.error.details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  }

  // Si es un error de Sequelize genérico
  if (err.name === 'SequelizeDatabaseError') {
    errorResponse.error.code = ERROR_CODES.DATABASE_ERROR;
    errorResponse.error.message = ERROR_MESSAGES.DATABASE_ERROR;
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json(errorResponse);
  }

  // Respuesta estándar
  res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper para funciones async que captura errores automáticamente
 * Evita tener que usar try-catch en cada controller
 * 
 * Uso:
 * router.get('/ruta', asyncHandler(async (req, res) => {
 *   const data = await Service.getData();
 *   res.json(data);
 * }));
 */
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Crea un error personalizado con código y status
 * 
 * Uso:
 * throw createError('Cliente no encontrado', 404, 'CLIENT_NOT_FOUND');
 */
exports.createError = (message, statusCode = 400, code = null, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};