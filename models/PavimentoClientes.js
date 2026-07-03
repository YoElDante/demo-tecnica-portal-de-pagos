/**
 * Modelo de la tabla dbo.PavimentoClientes
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PavimentoClientes = sequelize.define('PavimentoClientes', {
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    CODIGO_CATEGORIA: { type: DataTypes.STRING(15), allowNull: false },
    ID_PAVIMENTO: { type: DataTypes.STRING(6), allowNull: false },
    Codigo: { type: DataTypes.STRING(7), allowNull: false },
    Liquida: { type: DataTypes.STRING(1), allowNull: true },
    EXENCION: { type: DataTypes.STRING(4), allowNull: true },
    OBSERVACIONES: { type: DataTypes.TEXT, allowNull: true },
    CATASTRO: { type: DataTypes.STRING(6), allowNull: true },
    CATASTRO2: { type: DataTypes.STRING(6), allowNull: true },
  }, {
    tableName: 'PavimentoClientes',
    schema: 'dbo',
    timestamps: false,
  });

  return PavimentoClientes;
};
