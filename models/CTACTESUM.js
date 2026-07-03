/**
 * Modelo de la tabla dbo.CTACTESUM
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CTACTESUM = sequelize.define('CTACTESUM', {
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    Codigo: { type: DataTypes.STRING(7), allowNull: true },
    Fecha: { type: DataTypes.DATE, allowNull: true },
    Importe: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    Saldo: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    ANO_CUOTA: { type: DataTypes.STRING(4), allowNull: true },
    NRO_CUOTA: { type: DataTypes.STRING(3), allowNull: true },
    TIPO_BIEN: { type: DataTypes.STRING(4), allowNull: true },
    TablaLiq: { type: DataTypes.STRING(100), allowNull: true },
    ID_BIEN: { type: DataTypes.STRING(6), allowNull: true },
    CodMovim: { type: DataTypes.STRING(1), allowNull: true },
    Detalle: { type: DataTypes.STRING(30), allowNull: true },
    FechaVto: { type: DataTypes.DATE, allowNull: true },
    CuentaContableV: { type: DataTypes.STRING(4), allowNull: true },
    Letra: { type: DataTypes.STRING(1), allowNull: true },
    Id: { type: DataTypes.STRING(5), allowNull: true },
    Numero: { type: DataTypes.STRING(10), allowNull: true },
    TipoMovim: { type: DataTypes.STRING(2), allowNull: true },
    Dominio: { type: DataTypes.STRING(12), allowNull: true },
    MOF: { type: DataTypes.STRING(3), allowNull: true },
    LOF: { type: DataTypes.STRING(3), allowNull: true },
    Ejercicio: { type: DataTypes.STRING(6), allowNull: true },
  }, {
    tableName: 'CTACTESUM',
    schema: 'dbo',
    timestamps: false,
  });

  return CTACTESUM;
};
