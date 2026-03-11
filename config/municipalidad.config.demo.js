/**
 * Configuración de datos de la Municipalidad - DEMO/PLANTILLA
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ARCHIVO PLANTILLA PARA NUEVOS MUNICIPIOS                   ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Este archivo sirve como:                                    ║
 * ║  1. Entorno de pruebas/demo del portal                      ║
 * ║  2. Plantilla para crear nuevos municipios                  ║
 * ║                                                              ║
 * ║  PASOS PARA AGREGAR UN NUEVO MUNICIPIO:                     ║
 * ║  1. Copiar este archivo como:                               ║
 * ║     municipalidad.config.{nuevomunicipio}.js                ║
 * ║  2. Completar todos los campos con los datos reales         ║
 * ║  3. Agregar '{nuevomunicipio}' al array en config/index.js  ║
 * ║  4. Crear carpeta public/images/{nuevomunicipio}/           ║
 * ║  5. Subir los logos del municipio a esa carpeta             ║
 * ║  6. Crear envs/.env.{nuevomunicipio} con credenciales BD    ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * @author Dante Marcos Delprato
 * @version 1.0
 * @date 2026-03-11
 */

module.exports = {
  // ============================================
  // IDENTIFICACIÓN DEL MUNICIPIO
  // ============================================

  // Nombre corto (se muestra en títulos)
  nombre: 'Demo',

  // Nombre completo oficial
  nombreCompleto: 'Municipio de Demostración',

  // ============================================
  // DATOS DE CONTACTO Y UBICACIÓN
  // ============================================

  // Dirección física de la municipalidad
  direccion: 'Av. Principal 123',

  // Localidad/Ciudad
  localidad: 'Ciudad Demo',

  // Provincia
  provincia: 'Córdoba',

  // Código postal
  codigoPostal: 'X5000',

  // Teléfono de contacto
  telefono: '+54 (351) 000-0000',

  // ============================================
  // IMÁGENES Y LOGOS
  // Rutas relativas a /public
  // Estándar: {municipio}-logo-web, {municipio}-logo-ticket, {municipio}-favicon
  // ============================================
  logos: {
    // Logo principal (encabezado del portal)
    // Para personalizar: crear demo-logo-web.webp en /images/demo/
    web: '/images/common/alcaldiaLogo.webp',

    // Logo para tickets/PDF de deuda
    // Para personalizar: crear demo-logo-ticket.webp en /images/demo/
    ticket: '/images/common/alcaldiaLogo.webp',

    // Favicon (pestaña del navegador)
    // Para personalizar: crear demo-favicon.ico en /images/demo/
    favicon: '/images/common/default-favicon.svg'
  },

  // ============================================
  // CONFIGURACIÓN DE TICKETS DE PAGO
  // ============================================
  ticket: {
    // Cantidad máxima de conceptos por página (formato A4)
    // Ajustar según diseño del ticket
    conceptosPorPagina: 30,

    // Mensaje de validez que aparece en el ticket
    mensajeValidez: 'Este ticket de pago tiene validez hasta las 23:59 hs del día de su emisión.',

    // Texto del encabezado del ticket
    encabezado: 'Sistema de Pago Online',

    // Texto del pie de página del ticket
    piePagina: 'Conserve este comprobante hasta completar su pago'
  },

  // ============================================
  // INFORMACIÓN ADICIONAL
  // ============================================

  // Sitio web oficial del municipio
  web: 'https://ejemplo.gob.ar/',

  // Email de contacto
  email: 'info@ejemplo.gob.ar',

  // ============================================
  // CONFIGURACIÓN DE NEGOCIO
  // Respaldo si no hay variable de entorno
  // ============================================

  // Tasa de interés anual para cálculo de mora (%)
  // Este valor se usa SOLO si no está definido TASA_INTERES_ANUAL en .env
  tasaInteresAnual: 40
};
