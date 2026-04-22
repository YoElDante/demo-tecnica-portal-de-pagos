/**
 * Servicio de persistencia de TicketsPago
 *
 * Responsabilidades:
 * - Crear el registro en dbo.TicketsPago al iniciar un pago (estado CREADO)
 * - Actualizar con el external_reference del gateway (estado PENDIENTE)
 * - Consultar por external_reference (uso interno del webhook)
 * - Registrar auditoría de eventos recibidos desde el gateway
 *
 * Ciclo de vida del ticket:
 *   CREADO → (gateway acepta) → PENDIENTE → (webhook/conciliación) → APROBADO | RECHAZADO | EXPIRADO
 *
 * Política de retención:
 * - expires_at_utc: 23:59:59 del día de emisión (hora Argentina)
 * - retain_until_utc: 45 días desde la emisión
 * - Los tickets APROBADOS nunca se purgan automáticamente
 *
 * @see docs/bd/AZURE_SQL_TICKETS_PAGO_SETUP.sql
 */

const { UniqueConstraintError } = require('sequelize');
const { TicketsPago, TicketPagoEventos } = require('../models/model.index');
const { generarNumeroTicket, obtenerRangoUTCDelDia } = require('./ticket.service');

// ============================================
// CONSTANTES
// ============================================

const RETENCION_DIAS = 45;
const MAX_REINTENTOS = 5;

// ============================================
// HELPERS PRIVADOS
// ============================================

/**
 * Calcula expires_at_utc: fin del día de emisión en hora Argentina.
 * @param {string} fechaStr - 'YYYYMMDD' (fecha Argentina del día de emisión)
 * @returns {Date}
 */
function calcularExpiracion(fechaStr) {
  const { finUTC } = obtenerRangoUTCDelDia(fechaStr);
  return finUTC;
}

/**
 * Calcula retain_until_utc: 45 días desde ahora.
 * @returns {Date}
 */
function calcularRetencion() {
  return new Date(Date.now() + RETENCION_DIAS * 24 * 60 * 60 * 1000);
}

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Crea un ticket en estado CREADO.
 * Se llama ANTES de contactar al gateway, para garantizar trazabilidad
 * incluso si el gateway falla o hay un timeout.
 *
 * @param {Object} datos
 * @param {string} datos.ticketNumber       - Número único generado (ej: ELMANZANO-20260413-00001)
 * @param {string} datos.fechaStr           - Fecha Argentina 'YYYYMMDD' (para calcular expiración)
 * @param {string} datos.municipioId        - ID del municipio (ej: 'ELMANZANO')
 * @param {string} datos.dni                - DNI del contribuyente
 * @param {string} datos.gatewayProvider    - 'SIRO' | 'MERCADOPAGO' | etc.
 * @param {number} datos.amountTotal        - Monto total a cobrar
 * @param {Object} [datos.payloadSnapshot]  - Snapshot del request completo (para auditoría)
 * @returns {Promise<TicketsPago>}
 */
async function crearTicketIniciado(datos) {
  const { ticketNumber, fechaStr, municipioId, dni, gatewayProvider, amountTotal, payloadSnapshot } = datos;
  const ahora = new Date();

  return TicketsPago.create({
    ticketNumber,
    municipioId,
    dni,
    gatewayProvider,
    status: 'CREADO',
    issuedAtUtc: ahora,
    expiresAtUtc: calcularExpiracion(fechaStr),
    retainUntilUtc: calcularRetencion(),
    amountTotal,
    currencyCode: 'ARS',
    retryCount: 0,
    payloadSnapshot: payloadSnapshot ? JSON.stringify(payloadSnapshot) : null,
    createdAtUtc: ahora,
    updatedAtUtc: ahora
    // rowVersion: omitido — SQL Server lo gestiona automáticamente (ROWVERSION)
  });
}

/**
 * Genera el número de ticket y crea el registro en un solo paso con reintentos.
 *
 * Si dos requests concurrentes obtienen el mismo secuencial (condición de carrera),
 * el que pierda la constraint UNIQUE reintenta con el siguiente número disponible.
 * El límite de reintentos es muy improbable de alcanzar en uso normal.
 *
 * @param {Object} datos - Mismos campos que crearTicketIniciado, excepto ticketNumber/fechaStr
 * @param {string} datos.municipioId
 * @param {string} datos.dni
 * @param {string} datos.gatewayProvider
 * @param {number} datos.amountTotal
 * @param {Object} [datos.payloadSnapshot]
 * @returns {Promise<{ ticket: TicketsPago, ticketNumber: string }>}
 */
