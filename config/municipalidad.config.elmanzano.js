/**
 * Configuración de datos de la Municipalidad
 * 
 * IMPORTANTE: Este archivo contiene los datos específicos de cada municipalidad.
 * Modifique estos valores según corresponda a su jurisdicción.
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 */

module.exports = {
  // Nombre completo de la municipalidad
  nombre: 'El Manzano',
  nombreCompleto: 'Comuna de El Manzano',

  // Datos de contacto y ubicación
  direccion: 'Av. J.D. Perón 571',
  localidad: 'El Manzano',
  provincia: 'Córdoba',
  codigoPostal: 'X5107',
  telefono: '+54 (3525) 493225',

  // Contacto WhatsApp (canal opcional por municipio)
  contactoWhatsapp: {
    habilitarBoton: true,
    telefono: '+54 (3543) 304251',
    textoBoton: 'Contactanos',
    mensajeInicial: 'Hola, necesito ayuda con el portal de pagos de El Manzano.'
  },

  // Rutas de imágenes/logos (relativas a /public)
  // Estándar: {municipio}-logo-web, {municipio}-logo-ticket, {municipio}-favicon
  logos: {
    web: '/images/elmanzano/elmanzano-logo-web.webp',
    ticket: '/images/elmanzano/elmanzano-logo-web.webp',  // Usa logo-web (crear elmanzano-logo-ticket.webp si se necesita uno diferente)
    favicon: '/images/elmanzano/elmanzano-favicon.ico'
  },

  // Configuración de tickets de pago
  ticket: {
    // Cantidad máxima de conceptos por página (formato A4)
    conceptosPorPagina: 30, // Aumentado para que entren más filas por hoja

    // Mensaje de validez del ticket
    mensajeValidez: 'Este ticket de pago tiene validez hasta las 23:59 hs del día de su emisión.',

    // Encabezado adicional (opcional)
    encabezado: 'Sistema de Pago Online',

    // Pie de página (opcional)
    piePagina: 'Conserve este comprobante hasta completar su pago'
  },

  // Información adicional
  web: 'https://elmanzano.gob.ar/',
  email: 'Info@elmanzano.gob.ar',

  // Configuración de negocio (respaldo si no hay variable de entorno)
  tasaInteresAnual: 40  // Porcentaje anual para cálculo de mora
};
