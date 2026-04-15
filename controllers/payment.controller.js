/**
 * Controlador de Pagos
 * Maneja el inicio de pago, redirects firmados y webhook del gateway
 * 
 * @author Dante Marcos Delprato
 * @version 1.2
 * @date 2026-01-20
 */

const paymentGatewayService = require('../services/paymentGateway.service');
const pagosService = require('../services/pagos.service');
const ticketsPagoService = require('../services/ticketsPago.service');
const clientesService = require('../services/clientes.service');
const gatewayTokenService = require('../services/gatewayToken.service');
// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { municipalidad } = require('../config');

const MUNICIPIO_ID = process.env.MUNICIPIO || '';
if (!process.env.PAYMENT_GATEWAY) {
  console.warn('⚠️  PAYMENT_GATEWAY no configurado — usando SIRO por defecto. Definir en .env para producción.');
}
const GATEWAY_PROVIDER = (process.env.PAYMENT_GATEWAY || 'SIRO').toUpperCase();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function normalizarEstado(estado) {
  const mapping = {
    approved: 'APROBADO',
    rejected: 'RECHAZADO',
    fallido: 'RECHAZADO',
    pending: 'PENDIENTE',
    expired: 'EXPIRADO',
    error: 'RECHAZADO'
  };

  const valor = String(estado || '').trim();
  return mapping[valor.toLowerCase()] || valor.toUpperCase() || 'PENDIENTE';
}

function renderizarErrorGenerico(res) {
  return res.status(400).render('pago/error-generico', {
    title: 'Resultado no válido',
    municipalidad
  });
}

function validarRedirectSeguro(req) {
  const token = req.query.token;
  const decoded = gatewayTokenService.verifyGatewayToken(token);
  const refRecibida = req.query.ref || req.query.external_reference || null;

  if (decoded?.ref && refRecibida && decoded.ref !== refRecibida) {
    throw new Error('La referencia del redirect no coincide con el token firmado');
  }

  if (decoded?.municipio_id && MUNICIPIO_ID && decoded.municipio_id.toUpperCase() !== MUNICIPIO_ID.toUpperCase()) {
    throw new Error('El token pertenece a otro municipio');
  }

  return {
    externalReference: decoded?.ref || refRecibida || 'N/A',
    estado: normalizarEstado(decoded?.estado || req.query.status)
  };
}

function parsePayloadSnapshot(payloadSnapshot) {
  if (!payloadSnapshot) {
    return null;
  }

  if (typeof payloadSnapshot === 'object') {
    return payloadSnapshot;
  }

  try {
    return JSON.parse(payloadSnapshot);
  } catch {
    return null;
  }
}

function construirDetalleTicket(ticket, externalReference, estadoFallback = 'PENDIENTE') {
  const payload = parsePayloadSnapshot(ticket?.payloadSnapshot);
  const conceptos = Array.isArray(payload?.conceptos)
    ? payload.conceptos.map((concepto) => ({
      // El snapshot guarda los campos de formatearDeuda (Detalle, Total, TipoDescripcion)
      // con mayúscula inicial — soportamos ambas convenciones
      descripcion: concepto.Detalle || concepto.TipoDescripcion || concepto.detalle || concepto.tipoDescripcion || concepto.descripcion || 'Concepto municipal',
      importe: Number(concepto.Total || concepto.total || concepto.importeNumerico || concepto.importe || 0)
    }))
    : [];

  return {
    ticketNumber: ticket?.ticketNumber || null,
    externalReference: externalReference || ticket?.externalReference || 'N/A',
    estado: normalizarEstado(ticket?.status || estadoFallback),
    montoTotal: Number(ticket?.amountTotal || payload?.montoTotal || 0),
    idOperacion: ticket?.idOperacion || null,
    conceptos
  };
}

/**
 * Inicia el proceso de pago
 * POST /pagos/iniciar
 * 
 * Recibe los datos del ticket y los envía al API Gateway
 * Luego redirige al usuario a la pasarela configurada (PAYMENT_GATEWAY)
 */
