/**
 * Middleware de logging personalizado
 * Registra requests y respuestas para auditoría
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-10
 * @updated 2026-03-09 - Soporte para LOG_LEVEL y NODE_ENV
 */

// Configuración de logging según entorno
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_PRODUCTION = NODE_ENV === 'production';

// Niveles de log (menor número = más crítico)
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const CURRENT_LEVEL = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.info;

/**
 * Función helper para logging condicional
 * @param {string} level - Nivel del log (error, warn, info, debug)
 * @param {string} message - Mensaje a loguear
 */
const log = (level, message) => {
  if (LOG_LEVELS[level] <= CURRENT_LEVEL) {
    const timestamp = new Date().toISOString();
    const prefix = IS_PRODUCTION ? '' : `[${timestamp}] `;
    
    switch (level) {
      case 'error':
        console.error(`${prefix}${message}`);
        break;
      case 'warn':
        console.warn(`${prefix}${message}`);
        break;
      default:
        console.log(`${prefix}${message}`);
    }
  }
};

/**
 * Logger de requests
 * En producción: log mínimo
 * En desarrollo: log detallado con IP
 */
exports.requestLogger = (req, res, next) => {
  // Guardar tiempo de inicio para calcular duración
  req.startTime = Date.now();

  // En producción solo logueamos en nivel debug
  if (IS_PRODUCTION) {
    log('debug', `${req.method} ${req.originalUrl}`);
  } else {
    const ip = req.ip || req.connection.remoteAddress;
    log('info', `📥 ${req.method} ${req.originalUrl} - IP: ${ip}`);
  }

  next();
};

/**
 * Logger de respuestas
 * En producción: solo errores (4xx, 5xx)
 * En desarrollo: todas las respuestas con duración
 */
exports.responseLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - (req.startTime || Date.now());
    const statusCode = res.statusCode;

    if (IS_PRODUCTION) {
      // En producción: solo errores van a consola de Azure
      if (statusCode >= 400) {
        const level = statusCode >= 500 ? 'error' : 'warn';
        log(level, `${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);
      }
    } else {
      // En desarrollo: todo con emojis
      let emoji = '✅';
      if (statusCode >= 400 && statusCode < 500) emoji = '⚠️';
      if (statusCode >= 500) emoji = '❌';
      log('info', `${emoji} ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Logger de errores (para usar con app.use después de las rutas)
 * Siempre loguea errores a consola (visible en Azure)
 */
exports.errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Siempre loguear errores (van a Azure Application Insights / Log Stream)
  console.error(`[${timestamp}] ❌ ERROR:`, {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    // Stack solo en desarrollo o si LOG_LEVEL es debug
    ...((!IS_PRODUCTION || LOG_LEVEL === 'debug') && { stack: err.stack })
  });

  next(err);
};

// Exportar helpers para uso en otros módulos
exports.log = log;
exports.IS_PRODUCTION = IS_PRODUCTION;
exports.LOG_LEVEL = LOG_LEVEL;

/**
 * Logger de errores
 */
exports.errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();

  console.error(`🔥 [${timestamp}] ERROR en ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode
  });

  next(err);
};