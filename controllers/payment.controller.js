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
const ticketService = require('../services/ticket.service');
const deudasService = require('../services/deudas.service');
// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { municipalidad } = require('../config');

const MUNICIPIO_ID = process.env.MUNICIPIO || '';
const GATEWAY_PROVIDER = process.env.PAYMENT_GATEWAY?.toUpperCase();
if (!GATEWAY_PROVIDER) {
  throw new Error('PAYMENT_GATEWAY no configurado. Definir en .env antes de iniciar el servidor.');
}
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PAYMENT_REDIRECT_DEBUG = process.env.PAYMENT_REDIRECT_DEBUG === 'true' || !IS_PRODUCTION;

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

function obtenerContextoRedirect(req = {}) {
  return {
    refQuery: normalizarCadena(req.query?.ref || req.query?.external_reference || req.query?.externalReference),
    hasCode: Boolean(normalizarCadena(req.query?.code)),
    hasToken: Boolean(req.query?.token),
    ip: req.ip,
    requestId: req.requestId || null,
    forwardedFor: req.headers?.['x-forwarded-for'] || null,
    forwardedHost: req.headers?.['x-forwarded-host'] || null,
    forwardedProto: req.headers?.['x-forwarded-proto'] || null
  };
}

function normalizarCadena(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const texto = String(valor).trim();
  return texto.length > 0 ? texto : null;
}

function extraerExternalReferenceRedirect(decoded = {}, query = {}) {
  return normalizarCadena(
    decoded?.ref
    || decoded?.external_reference
    || decoded?.externalReference
    || query?.ref
    || query?.external_reference
    || query?.externalReference
  );
}

function extraerEstadoRedirect(decoded = {}, query = {}) {
  return normalizarCadena(
    decoded?.estado
    || decoded?.status
    || decoded?.payment_status
    || query?.status
    || query?.estado
  );
}

