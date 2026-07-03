/**
 * Modelo de la tabla dbo.CobrosCtaCte
 * Transcrito de script_creacion_bd_ElManzano_062026.sql
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CobrosCtaCte = sequelize.define('CobrosCtaCte', {
    Codigo: { type: DataTypes.STRING(10), allowNull: true },
    Fecha: { type: DataTypes.DATE, allowNull: true },
    CodMovim: { type: DataTypes.CHAR(1), allowNull: true },
    Detalle: { type: DataTypes.STRING(30), allowNull: true },
    Letra: { type: DataTypes.CHAR(1), allowNull: true },
    Id: { type: DataTypes.CHAR(4), allowNull: true },
    Importe: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    Saldo: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    TipoMovim: { type: DataTypes.CHAR(2), allowNull: true },
    TipoFPago: { type: DataTypes.CHAR(3), allowNull: true },
    FechaVto: { type: DataTypes.DATE, allowNull: true },
    Operacion: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    CuentaContable: { type: DataTypes.STRING(20), allowNull: true },
    NroRenglonAsiento: { type: DataTypes.INTEGER, allowNull: true },
    EsPago: { type: DataTypes.BOOLEAN, allowNull: true },
    EsDocumento: { type: DataTypes.BOOLEAN, allowNull: true },
    Sucursal: { type: DataTypes.STRING(20), allowNull: true },
    DiasPromedio: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    PromedioReal: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    IDENTIFICADOR: { type: DataTypes.STRING(6), allowNull: true },
    NRO_INTERNO: { type: DataTypes.STRING(10), allowNull: true },
    ID_BIEN: { type: DataTypes.STRING(6), allowNull: true },
    TIPO_BIEN: { type: DataTypes.STRING(4), allowNull: true },
    TIPO_PLAN: { type: DataTypes.STRING(2), allowNull: true },
    TIPO_CUOTA: { type: DataTypes.STRING(2), allowNull: true },
    ANO_CUOTA: { type: DataTypes.STRING(4), allowNull: true },
    NRO_CUOTA: { type: DataTypes.STRING(3), allowNull: true },
    ESTADO_DEUDA: { type: DataTypes.STRING(2), allowNull: true },
    FECHA_ACTUALIZACION_DEUDA: { type: DataTypes.DATE, allowNull: true },
    NRO_OPERACION: { type: DataTypes.STRING(10), allowNull: true },
    Categoria: { type: DataTypes.STRING(3), allowNull: true },
    IdTrans: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    Nro_Dev: { type: DataTypes.INTEGER, allowNull: true },
    NRO_TALONARIO: { type: DataTypes.STRING(8), allowNull: true },
    FechaPago: { type: DataTypes.DATE, allowNull: true },
    NUMERO: { type: DataTypes.STRING(10), allowNull: true },
    NRO_RECIBO: { type: DataTypes.STRING(15), allowNull: true },
    NRO_EXPEDIENTE: { type: DataTypes.STRING(50), allowNull: true },
    CuentaContableAC: { type: DataTypes.STRING(4), allowNull: true },
    CuentaContableV: { type: DataTypes.STRING(4), allowNull: true },
    TablaLiq: { type: DataTypes.STRING(100), allowNull: true },
    NumeroPago: { type: DataTypes.STRING(10), allowNull: true },
    Dominio: { type: DataTypes.STRING(12), allowNull: true },
    ACTUALIZACION_COBRADO: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    NumeroPagoTmp: { type: DataTypes.STRING(10), allowNull: true },
    Observaciones: { type: DataTypes.STRING(50), allowNull: true },
    Ejercicio: { type: DataTypes.STRING(6), allowNull: true },
    FechaP: { type: DataTypes.DATE, allowNull: true },
    RecIntereses: { type: DataTypes.DECIMAL(19, 4), allowNull: true },
    MOF: { type: DataTypes.STRING(3), allowNull: true },
    LOF: { type: DataTypes.STRING(3), allowNull: true },
  }, {
    tableName: 'CobrosCtaCte',
    schema: 'dbo',
    timestamps: false,
  });

  return CobrosCtaCte;
};
