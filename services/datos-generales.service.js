/**
 * Servicio de DatosGenerales
 * 
 * Lee la configuración de tasas e índices desde la tabla dbo.DatosGenerales.
 * Usado como primera capa en la cadena de resolución de configuración:
 *   DatosGenerales (BD) → municipio config → process.env
 */

const { DatosGenerales } = require('../models/model.index');

/**
 * Obtiene la configuración de intereses desde la tabla DatosGenerales.
 * 
 * @returns {Promise<Object|null>} Configuración o null si falla la consulta
 */
async function obtenerConfigIntereses() {
  try {
    const row = await DatosGenerales.findOne({
      attributes: ['TasaInteres', 'TasaDescuento', 'IndiceFinal', 'FechaDesdeInt'],
      raw: true,
    });

    if (!row) return null;

    return {
      tasaInteres: row.TasaInteres != null ? Number(row.TasaInteres) : null,
      tasaDescuento: row.TasaDescuento != null ? Number(row.TasaDescuento) : null,
      indiceFinal: row.IndiceFinal != null ? Number(row.IndiceFinal) : null,
      fechaDesdeIntereses: row.FechaDesdeInt || null,
    };
  } catch (err) {
    console.warn('[datos-generales.service] No se pudo leer DatosGenerales:', err.message);
    return null;
  }
}

module.exports = { obtenerConfigIntereses };
