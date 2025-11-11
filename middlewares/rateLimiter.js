/**
 * Rate Limiting para protección de API
 * Previene abuso y ataques DDoS
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-10
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter general para toda la API
 * 100 requests por 15 minutos por IP
 */
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.',
      retryAfter: '15 minutos'
    }
  },
  standardHeaders: true, // Retorna info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.',
        retryAfter: '15 minutos'
      }
    });
  }
});

/**
 * Rate limiter estricto para endpoints sensibles
 * 10 requests por 15 minutos por IP
 */
exports.strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Límite de peticiones excedido para este endpoint.',
      retryAfter: '15 minutos'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter suave para consultas frecuentes
 * 200 requests por 15 minutos por IP
 */
exports.lightLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});