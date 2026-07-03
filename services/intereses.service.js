/**
 * Motor de Cálculo de Intereses — El Manzano
 * 
 * Implementa 2 modos de fórmula del contador (Eduardo Ferreyra, 01/07/2026)
 * basados en docs/formulas/formulas_alcaldia_072026.txt.
 * 
 * Modo C (descuento por cuota única) eliminado — el contador confirmó que
 * prácticamente nada tiene descuento y la cuota única no compete al portal.
 * 
 * Este módulo es PURO: sin dependencias de BD, sin acceso a process.env.
 * Recibe toda la configuración como parámetros.
 */

/**
 * Modo A — Recálculo por Coeficiente
 * 
 * Condiciones:
 * - cuotabasica == '' (cuota común)
 * - CoeficienteCuota > 0
 * - FechaVto < fechaDesdeIntereses
 * 
 * Fórmula: Saldo * (IndiceFinal / CoeficienteCuota)
 */
function calcularInteresCoeficiente(saldo, indiceFinal, coeficienteCuota) {
  if (!saldo || saldo <= 0) return 0;
  if (!indiceFinal || !coeficienteCuota || coeficienteCuota <= 0) return 0;

  const factor = indiceFinal / coeficienteCuota;
  return Math.round(saldo * factor * 100) / 100;
}

/**
 * Modo B — Interés Simple (FA)
 * 
 * Condiciones:
 * - cuotabasica == '' (cuota común)
 * - No aplica modo coeficiente
 * - TipoMovim == "FA"
 * - dias > 0
 * 
 * Fórmula: Saldo * (tasa/365/100) * dias
 * 
 * NOTA: El factor descinmueble ya está incorporado en el Saldo
 * de la BD productiva. No se multiplica nuevamente.
 */
function calcularInteresSimpleFA(saldo, tasaInteres, dias) {
  if (!saldo || saldo <= 0) return 0;
  if (!dias || dias <= 0) return 0;
  if (!tasaInteres || tasaInteres <= 0) return 0;

  const tasaDiaria = tasaInteres / 365 / 100;
  return Math.round(saldo * tasaDiaria * dias * 100) / 100;
}

/**
 * Convierte una fecha (string YYYY-MM-DD, Date, o null) a una fecha civil
 * normalizada al mediodía para evitar desplazamientos por zona horaria.
 * Retorna null si la entrada es inválida.
 */
function parseCivilDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), 12, 0, 0);
  }
  if (typeof raw === 'string') {
    const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0);
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

/**
 * Calcula los días de mora entre una fecha de vencimiento y hoy
 */
function calcularDiasMora(fechaVto, fechaHoy = null) {
  const vto = parseCivilDate(fechaVto);
  if (!vto) return 0;

  const hoy = fechaHoy ? parseCivilDate(fechaHoy) : parseCivilDate(new Date());
  if (!hoy) return 0;

  const diff = hoy - vto;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
}

/**
 * Dispatcher principal — determina qué modo aplicar para un movimiento
 * 
 * @param {Object} mov — fila de ClientesCtaCte con campos extendidos
 * @param {Object} config — configuración de tasas e índices
 * @returns {Object} { interes, tipo, display }
 */
function calcularMovimiento(mov, config = {}) {
  const {
    tasaInteres = 0,
    tasaDescuento = 0,
    indiceFinal = null,
    fechaDesdeIntereses = null,
    fechaReferencia = null, // Para testing: fecha "hoy" de referencia
  } = config;

  const saldo = Number(mov.Saldo) || 0;
  const tipoMovim = (mov.TipoMovim || '').trim();
  const coefCuota = Number(mov.CoeficienteCuota) || 0;
  const actualizacionCobrado = mov.ACTUALIZACION_COBRADO != null ? Number(mov.ACTUALIZACION_COBRADO) : null;
  const fechaVto = mov.FechaVto || null;

  const dias = calcularDiasMora(fechaVto, fechaReferencia);
  let interes = 0;
  let tipo = 'T'; // T: tasa simple (default)
  let coefDisplay = String(tasaInteres);

  if (saldo > 0) {
    // ¿Aplica modo coeficiente (A)?
    if (coefCuota > 0 && fechaDesdeIntereses && fechaVto) {
      const fechaVtoDate = parseCivilDate(fechaVto);
      const fechaLimite = parseCivilDate(fechaDesdeIntereses);

      if (fechaVtoDate && fechaLimite) {
        if (fechaVtoDate < fechaLimite && indiceFinal != null) {
          // Modo A — Coeficiente
          interes = calcularInteresCoeficiente(saldo, indiceFinal, coefCuota);
          tipo = 'C';
          const factor = indiceFinal / coefCuota;
          coefDisplay = factor.toFixed(2);
          return { interes, tipo, dias, coef: coefDisplay, display: `${dias}C:${coefDisplay}` };
        }
      }
    }

    // Modo B — Interés Simple (FA)
    if (tipoMovim === 'FA' && dias > 0) {
      interes = calcularInteresSimpleFA(saldo, tasaInteres, dias);
    }
    // else: interes = 0 (sin cambio)
  } else {
    // Saldo <= 0: usar ACTUALIZACION_COBRADO si existe
    if (actualizacionCobrado !== null) {
      interes = actualizacionCobrado;
      return { interes, tipo: 'A', dias: 0, coef: '0', display: `${actualizacionCobrado.toFixed(2)}` };
    }
  }

  // RecIntereses: fallback del contador — si nuestros resultados no coinciden
  // con el software de escritorio, descomentar y probar esta lógica alternativa:
  // if (mov.RecIntereses && Number(mov.RecIntereses) > 0) {
  //   interes = Number(mov.RecIntereses);
  //   return { interes, tipo: 'R', dias, coef: '0', display: `${interes.toFixed(2)}` };
  // }

  return { interes, tipo, dias, coef: coefDisplay, display: `${dias}${tipo}:${coefDisplay}` };
}

module.exports = {
  parseCivilDate,
  calcularInteresCoeficiente,
  calcularInteresSimpleFA,
  calcularMovimiento,
  calcularDiasMora,
};
