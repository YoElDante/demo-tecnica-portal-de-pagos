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
  telefono: '+54 (3543) 304251',

  // Rutas de imágenes/logos (relativas a /public)
  logos: {
    principal: '/images/ISOLOGOTIPO-EL_MANZANO.webp',
    secundario: '/images/alcaldiaLogo.webp',
    favicon: '../images/logo_El_Manzano.jpg'
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
  web: 'https://elmanzano.gob.ar/', // opcional
  email: 'Info@elmanzano.gob.ar' // opcional
};
