/**
 * Middleware de paginación que normaliza los parámetros `page` y `limit` recibidos por query
 * y calcula el desplazamiento (`offset`) para su uso en consultas a base de datos.
 *
 * Reglas:
 * - `page` y `limit` deben ser enteros positivos; de lo contrario se aplican los valores por defecto.
 * - `limit` nunca excede `PAGINATION.MAX_LIMIT`.
 * - `offset = (page - 1) * limit`.
 * - Se inyecta el objeto `req.pagination = { page, limit, offset }`.
 *
 * @typedef {Object} PaginationInfo
 * @property {number} page  Número de página (1-based).
 * @property {number} limit Cantidad de registros por página (capado por MAX_LIMIT).
 * @property {number} offset Índice inicial (0-based) para usar en consultas con desplazamiento.
 *
 * @param {import('express').Request} req Objeto de la petición HTTP; se lee `req.query.page` y `req.query.limit`.
 * @param {import('express').Response} res Objeto de la respuesta HTTP (no se modifica).
 * @param {import('express').NextFunction} next Función para continuar con la cadena de middlewares.
 * @returns {void} No retorna valor; solo añade `req.pagination`.
 *
 * @example
 * Query: ?page=2&limit=25
 * Resultado:
 * req.pagination = { page: 2, limit: 25, offset: 25 }
 *
 * @example
 * Query: ?limit=9999 (sobrepasa el máximo)
 * Si MAX_LIMIT = 100:
 * req.pagination = { page: 1, limit: 100, offset: 0 }
 *
 * @example
 * Query vacía:
 * req.pagination = { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, offset: 0 }
 */

const { PAGINATION } = require('../utils/constants');

module.exports = (req, res, next) => {
  const rawPage = parseInt(req.query.page, 10);
  const rawLimit = parseInt(req.query.limit, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : PAGINATION.DEFAULT_PAGE;
  const limitBase = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(limitBase, PAGINATION.MAX_LIMIT);
  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };
  next();
};