async function crearTicketConNumeroUnico(datos) {
  for (let intento = 0; intento < MAX_REINTENTOS; intento++) {
    const { ticketNumber, fechaStr } = await generarNumeroTicket(datos.municipioId);

    try {
      const ticket = await crearTicketIniciado({ ...datos, ticketNumber, fechaStr });
      return { ticket, ticketNumber };
    } catch (err) {
      if (err instanceof UniqueConstraintError && intento < MAX_REINTENTOS - 1) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`No se pudo generar un número de ticket único para ${datos.municipioId} después de ${MAX_REINTENTOS} intentos`);
}

/**
 * Actualiza el ticket a estado PENDIENTE con el external_reference del gateway.
 * Se llama inmediatamente después de que el gateway acepta la intención de pago.
 *
 * Usa ticketNumber como fallback si ticketId no es confiable (edge case BIGINT+MSSQL).
 *
 * @param {number|null} ticketId       - PK del ticket (puede ser unreliable en MSSQL+BIGINT)
 * @param {string} externalReference   - ID de referencia devuelto por el gateway
 * @param {string} [ticketNumber]      - Número único del ticket (fallback seguro)
 * @returns {Promise<void>}
 */
async function actualizarConReferencia(ticketId, externalReference, ticketNumber) {
  const where = (ticketId != null && ticketId !== 0)
    ? { ticketId }
    : { ticketNumber };

  if (!where.ticketId && !where.ticketNumber) {
    throw new Error('Se requiere ticketId o ticketNumber para actualizar el ticket');
  }

  const [affected] = await TicketsPago.update(
    { externalReference, status: 'PENDIENTE', updatedAtUtc: new Date() },
    { where }
  );

  if (affected === 0 && ticketNumber && where.ticketId) {
    // ticketId no matcheó — reintentar con ticketNumber (fallback ante BIGINT edge case)
    const [affectedByNumber] = await TicketsPago.update(
      { externalReference, status: 'PENDIENTE', updatedAtUtc: new Date() },
      { where: { ticketNumber } }
    );
    if (affectedByNumber === 0) {
      throw new Error(`actualizarConReferencia: 0 filas afectadas para ticketId=${ticketId}, ticketNumber=${ticketNumber}`);
    }
  } else if (affected === 0) {
    throw new Error(`actualizarConReferencia: 0 filas afectadas para ticketId=${ticketId}`);
  }
}

/**
 * Obtiene un ticket por su external_reference.
 * Uso principal: recepción del webhook de confirmación de pago.
 *
 * @param {string} externalReference
 * @returns {Promise<TicketsPago|null>}
 */
async function obtenerPorExternalReference(externalReference) {
  return TicketsPago.findOne({ where: { externalReference } });
}

/**
 * Actualiza el estado del ticket a partir de un webhook del gateway.
 * @param {number} ticketId
 * @param {Object} datos
 * @param {string} datos.estado
 * @param {string|null} [datos.idOperacion]
 * @param {string|null} [datos.nroOperacion]
 * @param {string|null} [datos.origen]
 * @param {string|Date|null} [datos.fechaOperacion]
 * @returns {Promise<void>}
 */
async function actualizarEstadoDesdeGateway(ticketId, datos) {
  const {
    estado,
    idOperacion = null,
    nroOperacion = null,
    origen = null,
    fechaOperacion = null
  } = datos;

  const fechaEvento = fechaOperacion ? new Date(fechaOperacion) : new Date();
  const payload = {
    status: estado,
    idOperacion,
    nroOperacion,
    reconciliationSource: origen,
    lastGatewayEventAtUtc: fechaEvento,
    updatedAtUtc: new Date()
  };

  if (estado === 'APROBADO') {
    payload.paidAtUtc = fechaEvento;
  }

  await TicketsPago.update(payload, { where: { ticketId } });
}

/**
 * Registra el evento recibido desde el gateway para trazabilidad.
 * Los reintentos con la misma clave de idempotencia no generan duplicados.
 * @param {Object} datos
 * @returns {Promise<{ duplicated: boolean }>} Resultado del registro
 */
async function registrarEventoGateway(datos) {
  const {
    ticketId,
    externalReference,
    estado,
    idOperacion = null,
    nroOperacion = null,
    origen = 'WEBHOOK_INMEDIATO',
    payload = {},
    processResult = 'APLICADO',
    errorMessage = null
  } = datos;

  const idempotencyKey = [
    externalReference,
    estado,
    idOperacion || nroOperacion || 'sin-operacion',
    origen
  ].join(':');

  try {
    await TicketPagoEventos.create({
      ticketId,
      eventType: `WEBHOOK_${estado}`,
      eventSource: origen === 'CONCILIACION' ? 'GATEWAY_CONCILIACION' : 'GATEWAY_WEBHOOK',
      idempotencyKey,
      externalEventId: idOperacion || nroOperacion || externalReference,
      processResult,
      errorMessage,
      payloadJson: JSON.stringify(payload),
      receivedAtUtc: new Date(),
      processedAtUtc: new Date()
    });

    return { duplicated: false };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return { duplicated: true };
    }

    throw error;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  crearTicketConNumeroUnico,
  actualizarConReferencia,
  obtenerPorExternalReference,
  actualizarEstadoDesdeGateway,
  registrarEventoGateway
};
