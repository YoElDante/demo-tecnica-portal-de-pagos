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
  nombre: 'San José de las Salinas',
  nombreCompleto: 'Municipalidad de San José de las Salinas',

  // Datos de contacto y ubicación
  direccion: 'Av. Gral. Paz',
  localidad: 'San José de Las Salinas',
  provincia: 'Córdoba',
  codigoPostal: 'X5216',
  telefono: '+54 (3521) 472532',

  // Rutas de imágenes/logos (relativas a /public)
  logos: {
    principal: '/images/sanjosedelassalinas.webp',
    secundario: '../public/images/alcaldiaLogo.webp',
    favicon: '/images/sanjosedelassalinas.ico'
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
  web: 'https://sanjosedelassalinas.gob.ar', // opcional
  email: 'contacto@sanjosedelassalinas.gob.ar' // opcional
};
