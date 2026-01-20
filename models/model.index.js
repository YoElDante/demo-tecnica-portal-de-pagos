/**
 * Inicializa Sequelize y carga todos los modelos.
 * Versión CommonJS para Express Generator
 * 
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2026-01-20
 */

// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { sequelize } = require('../config');
const ClienteModel = require('./Cliente');
const ClientesCtaCteModel = require('./ClientesCtasCtes');

// Inicializar modelos
const Cliente = ClienteModel(sequelize);
const ClientesCtaCte = ClientesCtaCteModel(sequelize);

// Definir relaciones entre modelos
Cliente.hasMany(ClientesCtaCte, {
  foreignKey: 'Codigo',
  sourceKey: 'Codigo',
  as: 'cuentasCorrientes'
});

ClientesCtaCte.belongsTo(Cliente, {
  foreignKey: 'Codigo',
  targetKey: 'Codigo',
  as: 'cliente'
});

// Exportar sequelize y los modelos
module.exports = {
  sequelize,
  Cliente,
  ClientesCtaCte
};