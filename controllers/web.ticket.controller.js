/**
 * Controlador Web de Tickets de Pago
 * Maneja las solicitudes de generación de tickets
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 */

const ticketService = require('../services/ticket.service');
const { sendSuccess, sendError } = require('../utils/response');

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

module.exports = {
  generarTicket
};