async function validarRedirectSeguro(req) {
  const refRecibida = normalizarCadena(req.query.ref || req.query.external_reference || req.query.externalReference);
  const code = normalizarCadena(req.query.code);

  if (code) {
    const exchanged = await paymentGatewayService.exchangeRedirectCode({
      code,
      externalReference: refRecibida,
      consume: false
    });

    console.log('🔐 [redirect-exchange] Resultado validacion code', {
      ref_query: refRecibida,
      ref_exchange: normalizarCadena(exchanged.external_reference),
      estado: normalizarEstado(exchanged.estado),
      municipio_exchange: exchanged.municipio_id || null,
      issued_at: exchanged.issued_at || null,
      id_operacion: exchanged.id_operacion || null,
      importe: exchanged.importe ?? null
    });

    if (exchanged?.municipio_id && MUNICIPIO_ID && exchanged.municipio_id.toUpperCase() !== MUNICIPIO_ID.toUpperCase()) {
      throw new Error('El redirect code pertenece a otro municipio');
    }

    return {
      externalReference: normalizarCadena(exchanged.external_reference) || refRecibida || 'N/A',
      estado: normalizarEstado(exchanged.estado),
      redirectCode: code,
      redirectToken: null
    };
  }

  const token = req.query.token;
  const decoded = gatewayTokenService.verifyGatewayToken(token);
  const refToken = normalizarCadena(decoded?.ref || decoded?.external_reference || decoded?.externalReference);

  if (refToken && refRecibida && refToken !== refRecibida) {
    throw new Error('La referencia del redirect no coincide con el token firmado');
  }

  if (decoded?.municipio_id && MUNICIPIO_ID && decoded.municipio_id.toUpperCase() !== MUNICIPIO_ID.toUpperCase()) {
    throw new Error('El token pertenece a otro municipio');
  }

  return {
    externalReference: extraerExternalReferenceRedirect(decoded, req.query) || 'N/A',
    estado: normalizarEstado(extraerEstadoRedirect(decoded, req.query)),
    redirectCode: null,
    redirectToken: token || ''
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

function extraerExternalReference(payload = {}) {
  return payload.external_reference || payload.externalReference || null;
}

function extraerEstadoWebhook(payload = {}) {
  const estadoWebhook = payload.estado || payload.status || payload.payment_status;
  return estadoWebhook || (payload.pago_exitoso ? 'APROBADO' : 'PENDIENTE');
}

async function construirDetalleTicket(ticket, externalReference, estadoFallback = 'PENDIENTE') {
  const payload = parsePayloadSnapshot(ticket?.payloadSnapshot);
  const conceptos = Array.isArray(payload?.conceptos)
    ? await ticketService.reconstruirConceptosPersistidos(payload.conceptos)
    : [];

  const montoTotal = Number(
    ticket?.amountTotal
    || payload?.montoTotal
    || conceptos.reduce((acc, concepto) => acc + Number(concepto.totalNumerico || 0), 0)
  );

  return {
    ticketNumber: ticket?.ticketNumber || null,
    externalReference: externalReference || ticket?.externalReference || 'N/A',
    estado: normalizarEstado(ticket?.status || estadoFallback),
    montoTotal,
    montoTotalDisplay: ticketService.formatearMoneda(montoTotal),
    idOperacion: ticket?.idOperacion || null,
    conceptos,
    isDemo: payload?.isDemo === true
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
    const { conceptos, contribuyente, montoTotal, creditosAplicados, is_demo } = req.body;
    const isDemoMode = is_demo === true && MUNICIPIO_ID.toUpperCase() === 'DEMO';

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

    const deudasCliente = await deudasService.obtenerDeudasPorCodigo(codigoContribuyente);
    const deudasPorId = new Map(deudasCliente.map((deuda) => [Number(deuda.IdTrans), deuda]));
    const conceptosEnriquecidos = conceptos.map((concepto) => {
      const idTrans = Number(concepto.IdTrans || concepto.id);
      const deuda = Number.isInteger(idTrans) ? deudasPorId.get(idTrans) : null;

      return {
        ...(deuda || {}),
        ...(concepto || {}),
        IdTrans: Number.isInteger(idTrans) ? idTrans : null,
        Detalle: concepto.Detalle || concepto.detalle || concepto.descripcion || deuda?.Detalle || 'Concepto municipal',
        TipoDescripcion: concepto.TipoDescripcion || concepto.tipoDescripcion || deuda?.TipoDescripcion || 'Concepto municipal',
        IdBien: concepto.IdBien || concepto.idBien || deuda?.IdBien || '-',
        Cuota: concepto.Cuota || concepto.cuota || deuda?.Cuota || '-',
        Anio: concepto.Anio || concepto.anio || deuda?.Anio || '-',
        Fecha: concepto.Fecha || concepto.fecha || deuda?.Fecha || '',
        FechaVto: concepto.FechaVto || concepto.fechaVto || deuda?.FechaVto || '',
        Importe: concepto.Importe || concepto.importe || concepto.monto || deuda?.Importe || 0,
        Interes: concepto.Interes || concepto.interes || deuda?.Interes || 0,
        Total: concepto.Total || concepto.total || concepto.monto || deuda?.Total || 0
      };
    });

    const conceptosPositivos = conceptosEnriquecidos.filter((concepto) => Number(concepto.Total || concepto.total || 0) > 0);

    if (conceptosPositivos.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un concepto con saldo positivo para pagar' });
    }

    const creditosInput = Array.isArray(creditosAplicados) ? creditosAplicados : [];
    const creditosIds = [...new Set(
      creditosInput
        .map((credito) => Number(credito?.id || credito?.IdTrans))
        .filter((id) => Number.isInteger(id) && id > 0)
    )];

    let creditosNormalizados = [];
    if (creditosIds.length > 0) {
      const creditosDesdeBd = await deudasService.obtenerDeudasPorIds(creditosIds);
      creditosNormalizados = creditosDesdeBd
        .filter((credito) => Number(credito.Total || credito.Importe || 0) < 0)
        .map((credito) => ({
          IdTrans: credito.IdTrans,
          Detalle: credito.Detalle || 'Crédito a favor',
          TipoDescripcion: credito.TipoDescripcion || 'Crédito a favor',
          IdBien: credito.IdBien || '-',
          Cuota: credito.Cuota || '-',
          Anio: credito.Anio || '-',
          Fecha: credito.Fecha || '',
          FechaVto: credito.FechaVto || '',
          Importe: Number(credito.Importe || 0),
          Interes: 0,
          Total: Number(credito.Total || 0)
        }));
    }

    const totalPositivos = conceptosPositivos.reduce((acc, concepto) => acc + Number(concepto.Total || 0), 0);
    const totalCreditos = creditosNormalizados.reduce((acc, credito) => acc + Number(credito.Total || 0), 0);
    const montoNeto = Number((totalPositivos + totalCreditos).toFixed(2));

    if (montoNeto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El saldo neto a pagar es menor o igual a cero. Existe crédito a favor del contribuyente.'
      });
    }

    const nombreCompleto = `${cliente.Nombre || ''} ${cliente.Apellido || ''}`.trim();

    const { ticket, ticketNumber } = await ticketsPagoService.crearTicketConNumeroUnico({
      municipioId: MUNICIPIO_ID.toUpperCase(),
      dni: contribuyente.dni,
      gatewayProvider: GATEWAY_PROVIDER,
      amountTotal: montoNeto,
      payloadSnapshot: {
        conceptos: conceptosPositivos,
        creditosAplicados: creditosNormalizados,
        contribuyente: { dni: contribuyente.dni, nombreCompleto },
        montoTotal: montoNeto,
        montoPositivos: totalPositivos,
        montoCreditos: totalCreditos,
        montoSolicitadoFrontend: Number(montoTotal || 0),
        isDemo: isDemoMode
      }
    });

    console.log('🎫 Ticket creado en BD:', { ticketNumber, ticketId: ticket.ticketId });

    const resultado = await paymentGatewayService.createPayment({
      contribuyente: { ...contribuyente, codigo: codigoContribuyente },
      conceptos: conceptosPositivos,
      montoTotal: montoNeto,
      ticketNumber
    });

    const externalReference = resultado.external_reference || resultado.externalReference || null;
    if (!externalReference) {
      throw new Error('El gateway no devolvio external_reference para correlacionar el ticket');
    }

    await ticketsPagoService.actualizarConReferencia(ticket.ticketId, externalReference, ticketNumber);

    console.log(`🔗 Redirigiendo a ${GATEWAY_PROVIDER}:`, {
      external_reference: externalReference,
      ticketNumber
    });

    return res.json({
      success: true,
      redirect_url: resultado.payment_url,
      external_reference: externalReference,
      ticket_number: ticketNumber,
      monto_neto: montoNeto,
      credito_aplicado: totalCreditos
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

    const payload = req.body?.data && typeof req.body.data === 'object' ? req.body.data : req.body;
    const {
      pago_exitoso,
      importe,
      medio_pago,
      id_operacion,
      idOperacion,
      fecha_operacion,
      fechaOperacion,
      nro_comprobante,
      nroOperacion,
      origen,
      payment_id,
      paymentId,
      transaction_amount,
      transactionAmount,
      date_approved,
      dateApproved
    } = payload;

    const estadoNormalizado = normalizarEstado(extraerEstadoWebhook(payload));
    const externalReference = extraerExternalReference(payload);

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

    const idOperacionNormalizado = id_operacion || idOperacion || payment_id || paymentId || externalReference;
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
        importe: importe || transaction_amount || transactionAmount,
        fechaOperacion: fecha_operacion || fechaOperacion || date_approved || dateApproved
      });

      await ticketsPagoService.actualizarEstadoDesdeGateway(ticket.ticketId, {
        estado: estadoNormalizado,
        idOperacion: idOperacionNormalizado,
        nroOperacion: nro_comprobante || nroOperacion || null,
        origen: origenNormalizado,
        fechaOperacion: fecha_operacion || fechaOperacion || date_approved || dateApproved
      });

      await ticketsPagoService.registrarEventoGateway({
        ticketId: ticket.ticketId,
        externalReference,
        estado: estadoNormalizado,
        idOperacion: idOperacionNormalizado,
        nroOperacion: nro_comprobante || nroOperacion || null,
        origen: origenNormalizado,
        payload,
        processResult: resultado.already_processed
          ? 'DUPLICADO'
          : 'APLICADO',
        errorMessage: null
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
      nroOperacion: nro_comprobante || nroOperacion || null,
      origen: origenNormalizado,
      fechaOperacion: fecha_operacion || fechaOperacion || null
    });

    await ticketsPagoService.registrarEventoGateway({
      ticketId: ticket.ticketId,
      externalReference,
      estado: estadoNormalizado,
      idOperacion: idOperacionNormalizado,
      nroOperacion: nro_comprobante || nroOperacion || null,
      origen: origenNormalizado,
      payload,
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
    const { externalReference, estado, redirectCode, redirectToken } = await validarRedirectSeguro(req);

    if (PAYMENT_REDIRECT_DEBUG) {
      console.log('🔍 [pagoExitoso] Buscando ticket:', {
        externalReference,
        estado,
        hasToken: Boolean(req.query.token)
      });
    }

    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);

    if (!ticket) {
      console.warn('⚠️ [pagoExitoso] No se encontro ticket para external_reference', {
        externalReference,
        estado,
        ...obtenerContextoRedirect(req)
      });
      throw new Error(`Ticket no encontrado para external_reference=${externalReference}`);
    }

    if (PAYMENT_REDIRECT_DEBUG) {
      console.log('🔍 [pagoExitoso] Ticket encontrado:', ticket ? {
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        amountTotal: ticket.amountTotal,
        hasSnapshot: Boolean(ticket.payloadSnapshot),
        snapshotLength: ticket.payloadSnapshot?.length || 0
      } : 'NULL');
    }

    const detalleTicket = await construirDetalleTicket(ticket, externalReference, estado);

    if (PAYMENT_REDIRECT_DEBUG) {
      console.log('🔍 [pagoExitoso] Detalle construido:', {
        montoTotal: detalleTicket.montoTotal,
        conceptosCount: detalleTicket.conceptos.length,
        estado: detalleTicket.estado,
        ticketNumber: detalleTicket.ticketNumber
      });
    }

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
        redirect_token: redirectToken || '',
        redirect_code: redirectCode || '',
        status: 'APROBADO',
        monto_total: detalleTicket.montoTotal,
        monto_total_display: detalleTicket.montoTotalDisplay,
        conceptos: detalleTicket.conceptos,
        email_actual: '',
        is_demo: detalleTicket.isDemo
      });
    }

    // Pago genuinamente pendiente (efectivo, transferencia, SIRO demorado)
    return res.render('pago/pendiente', {
      title: 'Pago Pendiente de Confirmación',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      redirect_token: req.query.token || '',
      status: estadoConfirmado,
      monto_total: detalleTicket.montoTotal,
      conceptos: detalleTicket.conceptos,
      mensaje_adicional: null
    });

  } catch (error) {
    console.warn(`⚠️ Redirect inválido a /pagos/exitoso: ${error.message}`, obtenerContextoRedirect(req));
    return renderizarErrorGenerico(res);
  }
}

