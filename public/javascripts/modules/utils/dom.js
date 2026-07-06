/**
 * Portal de Pagos Municipal — Utils / DOM
 * @description Helpers pequeños para consultar el DOM y manipular scroll.
 *
 * Key Variables: None
 *
 * Exports:
 *   getCsrfToken() — lee el token CSRF del input oculto.
 *   isRowVisible(row) — indica si una fila está visible.
 *   scrollToElement(selector, block) — scroll suave hacia un selector.
 */

// ---------------------------------------------------------------------------
// Helpers del DOM
// ---------------------------------------------------------------------------

/**
 * Lee el token CSRF del input oculto renderizado por el servidor.
 * @returns {string} Token CSRF o cadena vacía si no existe.
 */
export function getCsrfToken() {
  const input = document.querySelector('input[name="_csrf"]');
  return input ? input.value : '';
}

/**
 * Indica si una fila de tabla está visible.
 * @param {HTMLElement} row - Fila de tabla (<tr>)
 * @returns {boolean} true si la fila no está oculta.
 */
export function isRowVisible(row) {
  return row && row.style.display !== 'none';
}

/**
 * Hace scroll suave al primer elemento que coincida con el selector.
 * @param {string} selector - Selector CSS del elemento destino.
 * @param {string} [block='start'] - Alineación vertical para scrollIntoView.
 * @returns {void}
 */
export function scrollToElement(selector, block = 'start') {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block });
  }
}
