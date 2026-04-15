/**
 * Controlador de Pagos
 * Maneja el inicio de pago, redirects firmados y webhook del gateway
 * 
 * @author Generado para integración MP
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

const MUNICIPIO_ID = process.env.MUNICIPIO_ID || process.env.MUNICIPIO || '';

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
      descripcion: concepto.detalle || concepto.tipoDescripcion || concepto.descripcion || 'Concepto municipal',
      importe: Number(concepto.total || concepto.importeNumerico || concepto.importe || 0)
    }))
    : [];

  return {
    ticketNumber: ticket?.ticketNumber || 'N/A',
    externalReference: externalReference || ticket?.externalReference || 'N/A',
    estado: normalizarEstado(ticket?.status || estadoFallback),
    montoTotal: Number(ticket?.amountTotal || payload?.montoTotal || 0),
    idOperacion: ticket?.idOperacion || 'N/A',
    conceptos
  };
}

/**
 * Inicia el proceso de pago
 * POST /pagos/iniciar
 * 
 * Recibe los datos del ticket y los envía al API Gateway
 * Luego redirige al usuario a SIRO
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
    if (!contribuyente || !contribuyente.dni) {
      return res.status(400).json({ success: false, message: 'Los datos del contribuyente son requeridos' });
    }
    if (!montoTotal || Number(montoTotal) <= 0) {
      return res.status(400).json({ success: false, message: 'El monto total debe ser mayor a cero' });
    }

    const cliente = await clientesService.buscarPorDni(contribuyente.dni);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Contribuyente no encontrado' });
    }
    const codigoContribuyente = cliente.Codigo;

    const { ticket, ticketNumber } = await ticketsPagoService.crearTicketConNumeroUnico({
      municipioId: MUNICIPIO_ID.toUpperCase(),
      dni: contribuyente.dni,
      gatewayProvider: 'SIRO',
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

    console.log('🔗 Redirigiendo a SIRO:', {
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
      message: error.message || 'Error al procesar el pago'
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
      message: error.message
    });
  }
}

/**
 * Página de pago exitoso.
 * GET /pagos/exitoso
 */
async function pagoExitoso(req, res) {
  try {
    const { externalReference, estado } = validarRedirectSeguro(req);

    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    const detalleTicket = construirDetalleTicket(ticket, externalReference, estado);

    // Si el usuario llega por redirect antes del webhook confirmado,
    // mostrar estado pendiente para evitar confirmar visualmente un pago aún no impactado en BD.
    if (!ticket || normalizarEstado(ticket.status) !== 'APROBADO') {
      return res.render('pago/pendiente', {
        title: 'Pago Pendiente de Confirmación',
        municipalidad,
        external_reference: detalleTicket.externalReference,
        ticket_number: detalleTicket.ticketNumber,
        payment_id: detalleTicket.idOperacion,
        status: 'PENDIENTE',
        monto_total: detalleTicket.montoTotal,
        conceptos: detalleTicket.conceptos,
        mensaje_adicional: 'Recibimos tu intento de pago. Estamos esperando confirmación final de la pasarela.'
      });
    }

    res.render('pago/exitoso', {
      title: 'Pago Exitoso',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      status: detalleTicket.estado,
      monto_total: detalleTicket.montoTotal,
      conceptos: detalleTicket.conceptos,
      email_actual: ''
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

module.exports = {
  iniciarPago,
  confirmacion,
  pagoExitoso,
  pagoFallido,
  pagoPendiente,
  pagoErrorGenerico
};
