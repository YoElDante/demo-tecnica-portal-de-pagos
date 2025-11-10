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
const logger = require('morgan');

// Importar rutas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api/index'); // API
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// Importar error handlers al inicio del archivo
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandles');

// Middleware de 404 
app.use(notFoundHandler);

// Middleware de manejo de errores
app.use(errorHandler);

module.exports = app;