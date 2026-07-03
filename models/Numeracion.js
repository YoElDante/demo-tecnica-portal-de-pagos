/**
 * Modelo de la tabla dbo.Numeracion
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Numeracion = sequelize.define('Numeracion', {
    Codigo: { type: DataTypes.CHAR(2), allowNull: false, primaryKey: true },
    Numero: { type: DataTypes.INTEGER, allowNull: true },
    Modificable: { type: DataTypes.BOOLEAN, allowNull: false },
    PathCarpetaPDF: { type: DataTypes.STRING(250), allowNull: true },
  }, {
    tableName: 'Numeracion',
    schema: 'dbo',
    timestamps: false,
  });

  return Numeracion;
};
