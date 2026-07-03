/**
 * Modelo de la tabla dbo.Medidores
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Medidores = sequelize.define('Medidores', {
    ID_MEDIDOR: { type: DataTypes.STRING(6), allowNull: true },
    Codigo: { type: DataTypes.STRING(7), allowNull: true },
    ID_CATASTRO: { type: DataTypes.STRING(6), allowNull: true },
    Liquida: { type: DataTypes.STRING(1), allowNull: true },
    EXENCION: { type: DataTypes.STRING(1), allowNull: true },
    TipoMedidor: { type: DataTypes.STRING(4), allowNull: true },
    TipoTension: { type: DataTypes.STRING(4), allowNull: true },
    ID_TARIFA: { type: DataTypes.STRING(3), allowNull: true },
    NroMedidor: { type: DataTypes.STRING(20), allowNull: true },
    Categoria: { type: DataTypes.STRING(30), allowNull: true },
    LecturaMinima: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    LecturaMaxima: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    FechaAlta: { type: DataTypes.DATEONLY, allowNull: true },
    Observaciones: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'Medidores',
    schema: 'dbo',
    timestamps: false,
  });

  return Medidores;
};
