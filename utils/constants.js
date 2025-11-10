/**
 * Constantes del proyecto
 * Centraliza valores constantes utilizados en toda la aplicación
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

module.exports = {
  // Paginación
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1
  },

  // Códigos de error personalizados
  ERROR_CODES: {
    CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
    INVALID_DNI: 'INVALID_DNI',
    INVALID_CODE: 'INVALID_CODE',
    NO_DEBTS_FOUND: 'NO_DEBTS_FOUND',
    INVALID_IDS: 'INVALID_IDS',
    DATABASE_ERROR: 'DATABASE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  },

  // Mensajes de error
  ERROR_MESSAGES: {
    CLIENT_NOT_FOUND: 'Cliente no encontrado',
    INVALID_DNI: 'DNI inválido',
    INVALID_CODE: 'Código inválido',
    NO_DEBTS_FOUND: 'No se encontraron deudas',
    INVALID_IDS: 'IDs de transacciones inválidos',
    DATABASE_ERROR: 'Error en la base de datos',
    VALIDATION_ERROR: 'Error de validación'
  },

  // Códigos HTTP
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  }
};