/**
 * Página de pago fallido.
 * GET /pagos/error
 */
async function pagoFallido(req, res) {
  try {
    const { externalReference, estado, redirectCode, redirectToken } = await validarRedirectSeguro(req);
    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    const detalleTicket = await construirDetalleTicket(ticket, externalReference, estado);

    res.render('pago/fallido', {
      title: 'Pago Rechazado',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      redirect_token: redirectToken || '',
      redirect_code: redirectCode || '',
      status: detalleTicket.estado,
      monto_total: detalleTicket.montoTotal,
      monto_total_display: detalleTicket.montoTotalDisplay,
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
    const { externalReference, estado, redirectCode, redirectToken } = await validarRedirectSeguro(req);
    const ticket = await ticketsPagoService.obtenerPorExternalReference(externalReference);
    const detalleTicket = await construirDetalleTicket(ticket, externalReference, estado);

    res.render('pago/pendiente', {
      title: 'Pago Pendiente',
      municipalidad,
      external_reference: detalleTicket.externalReference,
      ticket_number: detalleTicket.ticketNumber,
      payment_id: detalleTicket.idOperacion,
      redirect_token: redirectToken || '',
      redirect_code: redirectCode || '',
      status: detalleTicket.estado,
      monto_total: detalleTicket.montoTotal,
      monto_total_display: detalleTicket.montoTotalDisplay,
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
