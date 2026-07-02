/**
 * Configuración de datos de la Municipalidad - CARRILOBO
 *
 * Municipalidad de Carrilobo
 * Departamento Río Segundo, Provincia de Córdoba
 *
 * @version 1.0
 */

module.exports = {
  // ============================================
  // IDENTIFICACIÓN DEL MUNICIPIO
  // ============================================

  nombre: 'Carrilobo',

  nombreCompleto: 'Municipalidad de Carrilobo',

  // ============================================
  // DATOS DE CONTACTO Y UBICACIÓN
  // ============================================

  direccion: 'COMPLETAR_DIRECCION',

  localidad: 'Carrilobo',

  provincia: 'Córdoba',

  codigoPostal: 'COMPLETAR_CP',

  telefono: 'COMPLETAR_TELEFONO',

  cuit: 'COMPLETAR_CUIT',

  intendente: 'COMPLETAR_INTENDENTE',

  // Contacto WhatsApp
  contactoWhatsapp: {
    habilitarBoton: false,
    telefono: 'COMPLETAR_TELEFONO_WA',
    textoBoton: 'Contactanos',
    mensajeInicial: 'Hola, necesito ayuda con el portal de pagos de Carrilobo.'
  },

  // ============================================
  // IMÁGENES Y LOGOS
  // ============================================
  logos: {
    web: '/images/carrilobo/carrilobo-logo-web.webp',
    ticket: '/images/carrilobo/carrilobo-logo-web.webp',
    favicon: '/images/carrilobo/carrilobo-favicon.ico'
  },

  // ============================================
  // CONFIGURACIÓN DE TICKETS DE PAGO
  // ============================================
  ticket: {
    conceptosPorPagina: 30,
    mensajeValidez: 'Este ticket de pago tiene validez hasta las 23:59 hs del día de su emisión.',
    encabezado: 'Sistema de Pago Online',
    piePagina: 'Conserve este comprobante hasta completar su pago'
  },

  // ============================================
  // INFORMACIÓN ADICIONAL
  // ============================================

  web: '',

  email: '',

  instagram: '',

  tasaInteresAnual: 40
};
