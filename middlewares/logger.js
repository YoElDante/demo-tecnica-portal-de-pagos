/**
 * Logger unificado de aplicación.
 * - Niveles configurables por LOG_LEVEL
 * - Salida con timestamp y metadata
 * - Captura global de console.* para unificar formato
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const DEFAULT_LEVEL = IS_PRODUCTION ? 'info' : 'trace';
const LOG_LEVEL = (process.env.LOG_LEVEL || DEFAULT_LEVEL).toLowerCase();

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

const CURRENT_LEVEL = LEVELS[LOG_LEVEL] ?? LEVELS[DEFAULT_LEVEL];
const originalConsole = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: (console.info || console.log).bind(console),
  log: console.log.bind(console),
  debug: (console.debug || console.log).bind(console)
};

let consolePatched = false;
let requestCounter = 0;

function shouldLog(level) {
  return (LEVELS[level] ?? LEVELS.info) <= CURRENT_LEVEL;
}

function safeStringify(value) {
  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (key, current) => {
      if (typeof current === 'object' && current !== null) {
        if (seen.has(current)) {
          return '[Circular]';
        }
        seen.add(current);
      }
      if (current instanceof Error) {
        return {
          name: current.name,
          message: current.message,
          stack: current.stack
        };
      }
      return current;
    });
  } catch {
    return '[Unserializable metadata]';
  }
}

function formatParts(args) {
  if (!Array.isArray(args) || args.length === 0) {
    return { message: '', metadata: null };
  }

  const [first, ...rest] = args;
  const message = typeof first === 'string' ? first : safeStringify(first);
  const metadata = rest.length > 0 ? rest : null;

  return { message, metadata };
}

function writeLog(level, message, metadata) {
  if (!shouldLog(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const levelTag = level.toUpperCase().padEnd(5, ' ');
  let line = `[${timestamp}] [${levelTag}] ${message}`;

  if (metadata !== null && metadata !== undefined) {
    if (Array.isArray(metadata) && metadata.length === 1) {
      line += ` | ${safeStringify(metadata[0])}`;
    } else {
      line += ` | ${safeStringify(metadata)}`;
    }
  }

  const writer = level === 'error'
    ? originalConsole.error
    : level === 'warn'
      ? originalConsole.warn
      : level === 'debug' || level === 'trace'
        ? originalConsole.debug
        : originalConsole.log;

  writer(line);
}

function log(level, message, metadata) {
  writeLog(level, message, metadata);
}

function setupConsoleCapture() {
  if (consolePatched) {
    return;
  }

  consolePatched = true;

  console.error = (...args) => {
    const { message, metadata } = formatParts(args);
    writeLog('error', message, metadata);
  };

  console.warn = (...args) => {
    const { message, metadata } = formatParts(args);
    writeLog('warn', message, metadata);
  };

  console.info = (...args) => {
    const { message, metadata } = formatParts(args);
    writeLog('info', message, metadata);
  };

  console.log = (...args) => {
    const { message, metadata } = formatParts(args);
    writeLog('info', message, metadata);
  };

  console.debug = (...args) => {
    const { message, metadata } = formatParts(args);
    writeLog('debug', message, metadata);
  };
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.ip
    || req.connection?.remoteAddress
    || null;
}

setupConsoleCapture();

exports.requestLogger = (req, res, next) => {
  req.startTime = process.hrtime.bigint();
  req.requestId = req.requestId || `req-${Date.now()}-${++requestCounter}`;

  log('debug', `📥 ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    referer: req.headers.referer || null
  });

  next();
};

exports.responseLogger = (req, res, next) => {
  res.on('finish', () => {
    const startTime = req.startTime || process.hrtime.bigint();
    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Number(durationNs) / 1_000_000;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    log(level, `📤 ${req.method} ${req.originalUrl} -> ${statusCode}`, {
      requestId: req.requestId,
      duration_ms: Number(durationMs.toFixed(2)),
      contentLength: res.getHeader('content-length') || null
    });
  });

  next();
};

exports.errorLogger = (err, req, _res, next) => {
  log('error', `🔥 Error en ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    code: err.code || null,
    statusCode: err.statusCode || err.status || 500,
    message: err.message,
    stack: !IS_PRODUCTION || shouldLog('debug') ? err.stack : undefined
  });

  next(err);
};

exports.log = log;
exports.setupConsoleCapture = setupConsoleCapture;
exports.shouldLog = shouldLog;
exports.IS_PRODUCTION = IS_PRODUCTION;
exports.LOG_LEVEL = LOG_LEVEL;
