/**
 * Portal de Pagos Municipal — Utils / Date
 * @description Parseo de fechas locales argentinas (dd/mm/yyyy) para ordenamiento.
 *
 * Key Variables: None
 *
 * Exports:
 *   parsearFechaParaOrden(fechaStr) — convierte dd/mm/yyyy → Date.
 */

// ---------------------------------------------------------------------------
// Parseo de fechas
// ---------------------------------------------------------------------------

/**
 * Convierte una fecha en formato dd/mm/yyyy a objeto Date para comparación.
 * @param {string} fechaStr - Fecha en formato dd/mm/yyyy
 * @returns {Date} Objeto Date; new Date(0) si la entrada está vacía
 */
export function parsearFechaParaOrden(fechaStr) {
  if (!fechaStr) return new Date(0);
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    // dd/mm/yyyy -> yyyy-mm-dd
    return new Date(partes[2], partes[1] - 1, partes[0]);
  }
  return new Date(fechaStr);
}
