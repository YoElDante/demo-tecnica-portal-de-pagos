/**
 * Controlador Web de Tickets de Pago
 * Maneja las solicitudes de generación de tickets y comprobantes de pago
 *
 * @author Dante Marcos Delprato
 * @version 1.1
 */

const ticketService = require('../services/ticket.service');
const ticketsPagoService = require('../services/ticketsPago.service');
const { sendSuccess, sendError } = require('../utils/response');
const { municipalidad } = require('../config');

/**
 * Genera el HTML del ticket de pago
 * POST /generar-ticket
 * 
 * Espera en el body:
 * {
 *   conceptos: [...],  // Array de conceptos seleccionados
 *   contribuyente: {   // Datos del contribuyente
 *     dni: "...",
 *     nombreCompleto: "..."
 *   }
 * }
 */
async function generarTicket(req, res, next) {
  try {
    const { conceptos, contribuyente } = req.body;

    // Validar datos recibidos
    const validacion = ticketService.validarDatosTicket({ conceptos, contribuyente });

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errores: validacion.errores
      });
    }

    // Preparar datos para el partial
    const datosTicket = ticketService.prepararDatosTicket({
      conceptos,
      contribuyente
    });

    // Renderizar el partial como HTML
    res.render('partials/ticket-preview', datosTicket, (err, html) => {
      if (err) {
        console.error('Error al renderizar ticket:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al generar el ticket',
          error: err.message
        });
      }

      // Enviar el HTML renderizado
      res.json({
        success: true,
        html: html,
        metadata: datosTicket.metadata
      });
    });

  } catch (error) {
    console.error('Error en generarTicket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

/**
 * Renderiza el comprobante de pago en una página imprimible.
 * GET /pagos/comprobante?ref={externalReference}
 *
 * Recupera los datos del ticket desde la BD (snapshot de conceptos,
 * estado actual, número de comprobante) y los presenta en formato A4.
 * Funciona para cualquier estado: APROBADO, PENDIENTE o RECHAZADO.
 */
async function generarComprobantePago(req, res) {
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).send('Parámetro ref requerido');
  }

  try {
    const ticket = await ticketsPagoService.obtenerPorExternalReference(ref);

    // Extraer conceptos del snapshot
    let conceptosProcesados = [];
    let contribuyente = { nombreCompleto: 'No disponible', dni: '-' };

    if (ticket?.payloadSnapshot) {
      try {
        const snapshot = typeof ticket.payloadSnapshot === 'string'
          ? JSON.parse(ticket.payloadSnapshot)
          : ticket.payloadSnapshot;

        if (Array.isArray(snapshot?.conceptos)) {
          conceptosProcesados = ticketService.procesarConceptos(snapshot.conceptos);
        }

        if (snapshot?.contribuyente) {
          const c = snapshot.contribuyente;
          contribuyente = {
            nombreCompleto: c.nombreCompleto ||
              `${c.nombre || ''} ${c.apellido || ''}`.trim() ||
              'No especificado',
            dni: c.dni || '-'
          };
        }
      } catch (_) {
        // snapshot inválido — seguir con datos vacíos
      }
    }

    const totalGeneral = ticketService.formatearMoneda(
      conceptosProcesados.reduce((sum, c) => sum + (c.totalNumerico || 0), 0)
    );

    // Estado normalizado para CSS y lógica de la vista
    const estadoRaw = ticket?.status || 'PENDIENTE';
    const estadoCss = estadoRaw === 'APROBADO' ? 'aprobado'
      : estadoRaw === 'RECHAZADO' || estadoRaw === 'EXPIRADO' ? 'rechazado'
      : 'pendiente';

    return res.render('pago/comprobante', {
      municipalidad,
      externalReference: ref,
      ticketNumber: ticket?.ticketNumber || null,
      idOperacion: ticket?.idOperacion || null,
      nroOperacion: ticket?.nroOperacion || null,
      estadoCss,
      contribuyente,
      conceptos: conceptosProcesados,
      totalGeneral,
      fechaEmision: ticketService.obtenerFechaEmision()
    });

  } catch (error) {
    console.error('[Comprobante] Error generando comprobante:', error.message);
    return res.status(500).send('Error al generar el comprobante. Intente nuevamente.');
  }
}

module.exports = {
  generarTicket,
  generarComprobantePago
};
