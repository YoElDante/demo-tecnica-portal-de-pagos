/**
 * Modelo de la tabla dbo.ClientesCtaCte
 * Alineado con script_creacion_bd_ElManzano_062026.sql
 * 
 * @author Dante Marcos Delprato
 * @version 1.1
 * @date 2025-10-28
 * @updated 2026-07-02 — alineación de tipos y constraints con SQL
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
      type: DataTypes.STRING(1),        // SQL: char(1)
      allowNull: true
    },
    Detalle: {
      type: DataTypes.STRING(30),       // SQL: varchar(30)
      allowNull: true
    },
    Letra: {
      type: DataTypes.STRING(1),        // SQL: char(1)
      allowNull: true
    },
    Id: {
      type: DataTypes.STRING(4),        // SQL: varchar(4)
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
      type: DataTypes.STRING(2),        // SQL: char(2)
      allowNull: true
    },
    TipoFPago: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
      allowNull: true
    },
    FechaVto: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Operacion: {
      type: DataTypes.DECIMAL(15, 2),   // SQL: money → DECIMAL(15,2)
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
      type: DataTypes.BOOLEAN,          // SQL: bit → BOOLEAN
      allowNull: true
    },
    EsDocumento: {
      type: DataTypes.BOOLEAN,          // SQL: bit → BOOLEAN
      allowNull: true
    },
    Sucursal: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DiasPromedio: {
      type: DataTypes.DECIMAL(15, 2),   // SQL: decimal(15,2)
      allowNull: true
    },
    PromedioReal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    IDENTIFICADOR: {
      type: DataTypes.STRING(6),        // SQL: varchar(6)
      allowNull: true
    },
    NRO_INTERNO: {
      type: DataTypes.STRING(10),       // SQL: varchar(10) — era INTEGER, CORREGIDO
      allowNull: true
    },
    ID_BIEN: {
      type: DataTypes.STRING(6),        // SQL: varchar(6) — era INTEGER, CORREGIDO
      allowNull: true
    },
    TIPO_BIEN: {
      type: DataTypes.STRING(4),        // SQL: varchar(4)
      allowNull: true
    },
    TIPO_PLAN: {
      type: DataTypes.STRING(2),        // SQL: varchar(2) — era INTEGER, CORREGIDO
      allowNull: true
    },
    TIPO_CUOTA: {
      type: DataTypes.STRING(2),        // SQL: varchar(2) — era INTEGER, CORREGIDO
      allowNull: true
    },
    ANO_CUOTA: {
      type: DataTypes.STRING(4),        // SQL: varchar(4) — era INTEGER, CORREGIDO
      allowNull: true
    },
    NRO_CUOTA: {
      type: DataTypes.STRING(3),        // SQL: varchar(3) — era INTEGER, CORREGIDO
      allowNull: true
    },
    ESTADO_DEUDA: {
      type: DataTypes.STRING(2),        // SQL: varchar(2)
      allowNull: true
    },
    FECHA_ACTUALIZACION_DEUDA: {
      type: DataTypes.DATE,
      allowNull: true
    },
    NRO_OPERACION: {
      type: DataTypes.STRING(10),       // SQL: varchar(10)
      allowNull: true
    },
    Categoria: {
      type: DataTypes.STRING(3),        // SQL: varchar(3)
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
      type: DataTypes.STRING(8),        // SQL: varchar(8)
      allowNull: true
    },
    FechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    NUMERO: {
      type: DataTypes.STRING(10),       // SQL: varchar(10)
      allowNull: true
    },
    NRO_RECIBO: {
      type: DataTypes.STRING(15),       // SQL: varchar(15)
      allowNull: true
    },
    NRO_EXPEDIENTE: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    CuentaContableAC: {
      type: DataTypes.STRING(4),        // SQL: varchar(4)
      allowNull: true
    },
    CuentaContableV: {
      type: DataTypes.STRING(4),        // SQL: varchar(4)
      allowNull: true
    },
    TablaLiq: {
      type: DataTypes.STRING(100),      // SQL: varchar(100) — era INTEGER, CORREGIDO
      allowNull: true
    },
    NumeroPago: {
      type: DataTypes.STRING(10),       // SQL: varchar(10) — era INTEGER, CORREGIDO
      allowNull: true
    },
    Dominio: {
      type: DataTypes.STRING(12),       // SQL: varchar(12)
      allowNull: true
    },
    ACTUALIZACION_COBRADO: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    NumeroPagoTmp: {
      type: DataTypes.STRING(10),       // SQL: varchar(10) — era INTEGER, CORREGIDO
      allowNull: true
    },
    Observaciones: {
      type: DataTypes.STRING(100),      // SQL: varchar(100) — era TEXT, CORREGIDO
      allowNull: true
    },
    Ejercicio: {
      type: DataTypes.STRING(6),        // SQL: varchar(6)
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
      type: DataTypes.STRING(3),        // SQL: varchar(3) — era DECIMAL, CORREGIDO
      allowNull: true
    },
    LOF: {
      type: DataTypes.STRING(3),        // SQL: varchar(3) — era DECIMAL, CORREGIDO
      allowNull: true
    },
    Usuario: {
      type: DataTypes.STRING(24),       // SQL: varchar(24) — NUEVA columna
      allowNull: true
    },
    CoeficienteCuota: {
      type: DataTypes.DECIMAL(15, 2),   // SQL: decimal(15,2) — NUEVA columna
      allowNull: true
    }
  }, {
    tableName: 'ClientesCtaCte',
    schema: 'dbo',
    timestamps: false
  });

  return ClientesCtaCte;
};
