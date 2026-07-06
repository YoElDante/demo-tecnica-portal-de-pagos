/**
 * Portal de Pagos Municipal — Module / Contribuyente State
 * @description Resuelve datos del contribuyente desde inline JSON (fallback) o API segura.
 *
 * Exports:
 *   getContribuyenteDataInline()
 *   fetchContribuyenteData(codigo)
 *   initContribuyenteData()
 */

import { getCsrfToken } from '../utils/dom.js';

// ---------------------------------------------------------------------------
// Resolución de datos de contribuyente
// ---------------------------------------------------------------------------

/**
 * Lee el contribuyente embebido en JSON inline cuando existe fallback sin COOKIE_SECRET.
 * @returns {Object|null}
 */
export function getContribuyenteDataInline() {
  const inline = document.getElementById('contribuyente-data-inline');
  if (!inline) return null;

  try {
    return JSON.parse(inline.textContent || 'null');
  } catch (error) {
    console.error('Error parseando contribuyente-data-inline:', error);
    return null;
  }
}

/**
 * Obtiene datos de contribuyente desde backend con protección CSRF.
 * @param {string} codigo - Código interno del contribuyente.
 * @returns {Promise<Object|null>}
 */
export async function fetchContribuyenteData(codigo) {
  if (!codigo) return null;

  try {
    const response = await fetch(`/api/contribuyente/${codigo}`, {
      headers: {
        'CSRF-Token': getCsrfToken()
      }
    });

    if (!response.ok) {
      console.warn('No se pudieron obtener los datos del contribuyente');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error cargando datos del contribuyente:', error);
    return null;
  }
}

/**
 * Inicializa datos de contribuyente priorizando fallback inline y luego API por código.
 * @returns {Promise<Object|null>}
 */
export async function initContribuyenteData() {
  const inline = getContribuyenteDataInline();
  if (inline) return inline;

  const codigo = document.body?.dataset?.codigo;
  if (!codigo) return null;

  return fetchContribuyenteData(codigo);
}
