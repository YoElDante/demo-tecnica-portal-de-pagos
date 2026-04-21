/**
 * Servicio de generación de tickets de pago
 * Procesa los conceptos seleccionados y prepara los datos para el partial
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 */

// Configuración centralizada - cambiar municipio en .env (MUNICIPIO=xxx)
const { municipalidad: municipalidadConfig } = require('../config');
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Argentina/Cordoba';

function obtenerPrimerValor(...valores) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      return valor;
    }
  }

  return null;
}

function obtenerNumeroSeguro(...valores) {
  for (const valor of valores) {
    if (valor === undefined || valor === null || valor === '') {
      continue;
    }

    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      return numero;
    }
  }

  return 0;
}

function formatearPeriodo(concepto) {
  const cuota = obtenerPrimerValor(concepto.cuota, concepto.Cuota, concepto.NRO_CUOTA, concepto.CuotaPlan);
  const anio = obtenerPrimerValor(concepto.anio, concepto.Anio, concepto.ANO_CUOTA);

  if (cuota && anio) {
    return `${cuota}/${anio}`;
  }

  const fechaBase = obtenerPrimerValor(concepto.fecha, concepto.Fecha, concepto.fechaVto, concepto.FechaVto);
  if (!fechaBase) {
    return '-';
  }

  const fecha = new Date(fechaBase);
  if (Number.isNaN(fecha.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIMEZONE,
    month: '2-digit',
    year: 'numeric'
  }).format(fecha);
}

// ============================================
// GENERACIÓN DE NÚMERO DE TICKET
// ============================================

/**
 * Argentina no usa horario de verano: siempre UTC-3.
 * Usamos este offset para derivar la fecha local argentina a partir de UTC.
 */
const ARGENTINA_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Retorna la fecha argentina actual como string 'YYYYMMDD'.
 * Se usa como prefijo de fecha en el número de ticket.
 * @returns {string} Fecha local argentina, ej: '20260413'
 */
