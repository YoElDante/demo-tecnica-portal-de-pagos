/**
 * Utilidades para formatear respuestas de API
 * Proporciona formatos estándar para respuestas exitosas y errores
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-08
 */

/**
 * Respuesta exitosa estándar
 * @param {Object} res - Objeto response de Express
 * @param {*} data - Datos a enviar
 * @param {number} statusCode - Código HTTP (default: 200)
 * @param {Object} meta - Metadatos adicionales (paginación, etc.)
 */
exports.success = (res, data, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Respuesta de error estándar
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código HTTP (default: 400)
 * @param {string} code - Código de error personalizado
 * @param {*} details - Detalles adicionales del error
 */
exports.error = (res, message, statusCode = 400, code = null, details = null) => {
  const response = {
    success: false,
    error: {
      message
    }
  };

  if (code) {
    response.error.code = code;
  }

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Respuesta con paginación y links navegables
 * @param {Object} res - Objeto response de Express
 * @param {Array} data - Datos a enviar
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @param {number} total - Total de registros
 * @param {string} baseUrl - URL base para links
 */
exports.successWithPagination = (res, data, page, limit, total, baseUrl) => {
  const totalPages = Math.ceil(total / limit);
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages;

  const response = {
    success: true,
    data,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: totalPages,
      isFirstPage: isFirstPage,
      isLastPage: isLastPage
    },
    links: {
      current: {
        url: `${baseUrl}?page=${page}&limit=${limit}`,
        label: `Página ${page} de ${totalPages}`,
        active: true
      },
      first: {
        url: `${baseUrl}?page=1&limit=${limit}`,
        label: 'Primera página',
        active: !isFirstPage
      },
      last: {
        url: `${baseUrl}?page=${totalPages}&limit=${limit}`,
        label: 'Última página',
        active: !isLastPage
      }
    }
  };

  // Link a página anterior (si no es la primera)
  if (!isFirstPage) {
    response.links.previous = {
      url: `${baseUrl}?page=${page - 1}&limit=${limit}`,
      label: 'Página anterior',
      active: true
    };
  } else {
    response.links.previous = {
      url: null,
      label: 'Página anterior',
      active: false
    };
  }

  // Link a página siguiente (si no es la última)
  if (!isLastPage) {
    response.links.next = {
      url: `${baseUrl}?page=${page + 1}&limit=${limit}`,
      label: 'Página siguiente',
      active: true
    };
  } else {
    response.links.next = {
      url: null,
      label: 'Página siguiente',
      active: false
    };
  }

  return res.status(200).json(response);
};