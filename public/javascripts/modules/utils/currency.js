/**
 * Portal de Pagos Municipal — Utils / Currency
 * @description Conversión entre texto con formato monetario argentino y números.
 *
 * Key Variables:
 *   DEFAULT_LOCALE — Locale usado por formatCurrency (es-AR).
 *
 * Exports:
 *   extraerNumero(texto) — convierte "$ 1.234,56" → 1234.56.
 *   extraerNumeroConSigno(celda) — extrae número de una celda HTML respetando descuento.
 *   formatCurrency(amount, locale) — formatea número a string monetario argentino.
 */
const DEFAULT_LOCALE = 'es-AR';

// ---------------------------------------------------------------------------
// Conversión de moneda
// ---------------------------------------------------------------------------

/**
 * Extrae un número de un texto con formato de moneda argentina.
 * Reconoce signos negativos al inicio o junto al símbolo ($ -123,45 / -$ 123,45).
 * @param {string} texto - Texto con formato "$ 1.234,56"
 * @returns {number} Número extraído; 0 si el texto está vacío o no es parseable.
 */
export function extraerNumero(texto) {
  if (!texto) return 0;
  const limpio = texto.trim();
  const esNegativo = /^-\s*\$/.test(limpio) ||
    /^-\s*\d/.test(limpio) ||
    limpio.includes('-$');
  const normalizado = limpio
    .replace(/[^\d,]/g, '')
    .replace(/,/g, '.');
  const valor = parseFloat(normalizado) || 0;
  return esNegativo ? -valor : valor;
}

/**
 * Extrae un número considerando si es negativo por clase CSS o signo visible.
 * @param {HTMLElement} celda - Celda de la tabla
 * @returns {number} Número con signo correcto
 */
export function extraerNumeroConSigno(celda) {
  if (!celda) return 0;
  const valor = extraerNumero(celda.textContent);
  const esDescuento = celda.classList.contains('deudas__value--discount') ||
    celda.textContent.includes('-$');
  return esDescuento ? -valor : valor;
}

/**
 * Formatea un número como moneda argentina.
 * @param {number} amount - Monto a formatear
 * @param {string} [locale='es-AR'] - Locale para el formateo
 * @returns {string} Texto formateado (ej. "$ 1.234,56")
 */
export function formatCurrency(amount, locale = DEFAULT_LOCALE) {
  const negativo = amount < 0;
  const absoluto = negativo ? -amount : amount;
  const formateado = absoluto.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return negativo ? `-$ ${formateado}` : `$ ${formateado}`;
}
