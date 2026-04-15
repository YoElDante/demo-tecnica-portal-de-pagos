/**
 * Modelo de la tabla dbo.TicketsPago
 * Tracking de tickets de pago web por municipio
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
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'payload_snapshot'
    },
    createdAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at_utc'
    },
    updatedAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at_utc'
    },
    rowVersion: {
      type: DataTypes.BLOB,
      allowNull: true,
      field: 'row_version'
    }
  }, {
    tableName: 'TicketsPago',
    schema: 'dbo',
    timestamps: false
  });

  return TicketsPago;
};
