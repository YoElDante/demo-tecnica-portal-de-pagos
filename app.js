/**
 * Aplicación Express con Sequelize
 * Estructura Express Generator + Sequelize
 *
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2026-07-04
 *
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { helmetConfig } = require('./middlewares/helmet.config');
const { csrfProtection } = require('./middlewares/csrf');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { requestLogger, responseLogger, errorLogger, LOG_LEVEL } = require('./middlewares/logger');
const { startTicketsMaintenance } = require('./services/ticketsMaintenance.service');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandles');

// Importar rutas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api/index'); // API
const paymentRouter = require('./routes/payment.routes'); // Pagos y redirects del gateway
const app = express();

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.GATEWAY_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SECURITY_HELMET_ENABLED = process.env.SECURITY_HELMET_ENABLED === 'true' || IS_PRODUCTION;

// Mantenimiento automatico de tickets (expiracion + purga no pagados)
startTicketsMaintenance();

// Confiar en proxy headers de Azure Load Balancer
// Esto permite que express-rate-limit lea X-Forwarded-For correctamente
app.set('trust proxy', 1);

// Ocultar tecnologia del servidor
app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
console.info('🧭 Logger inicializado', {
  env: process.env.NODE_ENV || 'development',
  logLevel: LOG_LEVEL
});

// ---------------------------------------------------------------------------
// Security Hardening (SDD: resolver-auditoria-03072026)
// ---------------------------------------------------------------------------

// Helmet: headers de seguridad HTTP (feature flag)
if (SECURITY_HELMET_ENABLED) {
  app.use(helmet(helmetConfig));
}

// Parsers de body con limite de tamaño para prevenir ataques por memoria
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: false }));

// Sanitización global de entrada: trim + escape en body y query
const handleSanitizeErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Solicitud con parámetros no válidos',
      errors: errors.array()
    });
  }
  next();
};

app.use([
  body('*').trim().escape(),
  handleSanitizeErrors
]);

app.use(cookieParser(COOKIE_SECRET));

// Protección CSRF (double-submit cookie)
app.use(csrfProtection);

app.use(express.static(path.join(__dirname, 'public')));

// Logger personalizado (respeta NODE_ENV y LOG_LEVEL)
app.use(requestLogger);
app.use(responseLogger);

// Rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(['/pago', '/pagos'], paymentRouter); // Compatibilidad legacy + contrato nuevo

// Rutas API con limitador de tasa
app.use('/api', apiLimiter);
app.use('/api', apiRouter);

// Error logger
app.use(errorLogger);

// Middleware de 404
app.use(notFoundHandler);

// Middleware de manejo de errores
app.use(errorHandler);

module.exports = app;
