/**
 * Portal de Pagos Municipal — Entry Point (ES Modules)
 * @description Inicialización del frontend modular (deudas, ticket, pago, estado y panel demo).
 *
 * Exports: None — bootstrap del cliente.
 */

import { actualizarTotal, obtenerCheckboxesConceptos, toggleTodos } from './modules/deuda/selection.js';
import { generarTicket } from './modules/ticket/generator.js';
import { descargarPDF } from './modules/ticket/pdf.js';
import { iniciarPago, volverArriba, setContribuyenteData } from './modules/pago/init.js';
import { initContribuyenteData } from './modules/state/contribuyente.js';
import { initDemoPanel } from './modules/state/demo-panel.js';

// ---------------------------------------------------------------------------
// Helpers locales de bootstrap
// ---------------------------------------------------------------------------

/**
 * Reemplaza un nodo por su clon para limpiar listeners previos y agrega uno nuevo.
 * @param {string} id - ID del elemento a actualizar.
 * @param {Function} handler - Handler de click.
 * @returns {void}
 */
function resetClickHandler(id, handler) {
  const target = document.getElementById(id);
  if (!target) return;

  const clone = target.cloneNode(true);
  target.replaceWith(clone);
  clone.addEventListener('click', handler);
}

/**
 * Envía formulario de búsqueda usando el DNI provisto por chip demo.
 * @param {string} dni - DNI sugerido.
 * @returns {void}
 */
function seleccionarContribuyente(dni) {
  const dniInput = document.getElementById('dni');
  const formBuscar = document.getElementById('form-buscar');
  if (!dniInput || !formBuscar) return;

  dniInput.value = dni;
  formBuscar.submit();
}

/**
 * Inicializa eventos de la grilla de deudas y botones de ticket.
 * @returns {void}
 */
function inicializarEventosDeudas() {
  const checkboxes = obtenerCheckboxesConceptos();
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', actualizarTotal);
  });

  const checkboxTodos = document.getElementById('checkbox-todos');
  if (checkboxTodos) {
    checkboxTodos.addEventListener('change', toggleTodos);
  }

  const filtroSelect = document.getElementById('filtro-tipo');
  if (filtroSelect) {
    filtroSelect.addEventListener('change', function onFiltroChange() {
      const valor = this.value;
      const filas = document.querySelectorAll('tbody tr[data-tipo]');
      filas.forEach((fila) => {
        const tipo = fila.getAttribute('data-tipo') || '';
        let visible;

        if (!valor) {
          visible = true;
        } else if (valor === '__credito__') {
          visible = parseFloat(fila.getAttribute('data-total-deuda') || '0') < 0;
        } else {
          visible = tipo === valor;
        }

        fila.style.display = visible ? '' : 'none';
      });
      actualizarTotal();
    });
  }

  const btnGenerarTicket = document.getElementById('btn-generar-ticket');
  if (btnGenerarTicket) {
    btnGenerarTicket.addEventListener('click', generarTicket);
  }

  resetClickHandler('btn-descargar-pdf', descargarPDF);
  resetClickHandler('btn-descargar-pdf-bottom', descargarPDF);
}

/**
 * Inicializa el toggle de la tarjeta informativa demo en index.
 * @returns {void}
 */
function inicializarDemoInfoCard() {
  const body = document.getElementById('demo-info-body');
  if (!body) return;

  const toggle = document.getElementById('demo-info-toggle');
  const icon = document.getElementById('demo-info-toggle-icon');
  if (!toggle || !icon) return;

  const storageKey = 'demo_info_collapsed';

  const aplicarEstado = (colapsado) => {
    if (colapsado) {
      body.classList.add('demo-info__body--hidden');
      icon.textContent = '▼';
      toggle.title = 'Mostrar información';
    } else {
      body.classList.remove('demo-info__body--hidden');
      icon.textContent = '▲';
      toggle.title = 'Ocultar información';
    }
  };

  aplicarEstado(localStorage.getItem(storageKey) === '1');

  toggle.addEventListener('click', () => {
    const ahora = body.classList.contains('demo-info__body--hidden');
    localStorage.setItem(storageKey, ahora ? '0' : '1');
    aplicarEstado(!ahora);
  });
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  inicializarDemoInfoCard();
  initDemoPanel();
  inicializarEventosDeudas();

  const btnIrAPagar = document.getElementById('btn-ir-a-pagar');
  if (btnIrAPagar) {
    btnIrAPagar.addEventListener('click', iniciarPago);
  }

  const btnIrAPagarBottom = document.getElementById('btn-ir-a-pagar-bottom');
  if (btnIrAPagarBottom) {
    btnIrAPagarBottom.addEventListener('click', iniciarPago);
  }

  const btnVolverArriba = document.getElementById('btn-volver-arriba');
  if (btnVolverArriba) {
    btnVolverArriba.addEventListener('click', volverArriba);
  }

  const chipsContribuyente = document.querySelectorAll('[data-dni-sugerido]');
  chipsContribuyente.forEach((chip) => {
    chip.addEventListener('click', () => {
      seleccionarContribuyente(chip.getAttribute('data-dni-sugerido') || '');
    });
  });

  const contribuyenteData = await initContribuyenteData();
  setContribuyenteData(contribuyenteData);

  actualizarTotal();
});
