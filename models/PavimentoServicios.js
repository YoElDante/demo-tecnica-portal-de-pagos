/**
 * Modelo de la tabla dbo.PavimentoServicios
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PavimentoServicios = sequelize.define('PavimentoServicios', {
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    CODIGO_AGUA: { type: DataTypes.STRING(15), allowNull: false },
    CONCEPTO: { type: DataTypes.STRING(250), allowNull: false },
    VALOR1: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    VALOR2: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
  }, {
    tableName: 'PavimentoServicios',
    schema: 'dbo',
    timestamps: false,
  });

  return PavimentoServicios;
};
