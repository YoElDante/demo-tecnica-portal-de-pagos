/**
 * Servicio de generación de tickets de pago
 * Procesa los conceptos seleccionados y prepara los datos para el partial
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 */

const municipalidadConfig = require('../config/municipalidad.config');

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
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }
    // Otros formatos de string: devolver como está
    return fecha.trim() || '-';
  }

  // Si es un objeto Date
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Obtiene la fecha y hora actual formateada
 * @returns {string} Fecha y hora actual
 */
function obtenerFechaEmision() {
  const ahora = new Date();
  return ahora.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Procesa los conceptos seleccionados para el ticket
 * @param {Array} conceptos - Array de conceptos seleccionados
 * @returns {Array} Conceptos procesados y formateados
 */
function procesarConceptos(conceptos) {
  return conceptos.map(concepto => {
    const interes = parseFloat(concepto.interes || concepto.Interes || 0);
    const importe = parseFloat(concepto.importe || concepto.Importe || 0);
    const total = parseFloat(concepto.total || concepto.Total || 0);

    return {
      fechaVto: formatearFecha(concepto.fechaVto || concepto.FechaVto),
      tipoDescripcion: concepto.tipoDescripcion || concepto.TipoDescripcion || 'Concepto',
      detalle: concepto.detalle || concepto.Detalle || '',
      cuota: concepto.cuota || concepto.Cuota || '-',
      anio: concepto.anio || concepto.Anio || '-',
      importe: formatearMoneda(importe),
      importeNumerico: importe, // Para cálculos
      interes: formatearMoneda(Math.abs(interes)),
      interesNumerico: interes, // Para cálculos (con signo)
      interesClase: interes >= 0 ? 'interes-negativo' : 'descuento-positivo',
      total: formatearMoneda(total),
      totalNumerico: total // Para cálculos
    };
  });
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

  // Procesar conceptos
  const conceptosProcesados = procesarConceptos(conceptos);
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
  formatearMoneda,
  formatearFecha,
  obtenerFechaEmision
};
