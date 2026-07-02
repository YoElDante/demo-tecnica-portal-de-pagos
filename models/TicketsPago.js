/**
 * Modelo de la tabla dbo.TicketsPago
 * Tracking de tickets de pago web por municipio
 * Alineado con script_creacion_bd_ElManzano_062026.sql
 * 
 * @updated 2026-07-02 — rowVersion removido (auto-managed por SQL Server), defaults agregados
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TicketsPago = sequelize.define('TicketsPago', {
    ticketId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      field: 'ticket_id'
    },
    ticketNumber: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'ticket_number'
    },
    municipioId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'municipio_id'
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'dni'
    },
    externalReference: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'external_reference'
    },
    gatewayProvider: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'gateway_provider'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'status'
    },
    issuedAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'issued_at_utc'
    },
    expiresAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at_utc'
    },
    retainUntilUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'retain_until_utc'
    },
    amountTotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: 'amount_total'
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'ARS',
      field: 'currency_code'
    },
    idOperacion: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'id_operacion'
    },
    nroOperacion: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'nro_operacion'
    },
    reconciliationSource: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'reconciliation_source'
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'retry_count'
    },
    lastGatewayEventAtUtc: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_gateway_event_at_utc'
    },
    paidAtUtc: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at_utc'
    },
    payloadSnapshot: {
      type: DataTypes.TEXT,             // SQL: nvarchar(max) — Sequelize TEXT es el mapping correcto
      allowNull: true,
      field: 'payload_snapshot'
    },
    createdAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at_utc'
    },
    updatedAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at_utc'
    }
    // row_version (rowVersion) es auto-manageado por SQL Server con timestamp/rowversion.
    // NO se incluye en el modelo Sequelize porque es de solo lectura y se actualiza automáticamente.
    // Si se necesita leerlo en queries, usar attributes: { include: ['row_version'] }.
  }, {
    tableName: 'TicketsPago',
    schema: 'dbo',
    timestamps: false
  });

  return TicketsPago;
};
