/**
 * Portal de Pagos Municipal — Module / Pago Init
 * @description Inicio del flujo de pago desde ticket/deudas, sin cambios de comportamiento.
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
// Flujo de pago
// ---------------------------------------------------------------------------

/**
 * Inicia el pago contra backend preservando el flujo legacy.
 * @returns {Promise<void>}
 */
export async function iniciarPago() {
  const botonesIds = ['btn-ir-a-pagar', 'btn-ir-a-pagar-bottom'];
  const loadingContainer = document.getElementById('qr-container');
  const loadingMsg = document.getElementById('pago-loading');

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

  if (loadingContainer) {
    loadingContainer.style.display = 'flex';
    setTimeout(() => loadingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }
  if (loadingMsg) {
    loadingMsg.style.display = 'block';
  }

  const demoResultado = (window.DEMO_PANEL && window.DEMO_PANEL.resultado) || 'real';
  const isDemoMode = window.DEMO_PANEL ? !window.DEMO_PANEL.modificaBD : false;

  try {
    const response = await fetch('/pago/iniciar', {
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
    });

    const data = await response.json();

    if (data.success && data.redirect_url) {
      window.location.href = data.redirect_url;
      return;
    }

    throw new Error(data.message || 'Error al iniciar el pago');
  } catch (error) {
    console.error('Error al iniciar pago:', error);
    alert(`Error al procesar el pago: ${error.message}`);

    botonesIds.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '💳 Ir a Pagar';
      }
    });

    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }
}

/**
 * Hace scroll al tope de la página.
 * @returns {void}
 */
export function volverArriba() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
