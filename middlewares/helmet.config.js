/**
 * Portal de Pagos Municipal — Configuración de Helmet
 * @description Define headers de seguridad HTTP con CSP transicional y HSTS solo en producción.
 *
 * Key Variables:
 *   IS_PRODUCTION — Activa HSTS y ajusta CSP estricto según el entorno.
 *   API_GATEWAY_URL — Origen permitido en connect-src para las llamadas al gateway de pagos.
 *
 * Exports:
 *   helmetConfig — Objeto de configuración listo para usar con helmet().
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const envUrl = process.env.API_GATEWAY_URL || '';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Extrae el origen (protocolo + host) de una URL. Si no es válida, retorna null.
 */
function extraerOrigen(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

const gatewayOrigin = extraerOrigen(envUrl);

const defaultSrc = ["'self'"];
const scriptSrc = ["'self'", "'unsafe-inline'"];
const styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'];
const fontSrc = ["'self'", 'https://fonts.gstatic.com'];
const imgSrc = ["'self'", 'data:', 'blob:', 'https:'];
const connectSrc = gatewayOrigin
  ? ["'self'", gatewayOrigin]
  : ["'self'"];

if (!IS_PRODUCTION) {
  // En desarrollo local se permite conectar con orígenes comunes de hot-reload/debug.
  connectSrc.push('http://localhost:*');
}

const hstsConfig = IS_PRODUCTION
  ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: false
  }
  : false;

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  helmetConfig: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc,
        scriptSrc,
        styleSrc,
        fontSrc,
        imgSrc,
        connectSrc,
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: hstsConfig,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true
  }
};
