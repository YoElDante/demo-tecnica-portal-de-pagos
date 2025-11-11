/**
 * @fileoverview Middleware para validar y sanitizar los datos de las solicitudes en la aplicación.
 * 
 * Este módulo exporta varios middlewares de validación utilizando express-validator para asegurar
 * que las solicitudes entrantes cumplan con los criterios requeridos antes de ser procesadas.
 * 
 * @module middlewares/validator
 * @requires express-validator
 * @requires ../utils/response
 * @requires ../utils/constants
 * 
 * @author Dante Delprato
 * @date 2024-06-15
 * 
 * @exports validatePagination
 * @exports validateDni
 * @exports validateCodigo
 * @exports validateGenerarPago
 * @exports validateDniBody
 * @exports validateId
 * @exports sanitizeInput
 * 
 * @example
 * Ejemplo de uso de una ruta Express
 * const { validateDni } = require('./middlewares/validator');
 * app.get('/user/:dni', validateDni, (req, res) => { Manejar solicitud
 * });
 */
const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response');
const { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } = require('../utils/constants');

/**
 * Maneja los errores de validación y responde con formato estándar
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({
      field: e.path || e.param,
      message: e.msg,
      value: e.value
    }));
    return error(
      res,
      ERROR_MESSAGES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      formatted
    );
  }
  next();
};

/**
 * Helper para construir reglas de validación de DNI (reutilizable para param o body)
 */
const buildDniValidator = (from = 'param', field = 'dni') => {
  const pick = from === 'body' ? body : param;
  return pick(field)
    .trim()
    .notEmpty().withMessage('El DNI es requerido')
    .isNumeric().withMessage('El DNI debe contener solo números')
    .isLength({ min: 7, max: 10 }).withMessage('El DNI debe tener entre 7 y 10 dígitos');
};

/**
 * Helper para construir reglas de validación de código (reutilizable para param o body)
 */
const buildCodigoValidator = (from = 'param', field = 'codigo') => {
  const pick = from === 'body' ? body : param;
  return pick(field)
    .trim()
    .notEmpty().withMessage('El código es requerido')
    .isLength({ min: 6, max: 7 }).withMessage('El código debe tener 6 o 7 caracteres');
};

/**
 * Validación de paginación (query params)
 */
exports.validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser >= 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100').toInt(),
  handleValidationErrors
];

/**
 * Validación de DNI en parámetro de ruta
 */
exports.validateDni = [
  buildDniValidator('param'),
  handleValidationErrors
];

/**
 * Validación de DNI en body (POST)
 */
exports.validateDniBody = [
  buildDniValidator('body'),
  handleValidationErrors
];

/**
 * Validación de código de cliente en parámetro de ruta
 */
exports.validateCodigo = [
  buildCodigoValidator('param'),
  handleValidationErrors
];

/**
 * Validación para generar pago (array de IDs)
 */
exports.validateGenerarPago = [
  body('ids').isArray({ min: 1 }).withMessage('Debe proporcionar un array de IDs')
    .custom(arr => {
      if (!arr.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('Todos los IDs deben ser enteros positivos');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Validación genérica para IDs numéricos
 */
exports.validateId = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 }).withMessage(`El ${paramName} debe ser un número entero positivo`)
    .toInt(),
  handleValidationErrors
];

/**
 * Sanitización general para prevenir XSS (útil para endpoints que reciben texto libre)
 */
exports.sanitizeInput = [
  body('*').trim().escape(),
  query('*').trim().escape()
];