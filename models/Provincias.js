/**
 * Modelo de la tabla dbo.Provincias
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Provincias = sequelize.define('Provincias', {
    Id: { type: DataTypes.CHAR(10), allowNull: false, primaryKey: true },
    IdDGI: { type: DataTypes.CHAR(2), allowNull: true },
    Nombre: { type: DataTypes.STRING(32), allowNull: false },
    PermitePercepCompras: { type: DataTypes.BOOLEAN, allowNull: true },
    codigoONCA: { type: DataTypes.CHAR(2), allowNull: true },
    IdIBJurisdiccion: { type: DataTypes.CHAR(3), allowNull: true },
    CuentaPercepIngBrutos: { type: DataTypes.STRING(20), allowNull: true },
    CuentaPercepMunicipal: { type: DataTypes.STRING(20), allowNull: true },
    CuentaRetIngBrutos: { type: DataTypes.STRING(20), allowNull: true },
  }, {
    tableName: 'Provincias',
    schema: 'dbo',
    timestamps: false,
  });

  return Provincias;
};
