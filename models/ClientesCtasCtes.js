/**
 * Modelo de la tabla dbo.ClientesCtaCte
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2025-10-28
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientesCtaCte = sequelize.define('ClientesCtaCte', {
    Codigo: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Fecha: {
      type: DataTypes.DATE,
      allowNull: true
    },
    CodMovim: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Detalle: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Letra: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    Id: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Importe: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    Saldo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    TipoMovim: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    TipoFPago: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    FechaVto: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Operacion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    CuentaContable: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    NroRenglonAsiento: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    EsPago: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    EsDocumento: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Sucursal: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DiasPromedio: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    PromedioReal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    IDENTIFICADOR: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    NRO_INTERNO: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ID_BIEN: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    TIPO_BIEN: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    TIPO_PLAN: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    TIPO_CUOTA: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ANO_CUOTA: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    NRO_CUOTA: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ESTADO_DEUDA: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    FECHA_ACTUALIZACION_DEUDA: {
      type: DataTypes.DATE,
      allowNull: true
    },
    NRO_OPERACION: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Categoria: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    IdTrans: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true
    },
    Nro_Dev: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    NRO_TALONARIO: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    FechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    NUMERO: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    NRO_RECIBO: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    NRO_EXPEDIENTE: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    CuentaContableAC: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    CuentaContableV: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    TablaLiq: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    NumeroPago: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Dominio: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ACTUALIZACION_COBRADO: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    NumeroPagoTmp: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Ejercicio: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    FechaP: {
      type: DataTypes.DATE,
      allowNull: true
    },
    RecIntereses: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    MOF: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    LOF: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    }
  }, {
    tableName: 'ClientesCtaCte',
    schema: 'dbo',
    timestamps: false
  });

  return ClientesCtaCte;
};