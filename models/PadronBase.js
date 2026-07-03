/**
 * Modelo de la tabla dbo.PadronBase
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PadronBase = sequelize.define('PadronBase', {
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    ID_BIEN: { type: DataTypes.STRING(6), allowNull: true },
    TIPO_BIEN: { type: DataTypes.STRING(4), allowNull: true },
    IDENTIFICADOR: { type: DataTypes.STRING(5), allowNull: true },
    Codigo: { type: DataTypes.STRING(7), allowNull: true },
    ACTIVO: { type: DataTypes.STRING(1), allowNull: true },
    EXENCION: { type: DataTypes.STRING(1), allowNull: true },
  }, {
    tableName: 'PadronBase',
    schema: 'dbo',
    timestamps: false,
  });

  return PadronBase;
};
