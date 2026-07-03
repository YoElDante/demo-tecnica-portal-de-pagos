/**
 * Modelo de la tabla dbo.CIActividades
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CIActividades = sequelize.define('CIActividades', {
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    CODIGO_CATEGORIA: { type: DataTypes.STRING(15), allowNull: false },
    CONCEPTO: { type: DataTypes.STRING(250), allowNull: false },
    VALOR1: { type: DataTypes.DECIMAL(19, 4), allowNull: false },
    VALOR2: { type: DataTypes.DECIMAL(19, 4), allowNull: false },
  }, {
    tableName: 'CIActividades',
    schema: 'dbo',
    timestamps: false,
  });

  return CIActividades;
};