async function iniciarPago(req, res) {
  try {
    const { conceptos, contribuyente, montoTotal } = req.body;

    console.log('🛒 Iniciando proceso de pago:', {
      contribuyente_dni: contribuyente?.dni,
      cantidad_conceptos: conceptos?.length,
      monto_total: montoTotal
    });

    if (!conceptos || conceptos.length === 0) {
      return res.status(400).json({ success: false, message: 'No se recibieron conceptos para pagar' });
    }
    if (!contribuyente || !contribuyente.codigo) {
      return res.status(400).json({ success: false, message: 'Los datos del contribuyente son requeridos' });
    }
    if (!montoTotal || Number(montoTotal) <= 0) {
      return res.status(400).json({ success: false, message: 'El monto total debe ser mayor a cero' });
    }

    // Lookup por Codigo (único, autoincremental) — evita falsos positivos por DNIs duplicados
    const cliente = await clientesService.obtenerPorCodigo(contribuyente.codigo);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Contribuyente no encontrado' });
    }
    const codigoContribuyente = cliente.Codigo;

    const { ticket, ticketNumber } = await ticketsPagoService.crearTicketConNumeroUnico({
      municipioId: MUNICIPIO_ID.toUpperCase(),
      dni: contribuyente.dni,
      gatewayProvider: GATEWAY_PROVIDER,
      amountTotal: Number(montoTotal),
      payloadSnapshot: { conceptos, contribuyente: { dni: contribuyente.dni }, montoTotal }
    });

    console.log('🎫 Ticket creado en BD:', { ticketNumber, ticketId: ticket.ticketId });

    const resultado = await paymentGatewayService.createPayment({
      contribuyente: { ...contribuyente, codigo: codigoContribuyente },
      conceptos,
      montoTotal,
      ticketNumber
    });

    await ticketsPagoService.actualizarConReferencia(ticket.ticketId, resultado.external_reference);

    console.log(`🔗 Redirigiendo a ${GATEWAY_PROVIDER}:`, {
      external_reference: resultado.external_reference,
      ticketNumber
    });

    return res.json({
      success: true,
      redirect_url: resultado.payment_url,
      external_reference: resultado.external_reference,
      ticket_number: ticketNumber
    });

  } catch (error) {
    console.error('❌ Error al iniciar pago:', error.message);
    return res.status(500).json({
      success: false,
      message: IS_PRODUCTION ? 'Error al procesar el pago' : error.message
    });
  }
}

/**
 * Recibe la confirmación de pago desde el API Gateway.
 * POST /api/webhook/pago
 * POST /api/pagos/confirmacion (alias legacy)
 */
async function confirmacion(req, res) {
  try {
    const token = gatewayTokenService.obtenerTokenBearer(req.headers.authorization);
    gatewayTokenService.verifyGatewayToken(token);

    const {
      external_reference,
      estado,
      pago_exitoso,
      importe,
      medio_pago,
      id_operacion,
      fecha_operacion,
      nro_comprobante,
      origen,
      status,
      payment_id,
      transaction_amount,
      date_approved
    } = req.body;

    const estadoNormalizado = normalizarEstado(estado || status || (pago_exitoso ? 'APROBADO' : 'PENDIENTE'));
    const externalReference = external_reference;

    console.log('📥 Confirmación de pago recibida:', {
      external_reference: externalReference,
      estado: estadoNormalizado,
      id_operacion,
      importe: importe || transaction_amount,
      medio_pago
    });

    if (!externalReference) {
      return res.status(400).json({
        received: false,
        message: 'external_reference es requerido'
      });
    }

    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    if (!ticket) {
      return res.status(404).json({
        received: false,
        message: 'Ticket no encontrado'
      });
    }

    const idOperacionNormalizado = id_operacion || payment_id || externalReference;
    const origenNormalizado = origen || 'WEBHOOK_INMEDIATO';

    if (ticket.status === 'APROBADO' && estadoNormalizado !== 'APROBADO') {
      await ticketsPagoService.registrarEventoGateway({
        ticketId: ticket.ticketId,
        externalReference,
        estado: estadoNormalizado,
        idOperacion: idOperacionNormalizado,
        nroOperacion: nro_comprobante || null,
        origen: origenNormalizado,
        payload: req.body,
        processResult: 'IGNORADO'
      });

      return res.status(200).json({
        received: true,
        processed: false,
        already_processed: true,
        message: 'El ticket ya estaba aprobado'
      });
    }

    if (estadoNormalizado === 'APROBADO') {
      const resultado = await pagosService.confirmarPagoGateway({
        ticket,
        externalReference,
        estado: estadoNormalizado,
        idOperacion: idOperacionNormalizado,
        importe: importe || transaction_amount,
        fechaOperacion: fecha_operacion || date_approved
      });

      await ticketsPagoService.actualizarEstadoDesdeGateway(ticket.ticketId, {
        estado: estadoNormalizado,
        idOperacion: idOperacionNormalizado,
        nroOperacion: nro_comprobante || null,
        origen: origenNormalizado,
        fechaOperacion: fecha_operacion || date_approved
      });

      await ticketsPagoService.registrarEventoGateway({
        ticketId: ticket.ticketId,
        externalReference,
        estado: estadoNormalizado,
        idOperacion: idOperacionNormalizado,
        nroOperacion: nro_comprobante || null,
        origen: origenNormalizado,
        payload: req.body,
        processResult: resultado.already_processed ? 'DUPLICADO' : 'APLICADO'
      });

      console.log('✅ Pago aprobado y procesado:', {
        external_reference: externalReference,
        id_operacion: idOperacionNormalizado,
        conceptos_procesados: resultado.conceptos_procesados,
        numero_pago: resultado.numero_pago
      });

      return res.json({
        received: true,
        processed: resultado.processed,
        message: resultado.already_processed
          ? 'Pago ya procesado anteriormente'
          : `${resultado.conceptos_procesados} conceptos actualizados`,
        numero_pago: resultado.numero_pago
      });
    }

    await ticketsPagoService.actualizarEstadoDesdeGateway(ticket.ticketId, {
      estado: estadoNormalizado,
      idOperacion: idOperacionNormalizado,
      nroOperacion: nro_comprobante || null,
      origen: origenNormalizado,
      fechaOperacion: fecha_operacion || null
    });

    await ticketsPagoService.registrarEventoGateway({
      ticketId: ticket.ticketId,
      externalReference,
      estado: estadoNormalizado,
      idOperacion: idOperacionNormalizado,
      nroOperacion: nro_comprobante || null,
      origen: origenNormalizado,
      payload: req.body,
      processResult: 'APLICADO'
    });

    return res.json({
      received: true,
      processed: false,
      message: `Estado ${estadoNormalizado} registrado`
    });

  } catch (error) {
    console.error('❌ Error al procesar confirmación:', error.message);
    const statusCode = /token/i.test(error.message) ? 401 : 500;
    return res.status(statusCode).json({
      received: false,
      message: IS_PRODUCTION ? 'Error al procesar la confirmación' : error.message
    });
  }
}

