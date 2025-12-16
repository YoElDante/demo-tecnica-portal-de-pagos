/**
 * Controlador de Pagos
 * Maneja las rutas relacionadas con el proceso de pago con MercadoPago
 * 
 * @author Generado para integración MP
 * @version 1.0
 * @date 2025-12-13
 */

const paymentGatewayService = require('../services/paymentGateway.service');

/**
 * Inicia el proceso de pago
 * POST /pago/iniciar
 * 
 * Recibe los datos del ticket y los envía al API Gateway
 * Luego redirige al usuario a MercadoPago
 */
async function iniciarPago(req, res) {
  try {
    const { conceptos, contribuyente, montoTotal } = req.body;

    console.log('🛒 Iniciando proceso de pago:', {
      contribuyente_dni: contribuyente?.dni,
      cantidad_conceptos: conceptos?.length,
      monto_total: montoTotal
    });

    // Validar que lleguen los datos necesarios
    if (!conceptos || conceptos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron conceptos para pagar'
      });
    }

    if (!contribuyente || !contribuyente.dni) {
      return res.status(400).json({
        success: false,
        message: 'Los datos del contribuyente son requeridos'
      });
    }

    // Llamar al servicio de Payment Gateway
    const resultado = await paymentGatewayService.createPayment({
      contribuyente,
      conceptos,
      montoTotal
    });

    // En desarrollo usamos sandbox_url, en producción payment_url
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? resultado.payment_url 
      : resultado.sandbox_url;

    console.log('🔗 Redirigiendo a MercadoPago:', redirectUrl);

    // Responder con la URL para redirección
    // El frontend hará la redirección
    return res.json({
      success: true,
      redirect_url: redirectUrl,
      external_reference: resultado.external_reference
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
 * Recibe la confirmación de pago desde el API Gateway
 * POST /api/pagos/confirmacion
 * 
 * Este endpoint es llamado por el API Gateway cuando MercadoPago
 * confirma un cambio de estado en el pago
 */
async function confirmacion(req, res) {
  try {
    const {
      external_reference,
      status,
      status_detail,
      payment_id,
      transaction_amount,
      date_approved,
      metadata
    } = req.body;

    console.log('📥 Confirmación de pago recibida:', {
      external_reference,
      status,
      payment_id,
      transaction_amount
    });

    // Validar que lleguen los datos mínimos
    if (!external_reference || !status) {
      return res.status(400).json({
        received: false,
        message: 'Datos incompletos en la confirmación'
      });
    }

    // Procesar según el estado
    if (status === 'approved') {
      // TODO: Llamar a pagos.service.js para actualizar BD
      // await pagosService.marcarComoPagado(metadata.conceptos_ids, {
      //   external_reference,
      //   payment_id,
      //   date_approved
      // });
      console.log('✅ Pago aprobado - Pendiente actualizar BD');
    } else if (status === 'rejected') {
      console.log('❌ Pago rechazado:', status_detail);
    } else if (status === 'pending') {
      console.log('⏳ Pago pendiente:', status_detail);
    }

    // Siempre responder éxito para que la API Gateway sepa que recibimos
    return res.json({
      received: true,
      message: 'Confirmación procesada'
    });

  } catch (error) {
    console.error('❌ Error al procesar confirmación:', error.message);
    // Aún así respondemos para no causar reintentos innecesarios
    return res.status(500).json({
      received: false,
      message: error.message
    });
  }
}

/**
 * Página de pago exitoso
 * GET /pago/exitoso
 * 
 * MercadoPago redirige aquí cuando el pago fue aprobado
 */
async function pagoExitoso(req, res) {
  const { external_reference, payment_id, status } = req.query;

  console.log('🎉 Usuario llegó a página de éxito:', {
    external_reference,
    payment_id,
    status
  });

  // TODO: Obtener datos del contribuyente para mostrar email
  // const cliente = await clientesService.buscarPorReferencia(external_reference);

  res.render('pago/exitoso', {
    title: 'Pago Exitoso',
    external_reference: external_reference || 'N/A',
    payment_id: payment_id || 'N/A',
    status: status || 'approved',
    email_actual: '' // TODO: Obtener de BD
  });
}

/**
 * Página de pago fallido
 * GET /pago/fallido
 * 
 * MercadoPago redirige aquí cuando el pago fue rechazado
 */
async function pagoFallido(req, res) {
  const { external_reference, status } = req.query;

  console.log('😞 Usuario llegó a página de fallo:', {
    external_reference,
    status
  });

  res.render('pago/fallido', {
    title: 'Pago Rechazado',
    external_reference: external_reference || 'N/A',
    status: status || 'rejected'
  });
}

/**
 * Página de pago pendiente
 * GET /pago/pendiente
 * 
 * MercadoPago redirige aquí cuando el pago quedó pendiente
 */
async function pagoPendiente(req, res) {
  const { external_reference, status } = req.query;

  console.log('⏳ Usuario llegó a página de pendiente:', {
    external_reference,
    status
  });

  res.render('pago/pendiente', {
    title: 'Pago Pendiente',
    external_reference: external_reference || 'N/A',
    status: status || 'pending'
  });
}

module.exports = {
  iniciarPago,
  confirmacion,
  pagoExitoso,
  pagoFallido,
  pagoPendiente
};