function obtenerFechaArgentina() {
  const argNow = new Date(Date.now() - ARGENTINA_OFFSET_MS);
  const y = argNow.getUTCFullYear();
  const m = String(argNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(argNow.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Dado un string 'YYYYMMDD' (fecha Argentina), devuelve los límites UTC
 * del día completo en Argentina (medianoche a medianoche argentina = 03:00 a 02:59 UTC).
 * @param {string} fechaStr - Fecha Argentina 'YYYYMMDD'
 * @returns {{ inicioUTC: Date, finUTC: Date }}
 */
function obtenerRangoUTCDelDia(fechaStr) {
  const y = fechaStr.slice(0, 4);
  const m = fechaStr.slice(4, 6);
  const d = fechaStr.slice(6, 8);
  return {
    inicioUTC: new Date(`${y}-${m}-${d}T00:00:00.000-03:00`),
    finUTC: new Date(`${y}-${m}-${d}T23:59:59.999-03:00`)
  };
}

/**
 * Cuenta cuántos tickets existen hoy (día Argentina) para el municipio dado.
 * La consulta usa el campo issued_at_utc para filtrar por rango UTC del día.
 * @param {string} municipioId - Ej: 'ELMANZANO'
 * @param {string} fechaStr    - Fecha Argentina 'YYYYMMDD'
 * @returns {Promise<number>}
 */
async function contarTicketsHoy(municipioId, fechaStr) {
  const { TicketsPago } = require('../models/model.index');
  const { Op } = require('sequelize');
  const { inicioUTC, finUTC } = obtenerRangoUTCDelDia(fechaStr);
  return TicketsPago.count({
    where: {
      municipioId,
      issuedAtUtc: { [Op.between]: [inicioUTC, finUTC] }
    }
  });
}

/**
 * Genera el próximo número de ticket para el municipio.
 *
 * Formato: {MUNICIPIO_ID}-{YYYYMMDD}-{NNNNN}
 * Ejemplo: ELMANZANO-20260413-00001
 *
 * El secuencial se obtiene contando tickets del día actual y sumando 1.
 * En caso de colisión por concurrencia, el llamador debe reintentar.
 *
 * @param {string} municipioId - ID del municipio en mayúsculas (ej: 'ELMANZANO')
 * @returns {Promise<{ ticketNumber: string, fechaStr: string }>}
 */
async function generarNumeroTicket(municipioId) {
  const fechaStr = obtenerFechaArgentina();
  const count = await contarTicketsHoy(municipioId, fechaStr);
  const seq = String(count + 1).padStart(5, '0');
  const ticketNumber = `${municipioId.toUpperCase()}-${fechaStr}-${seq}`;
  return { ticketNumber, fechaStr };
}

function formatearFechaConZona(date) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/**
 * Formatea un número como moneda argentina
 * @param {number} valor - Valor numérico a formatear
 * @returns {string} Valor formateado como moneda
 */
function formatearMoneda(valor) {
  return parseFloat(valor || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formatea una fecha en formato DD/MM/YYYY
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return '-';

  // Si ya es un string con formato dd/mm/yyyy, devolverlo tal cual
  if (typeof fecha === 'string') {
    // Detectar si viene en formato dd/mm/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha.trim())) {
      return fecha.trim();
    }
    // Detectar si viene en formato ISO o similar (yyyy-mm-dd)
    if (/^\d{4}-\d{2}-\d{2}/.test(fecha.trim())) {
      // Si la fecha viene sin hora (YYYY-MM-DD), construirla como fecha local
      // para evitar corrimientos por UTC al formatear en servidores cloud.
      const onlyDateMatch = fecha.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (onlyDateMatch) {
        const year = Number(onlyDateMatch[1]);
        const month = Number(onlyDateMatch[2]) - 1;
        const day = Number(onlyDateMatch[3]);
        return formatearFechaConZona(new Date(year, month, day, 12, 0, 0));
      }

      const isoDate = new Date(fecha);
      if (!isNaN(isoDate.getTime())) {
        return formatearFechaConZona(isoDate);
      }
    }
    // Otros formatos de string: devolver como está
    return fecha.trim() || '-';
  }

  // Si es un objeto Date
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '-';
  return formatearFechaConZona(date);
}

/**
 * Obtiene la fecha y hora actual formateada
 * @returns {string} Fecha y hora actual
 */
function obtenerFechaEmision() {
  const ahora = new Date();
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(ahora);
}

/**
 * Procesa los conceptos seleccionados para el ticket
 * @param {Array} conceptos - Array de conceptos seleccionados
 * @returns {Array} Conceptos procesados y formateados
 */
function procesarConceptos(conceptos) {
  // Filtrar conceptos vacíos o inválidos
  return conceptos
    .filter(concepto => {
      // Debe tener al menos un valor numérico válido
      if (!concepto) return false;
      const total = concepto.total ?? concepto.Total ?? concepto.monto ?? concepto.Monto;
      const importe = concepto.importe ?? concepto.Importe;
      // Si todos son undefined/null/0 y no hay descripción, descartar
      if (
        (!total && !importe) &&
        !(concepto.tipoDescripcion || concepto.TipoDescripcion || concepto.detalle || concepto.Detalle || concepto.descripcion)
      ) {
        return false;
      }
      // Si es un objeto vacío
      if (Object.keys(concepto).length === 0) return false;
      return true;
    })
    .map(concepto => {
      const interes = obtenerNumeroSeguro(concepto.interes, concepto.Interes);
      const importeOriginal = obtenerPrimerValor(concepto.importe, concepto.Importe);
      const totalOriginal = obtenerPrimerValor(concepto.total, concepto.Total, concepto.monto, concepto.Monto);
      const total = obtenerNumeroSeguro(totalOriginal);
      const importe = importeOriginal !== null
        ? obtenerNumeroSeguro(importeOriginal)
        : total;

      const detalle = obtenerPrimerValor(concepto.detalle, concepto.Detalle, concepto.descripcion) || '';
      const tipoDescripcion = obtenerPrimerValor(concepto.tipoDescripcion, concepto.TipoDescripcion) || 'Concepto';
      const fechaGeneracion = formatearFecha(obtenerPrimerValor(concepto.fecha, concepto.Fecha));
      const fechaVto = formatearFecha(obtenerPrimerValor(concepto.fechaVto, concepto.FechaVto));
      const periodo = formatearPeriodo(concepto);

      return {
        idTrans: obtenerPrimerValor(concepto.IdTrans, concepto.id, concepto.ID_TRANS),
        fecha: fechaGeneracion,
        fechaGeneracion,
        fechaVto,
        periodo,
        tipoDescripcion,
        detalle,
        descripcionCompleta: detalle || tipoDescripcion,
        idBien: obtenerPrimerValor(concepto.idBien, concepto.IdBien, concepto.ID_BIEN) || '-',
        cuota: obtenerPrimerValor(concepto.cuota, concepto.Cuota, concepto.NRO_CUOTA) || '-',
        anio: obtenerPrimerValor(concepto.anio, concepto.Anio, concepto.ANO_CUOTA) || '-',
        importe: formatearMoneda(importe),
        importeNumerico: importe, // Para cálculos
        // Si interés < 0 es descuento: mostrar con signo negativo
        interes: interes < 0 ? '-' + formatearMoneda(Math.abs(interes)) : formatearMoneda(interes),
        interesNumerico: interes, // Para cálculos (con signo)
        // Cargo (>= 0) = negro, Descuento (< 0) = verde
        interesClase: interes < 0 ? 'ticket__value--discount' : 'ticket__value--interest',
        total: formatearMoneda(total),
        totalNumerico: total // Para cálculos
      };
    });
}

async function reconstruirConceptosPersistidos(conceptos) {
  const conceptosBase = Array.isArray(conceptos) ? conceptos : [];
  const ids = [...new Set(
    conceptosBase
      .map((concepto) => Number(obtenerPrimerValor(concepto?.IdTrans, concepto?.id, concepto?.ID_TRANS)))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];

  let metadataPorId = new Map();

  if (ids.length > 0) {
    const deudasService = require('./deudas.service');
    const deudas = await deudasService.obtenerDeudasPorIds(ids);
    metadataPorId = new Map(deudas.map((deuda) => [Number(deuda.IdTrans), deuda]));
  }

  const conceptosEnriquecidos = conceptosBase.map((concepto) => {
    const idTrans = Number(obtenerPrimerValor(concepto?.IdTrans, concepto?.id, concepto?.ID_TRANS));
    const metadata = Number.isInteger(idTrans) ? metadataPorId.get(idTrans) : null;

    return {
      ...(metadata || {}),
      ...(concepto || {}),
      IdTrans: Number.isInteger(idTrans) ? idTrans : obtenerPrimerValor(metadata?.IdTrans, concepto?.IdTrans, concepto?.id),
      Detalle: obtenerPrimerValor(concepto?.Detalle, concepto?.detalle, concepto?.descripcion, metadata?.Detalle),
      TipoDescripcion: obtenerPrimerValor(concepto?.TipoDescripcion, concepto?.tipoDescripcion, metadata?.TipoDescripcion),
      IdBien: obtenerPrimerValor(concepto?.IdBien, concepto?.idBien, metadata?.IdBien),
      Anio: obtenerPrimerValor(concepto?.Anio, concepto?.anio, metadata?.Anio),
      Cuota: obtenerPrimerValor(concepto?.Cuota, concepto?.cuota, metadata?.Cuota),
      Fecha: obtenerPrimerValor(concepto?.Fecha, concepto?.fecha, metadata?.Fecha),
      FechaVto: obtenerPrimerValor(concepto?.FechaVto, concepto?.fechaVto, metadata?.FechaVto),
      Importe: obtenerPrimerValor(concepto?.Importe, concepto?.importe, metadata?.Importe, concepto?.monto),
      Interes: obtenerPrimerValor(concepto?.Interes, concepto?.interes, metadata?.Interes),
      Total: obtenerPrimerValor(concepto?.Total, concepto?.total, concepto?.monto, metadata?.Total)
    };
  });

  return procesarConceptos(conceptosEnriquecidos);
}

/**
 * Calcula el total general de todos los conceptos
 * @param {Array} conceptos - Array de conceptos procesados
 * @returns {string} Total general formateado
 */
function calcularTotalGeneral(conceptos) {
  const suma = conceptos.reduce((acc, concepto) => {
    return acc + parseFloat(concepto.totalNumerico || 0);
  }, 0);
  return formatearMoneda(suma);
}

/**
 * Prepara todos los datos necesarios para renderizar el ticket
 * @param {Object} params - Parámetros del ticket
 * @param {Array} params.conceptos - Conceptos seleccionados
 * @param {Object} params.contribuyente - Datos del contribuyente
 * @returns {Object} Datos completos para el partial
 */
function prepararDatosTicket({ conceptos, contribuyente }) {
  // Validaciones
  if (!conceptos || conceptos.length === 0) {
    throw new Error('No se han seleccionado conceptos para el ticket');
  }

  if (!contribuyente || !contribuyente.dni) {
    throw new Error('Datos del contribuyente incompletos');
  }

  // Log para depuración
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[Ticket] Conceptos recibidos:', JSON.stringify(conceptos, null, 2));
  }
  // Procesar conceptos
  const conceptosProcesados = procesarConceptos(conceptos);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[Ticket] Conceptos procesados:', JSON.stringify(conceptosProcesados, null, 2));
  }
  const totalGeneral = calcularTotalGeneral(conceptosProcesados);

  // Preparar datos del contribuyente
  const datosContribuyente = {
    nombreCompleto: contribuyente.nombreCompleto ||
      `${contribuyente.nombre || ''} ${contribuyente.apellido || ''}`.trim() ||
      'No especificado',
    dni: contribuyente.dni
  };

  // Retornar todos los datos necesarios para el partial
  return {
    municipalidad: municipalidadConfig,
    conceptos: conceptosProcesados,
    contribuyente: datosContribuyente,
    totalGeneral: totalGeneral,
    fechaEmision: obtenerFechaEmision(),
    // Metadatos adicionales
    metadata: {
      totalConceptos: conceptosProcesados.length,
      fechaGeneracion: new Date().toISOString()
    }
  };
}

/**
 * Valida los datos recibidos del frontend
 * @param {Object} datos - Datos a validar
 * @returns {Object} Resultado de la validación
 */
function validarDatosTicket(datos) {
  const errores = [];

  if (!datos) {
    errores.push('No se recibieron datos');
    return { valido: false, errores };
  }

  if (!datos.conceptos || !Array.isArray(datos.conceptos) || datos.conceptos.length === 0) {
    errores.push('Debe seleccionar al menos un concepto');
  }

  if (!datos.contribuyente) {
    errores.push('Faltan datos del contribuyente');
  } else {
    if (!datos.contribuyente.dni) {
      errores.push('DNI del contribuyente es requerido');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

module.exports = {
  prepararDatosTicket,
  validarDatosTicket,
  procesarConceptos,
  reconstruirConceptosPersistidos,
  formatearMoneda,
  formatearFecha,
  obtenerFechaEmision,
  // Generación de número de ticket
  generarNumeroTicket,
  obtenerFechaArgentina,
  obtenerRangoUTCDelDia
};