/**
 * Página de pago exitoso.
 * GET /pagos/exitoso
 *
 * Usa el estado del token firmado por el gateway como fuente de verdad
 * para la vista (el gateway ya confirmó con SIRO antes de redirigir).
 * El webhook actualiza la BD en background — no bloqueamos la UX esperándolo.
 */
async function pagoExitoso(req, res) {
  try {
    const { externalReference, estado } = validarRedirectSeguro(req);

    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    const detalleTicket = construirDetalleTicket(ticket, externalReference, estado);

    // El estado del token es la fuente de verdad: el gateway lo firma después
    // de confirmar con SIRO. No esperamos a que el webhook actualice la BD.
    const estadoConfirmado = estado || detalleTicket.estado;

    if (estadoConfirmado === 'APROBADO') {
      return res.render('pago/exitoso', {
        title: 'Pago Exitoso',
        municipalidad,
        external_reference: detalleTicket.externalReference,
        ticket_number: detalleTicket.ticketNumber,
        payment_id: detalleTicket.idOperacion,
        status: 'APROBADO',
        monto_total: detalleTicket.montoTotal,
        conceptos: detalleTicket.conceptos,
        email_actual: ''
      });
    }

    // Pago genuinamente pendiente (efectivo, transferencia, SIRO demorado)
    return res.render('pago/pendiente', {
      title: 'Pago Pendiente de Confirmación',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      status: estadoConfirmado,
      monto_total: detalleTicket.montoTotal,
      conceptos: detalleTicket.conceptos,
      mensaje_adicional: null
    });

  } catch (error) {
    console.warn(`⚠️ Redirect inválido a /pagos/exitoso: ${error.message}`);
    return renderizarErrorGenerico(res);
  }
}

/**
 * Página de pago fallido.
 * GET /pagos/error
 */
async function pagoFallido(req, res) {
  try {
    const { externalReference, estado } = validarRedirectSeguro(req);
    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    const detalleTicket = construirDetalleTicket(ticket, externalReference, estado);

    res.render('pago/fallido', {
      title: 'Pago Rechazado',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      status: detalleTicket.estado,
      monto_total: detalleTicket.montoTotal,
      conceptos: detalleTicket.conceptos
    });
  } catch (error) {
    console.warn(`⚠️ Redirect inválido a /pagos/error: ${error.message}`);
    return renderizarErrorGenerico(res);
  }
}

/**
 * Página de pago pendiente.
 * GET /pagos/pendiente
 */
async function pagoPendiente(req, res) {
  try {
    const { externalReference, estado } = validarRedirectSeguro(req);
    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    const detalleTicket = construirDetalleTicket(ticket, externalReference, estado);

    res.render('pago/pendiente', {
      title: 'Pago Pendiente',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      status: detalleTicket.estado,
      monto_total: detalleTicket.montoTotal,
      conceptos: detalleTicket.conceptos,
      mensaje_adicional: null
    });
  } catch (error) {
    console.warn(`⚠️ Redirect inválido a /pagos/pendiente: ${error.message}`);
    return renderizarErrorGenerico(res);
  }
}

function pagoErrorGenerico(_req, res) {
  return renderizarErrorGenerico(res);
}

/**
 * Devuelve el estado actual de un ticket por su external_reference.
 * Usado por el polling de la vista pendiente.
 * GET /api/tickets/estado?ref={externalReference}
 */
async function obtenerEstadoTicket(req, res) {
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({ error: 'Parámetro ref requerido' });
  }

  try {
    const ticket = await ticketsPagoService.obtenerPorExternalReference(ref);

    if (!ticket) {
      return res.status(404).json({ status: 'PENDIENTE', found: false });
    }

    return res.json({
      status: normalizarEstado(ticket.status),
      found: true,
      ticket_number: ticket.ticketNumber || null,
      amount: Number(ticket.amountTotal || 0)
    });
  } catch (error) {
    return res.status(500).json({ status: 'PENDIENTE', error: 'Error consultando estado' });
  }
}

module.exports = {
  iniciarPago,
  confirmacion,
  pagoExitoso,
  pagoFallido,
  pagoPendiente,
  pagoErrorGenerico,
  obtenerEstadoTicket
};
