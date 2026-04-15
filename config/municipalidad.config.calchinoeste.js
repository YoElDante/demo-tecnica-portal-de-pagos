/**
 * Configuración de datos de la Municipalidad - CALCHÍN OESTE
 *
 * Municipalidad de Calchín Oeste
 * Departamento Río Segundo, Provincia de Córdoba
 *
 * @version 1.0
 * @date 2026-04-15
 */

module.exports = {
  // ============================================
  // IDENTIFICACIÓN DEL MUNICIPIO
  // ============================================

  nombre: 'Calchín Oeste',

  nombreCompleto: 'Municipalidad de Calchín Oeste',

  // ============================================
  // DATOS DE CONTACTO Y UBICACIÓN
  // ============================================

  direccion: 'Alfonsina Storni y Lugones s/n',

  localidad: 'Calchín Oeste',

  provincia: 'Córdoba',

  codigoPostal: 'X5965',

  telefono: '(03532) 494025 / 494031',

  cuit: '30-66937795-5',

  intendente: 'Mariano Martín Vottero',

  // Contacto WhatsApp
  contactoWhatsapp: {
    habilitarBoton: false,
    telefono: '',
    textoBoton: 'Contactanos',
    mensajeInicial: 'Hola, necesito ayuda con el portal de pagos municipales.'
  },

  // ============================================
  // IMÁGENES Y LOGOS
  // ============================================
  logos: {
    web: '/images/calchinoeste/calchin_oeste_logo.webp',
    ticket: '/images/calchinoeste/calchin_oeste_logo.webp',
    favicon: '/images/calchinoeste/calchin_oeste_favicon.ico'
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

  // Instagram oficial
  instagram: '@municalchinoeste',

  tasaInteresAnual: 40
};
