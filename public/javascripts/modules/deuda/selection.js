/**
 * Portal de Pagos Municipal — Module / Deuda Selection
 * @description Gestión de selección de conceptos, totales y recopilación de datos para ticket/pago.
 *
 * Exports:
 *   obtenerCheckboxesConceptos()
 *   obtenerCheckboxesConceptosMarcados()
 *   obtenerCreditoAutomaticoVisible()
 *   actualizarCheckboxTodos()
 *   actualizarContadores()
 *   actualizarTotal()
 *   toggleTodos()
 *   extraerTextoDetalle(celda)
 *   recopilarConceptosSeleccionados()
 *   recopilarIdTransSeleccionados()
 *   recopilarCreditosFavorVisibles()
 *   recopilarConceptosParaPago()
 */

import { extraerNumero, extraerNumeroConSigno, formatCurrency } from '../utils/currency.js';
import { parsearFechaParaOrden } from '../utils/date.js';
import { isRowVisible } from '../utils/dom.js';

// ---------------------------------------------------------------------------
// Selección base de conceptos
// ---------------------------------------------------------------------------

/**
 * Obtiene todos los checkboxes de conceptos de deuda.
 * @returns {HTMLInputElement[]}
 */
export function obtenerCheckboxesConceptos() {
  return Array.from(document.querySelectorAll('.deudas__checkbox[data-idtrans]'));
}

/**
 * Obtiene los checkboxes de conceptos marcados.
 * @returns {HTMLInputElement[]}
 */
export function obtenerCheckboxesConceptosMarcados() {
  return Array.from(document.querySelectorAll('.deudas__checkbox[data-idtrans]:checked'));
}

/**
 * Suma el crédito visible (totales negativos) en la tabla filtrada.
 * @returns {number}
 */
export function obtenerCreditoAutomaticoVisible() {
  const filasVisibles = document.querySelectorAll('tbody tr[data-total-deuda]:not([style*="display: none"])');
  let totalCredito = 0;

  filasVisibles.forEach((fila) => {
    const totalFila = parseFloat(fila.getAttribute('data-total-deuda') || '0');
    if (totalFila < 0) {
      totalCredito += totalFila;
    }
  });

  return totalCredito;
}

/**
 * Actualiza el estado checked/indeterminate del checkbox "Seleccionar Todo".
 * @returns {void}
 */
export function actualizarCheckboxTodos() {
  const checkboxTodos = document.getElementById('checkbox-todos');
  if (!checkboxTodos) return;

  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');
  const checkboxesVisibles = Array.from(filasVisibles)
    .map((fila) => fila.querySelector('.deudas__checkbox'))
    .filter(Boolean);

  const marcadosVisibles = checkboxesVisibles.filter((checkbox) => checkbox.checked);

  if (checkboxesVisibles.length > 0) {
    const todosMarcados = checkboxesVisibles.length === marcadosVisibles.length;
    const ningunoMarcado = marcadosVisibles.length === 0;
    checkboxTodos.checked = todosMarcados;
    checkboxTodos.indeterminate = !todosMarcados && !ningunoMarcado;
    return;
  }

  checkboxTodos.checked = false;
  checkboxTodos.indeterminate = false;
}

/**
 * Actualiza contadores: deudas visibles, notas de crédito y conceptos seleccionados.
 * @returns {void}
 */
export function actualizarContadores() {
  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');
  let totalDeudas = 0;
  let totalCreditos = 0;
  let seleccionados = 0;

  filasVisibles.forEach((fila) => {
    const checkbox = fila.querySelector('.deudas__checkbox');
    if (!checkbox) return;

    const totalFila = parseFloat(fila.getAttribute('data-total-deuda') || '0');
    if (totalFila < 0) {
      totalCreditos += 1;
    } else {
      totalDeudas += 1;
    }

    if (checkbox.checked) {
      seleccionados += 1;
    }
  });

  const totalElement = document.getElementById('contador-deudas-total');
  const creditosElement = document.getElementById('contador-creditos-total');
  const seleccionadasElement = document.getElementById('contador-deudas-seleccionadas');

  if (totalElement) totalElement.textContent = String(totalDeudas);
  if (creditosElement) creditosElement.textContent = String(totalCreditos);
  if (seleccionadasElement) seleccionadasElement.textContent = String(seleccionados);
}

/**
 * Recalcula el total neto a pagar según selección visible.
 * @returns {void}
 */
export function actualizarTotal() {
  const checkboxes = obtenerCheckboxesConceptosMarcados();
  let totalPositivosSeleccionados = 0;
  let totalCreditosSeleccionados = 0;

  checkboxes.forEach((checkbox) => {
    const fila = checkbox.closest('tr');
    if (!isRowVisible(fila)) return;

    const montoConcepto = parseFloat(checkbox.dataset.total || '0');
    if (montoConcepto > 0) {
      totalPositivosSeleccionados += montoConcepto;
    } else if (montoConcepto < 0) {
      totalCreditosSeleccionados += montoConcepto;
    }
  });

  const total = totalPositivosSeleccionados + totalCreditosSeleccionados;

  const totalElement = document.getElementById('total-final');
  if (totalElement) {
    totalElement.textContent = formatCurrency(total);
  }

  actualizarCheckboxTodos();
  actualizarContadores();
}

