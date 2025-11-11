/**
 * Middleware de logging personalizado
 * Registra requests y respuestas para auditoría
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-11-10
 */

/**
 * Logger de requests
 */
exports.requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`📥 [${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Guardar tiempo de inicio para calcular duración
  req.startTime = Date.now();

  next();
};

/**
 * Logger de respuestas
 */
exports.responseLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();

    // Determinar emoji según código de estado
    let emoji = '✅';
    if (statusCode >= 400 && statusCode < 500) emoji = '⚠️';
    if (statusCode >= 500) emoji = '❌';

    console.log(`${emoji} [${timestamp}] ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);

    originalSend.call(this, data);
  };

  next();
};

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