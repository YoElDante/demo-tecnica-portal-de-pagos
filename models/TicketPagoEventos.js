/**
 * Modelo de la tabla dbo.TicketPagoEventos
 * Auditoria de eventos y webhooks de tickets de pago
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TicketPagoEventos = sequelize.define('TicketPagoEventos', {
    eventId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      field: 'event_id'
    },
    ticketId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'ticket_id'
    },
    eventType: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: 'event_type'
    },
    eventSource: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'event_source'
    },
    idempotencyKey: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'idempotency_key'
    },
    externalEventId: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'external_event_id'
    },
    processResult: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'process_result'
    },
    errorMessage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'error_message'
    },
    payloadJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'payload_json'
    },
    receivedAtUtc: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'received_at_utc'
    },
    processedAtUtc: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at_utc'
    }
  }, {
    tableName: 'TicketPagoEventos',
    schema: 'dbo',
    timestamps: false
  });

  return TicketPagoEventos;
};
