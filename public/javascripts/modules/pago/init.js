/**
 * Portal de Pagos Municipal — Module / Pago Init
 * @description Inicio del flujo de pago desde ticket/deudas con overlay de redireccion y timeout de respaldo.
 *
 * Exports:
 *   setContribuyenteData(data)
 *   getContribuyenteData()
 *   iniciarPago()
 *   volverArriba()
 */

import { extraerNumero } from '../utils/currency.js';
import { getCsrfToken } from '../utils/dom.js';
import {
  recopilarIdTransSeleccionados,
  recopilarCreditosFavorVisibles,
  recopilarConceptosParaPago
} from '../deuda/selection.js';

let contribuyenteData = null;

// ---------------------------------------------------------------------------
// Estado de contribuyente
// ---------------------------------------------------------------------------

/**
 * Setea el estado local de contribuyente para payload de pago.
 * @param {Object|null} data
 * @returns {void}
 */
export function setContribuyenteData(data) {
  contribuyenteData = data;
}

/**
 * Retorna el contribuyente actualmente cargado.
 * @returns {Object|null}
 */
export function getContribuyenteData() {
  return contribuyenteData;
}

// ---------------------------------------------------------------------------
// Overlay de redirección
// ---------------------------------------------------------------------------

let overlayPrevFocus = null;

/**
 * Abre el overlay de redirección al pago con focus trap.
 * @returns {void}
 */
function abrirOverlay() {
  const overlay = document.getElementById('overlay-pago');
  const mensaje = document.getElementById('overlay-msg');
  if (!overlay) return;

  overlayPrevFocus = document.activeElement;
  overlay.style.display = 'flex';
  if (mensaje) mensaje.focus();

  document.addEventListener('keydown', focusTrapOverlay);
}

/**
 * Cierra el overlay y restaura el foco al elemento previo.
 * @returns {void}
 */
function cerrarOverlay() {
  const overlay = document.getElementById('overlay-pago');
  if (overlay) overlay.style.display = 'none';

  document.removeEventListener('keydown', focusTrapOverlay);

  if (overlayPrevFocus && typeof overlayPrevFocus.focus === 'function') {
    overlayPrevFocus.focus();
    overlayPrevFocus = null;
  }
}

/**
 * Focus trap: mantiene Tab/Shift+Tab dentro del overlay.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function focusTrapOverlay(event) {
  if (event.key !== 'Tab') return;

  const overlay = document.getElementById('overlay-pago');
  if (!overlay || overlay.style.display === 'none') return;

  const focusables = overlay.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

// ---------------------------------------------------------------------------
// Flujo de pago
// ---------------------------------------------------------------------------

/**
 * Inicia el pago contra backend con overlay de redirección y timeout.
 * @returns {Promise<void>}
 */
export async function iniciarPago() {
  const botonesIds = ['btn-ir-a-pagar', 'btn-ir-a-pagar-bottom'];

  const conceptosIds = recopilarIdTransSeleccionados();
  if (conceptosIds.length === 0) {
    alert('Debe seleccionar al menos un concepto para iniciar el pago.');
    return;
  }

  const conceptos = recopilarConceptosParaPago();
  const tieneConceptosValidos = conceptos.some((c) => c.monto > 0);

  if (!tieneConceptosValidos) {
    alert('Solo tiene seleccionadas notas de crédito. Debe incluir al menos un concepto de deuda con saldo a pagar para continuar.');
    return;
  }

  const creditosAplicados = recopilarCreditosFavorVisibles();
  const totalElement = document.getElementById('total-final');
  const montoTotal = extraerNumero(totalElement?.textContent || '0');

  if (montoTotal <= 0) {
    alert('El saldo a favor supera o iguala el monto a pagar. No hay importe neto pendiente para procesar el pago.');
    return;
  }

  botonesIds.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Procesando...';
    }
  });

  abrirOverlay();

  const demoResultado = (window.DEMO_PANEL && window.DEMO_PANEL.resultado) || 'real';
  const isDemoMode = window.DEMO_PANEL ? !window.DEMO_PANEL.modificaBD : false;

  try {
    const response = await Promise.race([
      fetch('/pago/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          contribuyente: contribuyenteData,
          conceptos,
          montoTotal,
          creditosAplicados,
          is_demo: isDemoMode,
          demo_resultado: demoResultado
        })
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 30000))
    ]);

    const data = await response.json();

    if (data.success && data.redirect_url) {
      window.location.href = data.redirect_url;
      return;
    }

    throw new Error(data.message || 'Error al iniciar el pago');
  } catch (error) {
    console.error('Error al iniciar pago:', error);
    const mensaje = error.message === 'TIMEOUT'
      ? 'El servidor está demorando más de lo esperado. Intente nuevamente.'
      : `Error al procesar el pago: ${error.message}`;
    alert(mensaje);

    cerrarOverlay();

    botonesIds.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '💳 Ir a Pagar';
      }
    });
  }
}

/**
 * Hace scroll al tope de la página.
 * @returns {void}
 */
export function volverArriba() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
