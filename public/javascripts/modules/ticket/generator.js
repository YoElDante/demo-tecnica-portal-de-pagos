/**
 * Portal de Pagos Municipal — Module / Ticket Generator
 * @description Generación de ticket HTML vía backend y actualización de UI asociada.
 *
 * Exports:
 *   obtenerDatosContribuyente()
 *   extraerTextoDetalle(celda)
 *   generarTicket()
 */

import { getCsrfToken, scrollToElement } from '../utils/dom.js';
import {
  recopilarConceptosSeleccionados,
  extraerTextoDetalle as extraerTextoDetalleSelection
} from '../deuda/selection.js';

// ---------------------------------------------------------------------------
// Datos base del ticket
// ---------------------------------------------------------------------------

/**
 * Obtiene los datos del contribuyente desde el formulario principal.
 * @returns {{dni: string, nombreCompleto: string}}
 */
export function obtenerDatosContribuyente() {
  const dniInput = document.getElementById('dni');
  const nombreInput = document.getElementById('nombre');

  return {
    dni: dniInput?.value.trim() || '',
    nombreCompleto: nombreInput?.value.trim() || ''
  };
}

/**
 * Re-export de helper de limpieza de detalle para mantener API de módulo.
 * @param {HTMLElement} celda
 * @returns {string}
 */
export function extraerTextoDetalle(celda) {
  return extraerTextoDetalleSelection(celda);
}

// ---------------------------------------------------------------------------
// Flujo de generación de ticket
// ---------------------------------------------------------------------------

/**
 * Genera ticket en backend y renderiza preview en frontend.
 * @returns {Promise<void>}
 */
export async function generarTicket() {
  try {
    const conceptos = recopilarConceptosSeleccionados();
    if (conceptos.length === 0) {
      alert('Debe seleccionar al menos un concepto para generar el ticket.');
      return;
    }

    const tieneConceptosValidos = conceptos.some((c) => c.total > 0);
    const totalNeto = conceptos.reduce((acc, c) => acc + c.total, 0);

    if (!tieneConceptosValidos) {
      alert('Solo tiene seleccionadas notas de crédito. Debe incluir al menos un concepto de deuda con saldo a pagar para generar el ticket.');
      return;
    }

    if (totalNeto <= 0) {
      alert('El saldo a favor supera o iguala el monto de los conceptos seleccionados. No hay saldo neto a pagar para generar el ticket.');
      return;
    }

    const contribuyente = obtenerDatosContribuyente();
    if (!contribuyente.dni || !contribuyente.nombreCompleto) {
      alert('⚠️ Faltan datos del contribuyente');
      return;
    }

    const container = document.getElementById('ticket-preview-container');
    if (container) {
      container.innerHTML = '<div class="ticket--loading">Generando ticket...</div>';
      container.style.display = 'block';
    }

    const response = await fetch('/generar-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({ conceptos, contribuyente })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Error al generar el ticket');
    }

    if (container) {
      container.innerHTML = data.html;
      container.style.display = 'block';

      const btnDescargar = document.getElementById('btn-descargar-pdf');
      if (btnDescargar) {
        btnDescargar.disabled = false;
      }

      const botonesInferiores = document.getElementById('ticket-actions-bottom');
      if (botonesInferiores) {
        botonesInferiores.style.display = 'flex';
      }

      const btnDescargarBottom = document.getElementById('btn-descargar-pdf-bottom');
      if (btnDescargarBottom) {
        btnDescargarBottom.disabled = false;
      }

      setTimeout(() => {
        scrollToElement('#ticket-preview-container', 'start');
      }, 100);
    }
  } catch (error) {
    console.error('Error al generar ticket:', error);
    alert(`❌ Error al generar el ticket: ${error.message}`);

    const container = document.getElementById('ticket-preview-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }
}
