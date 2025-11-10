/**
 * Validadores reutilizables
 * Funciones de validación para uso en toda la aplicación
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

/**
 * Valida formato de DNI argentino
 * @param {string} dni - DNI a validar
 * @returns {boolean} True si es válido
 */
exports.isValidDni = (dni) => {
  const dniString = String(dni || '').trim();
  return /^\d{7,10}$/.test(dniString);
};

/**
 * Valida formato de código de cliente
 * @param {string} codigo - Código a validar
 * @returns {boolean} True si es válido
 */
exports.isValidCodigo = (codigo) => {
  const codigoString = String(codigo || '').trim();
  return codigoString.length >= 6 && codigoString.length <= 10;
};

/**
 * Valida array de IDs
 * @param {Array} ids - Array de IDs a validar
 * @returns {boolean} True si es válido
 */
exports.isValidIdsArray = (ids) => {
  return Array.isArray(ids) && ids.length > 0 && ids.every(id => Number.isInteger(id));
};

/**
 * Sanitiza entrada de texto
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
exports.sanitizeText = (text) => {
  return String(text || '').trim().replace(/[<>]/g, '');
};
