/**
 * Inicializa Sequelize y carga todos los modelos.
 * Versión CommonJS para Express Generator
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-10-30
 */

const sequelize = require('../config/database.config.tinoco.js');
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