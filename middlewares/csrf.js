/**
 * Portal de Pagos Municipal — Protección CSRF
 * @description Configura double-submit cookie CSRF con exenciones para GET y polling de tickets.
 *
 * Key Variables:
 *   IS_PRODUCTION — Ajusta defaults de seguridad de la cookie CSRF.
 *   SECURITY_CSRF_ENABLED — Feature flag para habilitar/deshabilitar la protección en caliente.
 *   CSRF_EXEMPT_PATHS — Rutas que no requieren validación de token.
 *
 * Exports:
 *   csrfProtection — Middleware de Express con validación condicional y token en res.locals.
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const { doubleCsrf } = require('csrf-csrf');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// Secreto dedicado exclusivamente a CSRF; no reutilizar con cookie ni webhook secrets.
const CSRF_SECRET = process.env.CSRF_SECRET || '';

if (IS_PRODUCTION && !CSRF_SECRET) {
  throw new Error('CSRF_SECRET env var is required in production');
}

// Si la var no está definida, se activa automáticamente en producción; en dev queda desactivado por defecto.
const SECURITY_CSRF_ENABLED = process.env.SECURITY_CSRF_ENABLED === 'true'
  || (process.env.SECURITY_CSRF_ENABLED === undefined && IS_PRODUCTION);

// En entornos no-productivos se exime por defecto salvo que se fuerce explícitamente con 'false'.
const SECURITY_CSRF_DEMO_EXEMPT = process.env.SECURITY_CSRF_DEMO_EXEMPT === 'true'
  || (!IS_PRODUCTION && process.env.SECURITY_CSRF_DEMO_EXEMPT !== 'false');

const EXEMPT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = ['/api/tickets/estado'];

const DEMO_PATHS_PREFIXES = (process.env.CSRF_DEMO_EXEMPT_PATHS || '/demo/').split(',').map((p) => p.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
// CSRF Setup
// ---------------------------------------------------------------------------
const {
  invalidCsrfTokenError,
  generateToken,
  validateRequest,
  doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PRODUCTION,
    path: '/'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    // Prioriza header usado por fetch() y luego body/form para EJS.
    if (req.headers['csrf-token']) {
      return req.headers['csrf-token'];
    }

    if (req.body && typeof req.body === 'object') {
      return req.body._csrf || req.body.csrfToken;
    }

    return req.query?._csrf;
  }
});

function isExemptPath(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }

  const normalized = path.split('?')[0];

  if (EXEMPT_PATHS.some((exempt) => normalized === exempt || normalized.startsWith(`${exempt}/`))) {
    return true;
  }

  if (SECURITY_CSRF_DEMO_EXEMPT && DEMO_PATHS_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
/**
 * Middleware de protección CSRF para Express.
 * Inyecta el token en res.locals.csrfToken para vistas EJS y fetch().
 * Valida el token en métodos mutantes (POST, PUT, DELETE, PATCH) salvo rutas exentas.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function csrfProtection(req, res, next) {
  // El token se inyecta siempre para que las vistas puedan usarlo incluso en GETs.
  // Si generateToken falla (ej. cookie corrupta), se pone '' y se continúa; la
  // validación posterior rechazará el request mutante si el token es inválido.
  try {
    res.locals.csrfToken = generateToken(req, res);
  } catch {
    res.locals.csrfToken = '';
  }

  if (!SECURITY_CSRF_ENABLED) {
    return next();
  }

  if (EXEMPT_METHODS.has(req.method) || isExemptPath(req.path)) {
    return next();
  }

  // Si hay body _csrf, validar contra él; de lo contrario delegar a doubleCsrf.
  try {
    const isValid = validateRequest(req);
    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: 'Token CSRF inválido o ausente'
      });
    }
    return next();
  } catch (error) {
    if (error === invalidCsrfTokenError || error?.message?.includes('CSRF')) {
      return res.status(403).json({
        success: false,
        message: 'Token CSRF inválido o ausente'
      });
    }
    return next(error);
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  csrfProtection,
  generateToken,
  validateRequest,
  invalidCsrfTokenError,
  doubleCsrfProtection,
  SECURITY_CSRF_ENABLED
};
