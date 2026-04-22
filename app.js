/**
 * Aplicación Express con Sequelize
 * Estructura Express Generator + Sequelize
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-10-30
 *
 */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
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

// Mantenimiento automatico de tickets (expiracion + purga no pagados)
startTicketsMaintenance();

// Confiar en proxy headers de Azure Load Balancer
// Esto permite que express-rate-limit lea X-Forwarded-For correctamente
app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
console.info('🧭 Logger inicializado', {
  env: process.env.NODE_ENV || 'development',
  logLevel: LOG_LEVEL
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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