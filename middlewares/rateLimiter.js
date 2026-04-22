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
 * Custom key generator que extrae la IP correctamente desde headers de proxy.
 * En Azure Load Balancer, el header puede llegar como "IP:PUERTO" (incorrecto).
 * Este generator extrae solo la parte IP.
 */
function cleanIpKeyGenerator(req) {
  // Si tenemos X-Forwarded-For, usarlo (viene con trust proxy)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Puede venir como "IP" o "IP:PUERTO" o "IP1, IP2"
    const ips = forwardedFor.split(',')[0].trim(); // Primero es la original
    return ips.split(':')[0]; // Extraer solo la IP, descartar puerto
  }
  
  // Fallback a req.ip (menos confiable en proxy, pero intenta limpiar)
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return ip.split(':')[0]; // Extraer solo la IP
}

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
  keyGenerator: cleanIpKeyGenerator,
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
  keyGenerator: cleanIpKeyGenerator,
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
  keyGenerator: cleanIpKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Custom key generator que extrae la IP correctamente incluso con puerto.
 * En Azure Load Balancer, el header puede llegar como "IP:PUERTO" (incorrecto).
 * Este generator extrae solo la parte IP.
 */
function webhookKeyGenerator(req) {
  // Si tenemos X-Forwarded-For, usarlo (viene con trust proxy)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Puede venir como "IP" o "IP:PUERTO" o "IP1, IP2"
    const ips = forwardedFor.split(',')[0].trim(); // Primero es la original
    return ips.split(':')[0]; // Extraer solo la IP, descartar puerto
  }
  
  // Fallback a req.ip (menos confiable en proxy, pero intenta limpiar)
  const ip = req.ip || req.connection.remoteAddress || '';
  return ip.split(':')[0]; // Extraer solo la IP
}

/**
 * Rate limiter para webhooks server-to-server.
 * Permite reintentos automáticos del gateway sin bloquear pagos legítimos.
 */
exports.webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Límite de peticiones excedido para webhook de pagos.',
      retryAfter: '15 minutos'
    }
  },
  keyGenerator: webhookKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false
});
