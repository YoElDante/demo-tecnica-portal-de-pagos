/**
 * Modelo de la tabla dbo.Feriados
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Feriados = sequelize.define('Feriados', {
    Feriado_Fecha: { type: DataTypes.DATE, allowNull: false, primaryKey: true },
  }, {
    tableName: 'Feriados',
    schema: 'dbo',
    timestamps: false,
  });

  return Feriados;
};
