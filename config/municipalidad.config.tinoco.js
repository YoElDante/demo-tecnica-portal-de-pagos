/**
 * Configuración de datos de la Municipalidad de Tinoco
 * 
 * IMPORTANTE: Este archivo contiene los datos específicos de cada municipalidad.
 * Modifique estos valores según corresponda a su jurisdicción.
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2026-01-31
 * @migrated-from portal-tinoco
 */

module.exports = {
  // Nombre completo de la municipalidad
  nombre: 'Tinoco',
  nombreCompleto: 'Comuna de Tinoco',

  // Datos de contacto y ubicación
  direccion: 'Calle Pública 6 s/n',
  localidad: 'Tinoco',
  provincia: 'Córdoba',
  codigoPostal: 'X5131',
  telefono: '+54 (3525) 305210',

  // Rutas de imágenes/logos (relativas a /public)
  // Estándar: {municipio}-logo-web, {municipio}-logo-ticket, {municipio}-favicon
  logos: {
    web: '/images/tinoco/tinoco-logo-web.webp',
    ticket: '/images/tinoco/tinoco-logo-web.webp',  // Usa logo-web (crear tinoco-logo-ticket.webp si se necesita uno diferente)
    favicon: '/images/tinoco/tinoco-favicon.ico'
  },

  // Configuración de tickets de pago
  ticket: {
    // Cantidad máxima de conceptos por página (formato A4)
    conceptosPorPagina: 30,

    // Mensaje de validez del ticket
    mensajeValidez: 'Este ticket de pago tiene validez hasta las 23:59 hs del día de su emisión.',

    // Encabezado adicional (opcional)
    encabezado: 'Sistema de Pago Online',

    // Pie de página (opcional)
    piePagina: 'Conserve este comprobante hasta completar su pago'
  },

  // Información adicional
  web: 'https://www.instagram.com/comunadetinoco.ok',
  email: 'comunadetinoco@outlook.com',

  // Configuración de negocio (respaldo si no hay variable de entorno)
  tasaInteresAnual: 40  // Porcentaje anual para cálculo de mora
};