/**
 * Marca/desmarca conceptos visibles según "Seleccionar Todo".
 * @returns {void}
 */
export function toggleTodos() {
  const checkboxTodos = document.getElementById('checkbox-todos');
  const filasVisibles = document.querySelectorAll('tbody tr[data-tipo]:not([style*="display: none"])');

  filasVisibles.forEach((fila) => {
    const checkbox = fila.querySelector('.deudas__checkbox');
    if (checkbox && !checkbox.disabled) {
      checkbox.checked = checkboxTodos.checked;
    }
  });

  actualizarTotal();
}

// ---------------------------------------------------------------------------
// Recopilación de datos para ticket/pago
// ---------------------------------------------------------------------------

/**
 * Extrae el texto del detalle sin iconos iniciales ni sufijos auxiliares.
 * @param {HTMLElement} celda - Celda de detalle de la tabla.
 * @returns {string}
 */
export function extraerTextoDetalle(celda) {
  if (!celda) return '';
  const textoCompleto = celda.textContent.trim();
  return textoCompleto.replace(/^[^\w\s]+\s*/, '').split(' - ')[0].trim();
}

/**
 * Recopila conceptos seleccionados y los ordena por ID_BIEN asc, fecha desc.
 * @returns {Array<Object>}
 */
export function recopilarConceptosSeleccionados() {
  const checkboxes = obtenerCheckboxesConceptosMarcados();
  const conceptos = [];

  checkboxes.forEach((checkbox) => {
    const fila = checkbox.closest('tr');
    if (!isRowVisible(fila)) return;

    const celdas = fila.querySelectorAll('td');
    const concepto = {
      fechaVto: celdas[1]?.textContent.trim() || '',
      detalle: extraerTextoDetalle(celdas[2]),
      idBien: celdas[3]?.textContent.trim() || '-',
      cuota: celdas[4]?.textContent.trim() || '',
      anio: celdas[5]?.textContent.trim() || '',
      importe: extraerNumero(celdas[6]?.textContent || '0'),
      interes: extraerNumeroConSigno(celdas[7]),
      total: parseFloat(checkbox.dataset.total || '0')
    };

    conceptos.push(concepto);
  });

  conceptos.sort((a, b) => {
    const idBienA = (a.idBien || '').toString();
    const idBienB = (b.idBien || '').toString();
    const idBienComparacion = idBienA.localeCompare(idBienB);
    if (idBienComparacion !== 0) return idBienComparacion;

    const fechaA = parsearFechaParaOrden(a.fechaVto);
    const fechaB = parsearFechaParaOrden(b.fechaVto);
    return fechaB - fechaA;
  });

  return conceptos;
}

/**
 * Recopila IDs de transacción seleccionados para pago.
 * @returns {number[]}
 */
export function recopilarIdTransSeleccionados() {
  const checkboxes = document.querySelectorAll('.deudas__checkbox[data-idtrans]:checked');
  const ids = [];

  checkboxes.forEach((checkbox) => {
    const fila = checkbox.closest('tr');
    if (!isRowVisible(fila)) return;

    const idTrans = parseInt(checkbox.dataset.idtrans, 10);
    if (idTrans) {
      ids.push(idTrans);
    }
  });

  return ids;
}

/**
 * Recopila créditos a favor visibles para enviar en payload de pago.
 * @returns {Array<{id:number, descripcion:string, monto:number}>}
 */
export function recopilarCreditosFavorVisibles() {
  const filas = document.querySelectorAll('tbody tr[data-total-deuda]:not([style*="display: none"])');
  const creditos = [];

  filas.forEach((fila) => {
    const totalFila = parseFloat(fila.getAttribute('data-total-deuda') || '0');
    if (totalFila >= 0) return;

    const idTrans = parseInt(fila.getAttribute('data-idtrans') || '0', 10);
    if (!idTrans) return;

    const celdas = fila.querySelectorAll('td');
    creditos.push({
      id: idTrans,
      descripcion: (celdas[2]?.textContent || '').trim(),
      monto: totalFila
    });
  });

  return creditos;
}

/**
 * Recopila conceptos seleccionados normalizados para iniciar pago.
 * @returns {Array<{id:number, descripcion:string, monto:number}>}
 */
export function recopilarConceptosParaPago() {
  const checkboxes = document.querySelectorAll('.deudas__checkbox[data-idtrans]:checked');
  const conceptos = [];

  checkboxes.forEach((checkbox) => {
    const fila = checkbox.closest('tr');
    if (!isRowVisible(fila)) return;

    const celdas = fila.querySelectorAll('td');
    const idTrans = parseInt(checkbox.dataset.idtrans, 10);
    const total = parseFloat(checkbox.dataset.total || '0');

    const detalleCell = celdas[2];
    const descripcion = detalleCell ? detalleCell.textContent.trim() : 'Concepto';
    conceptos.push({ id: idTrans, descripcion, monto: total });
  });

  return conceptos;
}
