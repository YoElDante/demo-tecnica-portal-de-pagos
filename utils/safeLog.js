/**
 * Portal de Pagos Municipal — Sanitización de Logs
 * @description Redacta campos sensibles en logs de producción; pasa datos completos en desarrollo.
 *
 * Key Variables:
 *   IS_PRODUCTION — Activa la redacción solo en entornos productivos.
 *
 * Exports:
 *   safeLog(obj) — Retorna copia del objeto con campos sensibles redactados.
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function redactarUltimos(valor, visibles = 4) {
  const texto = String(valor ?? '');
  if (texto.length <= visibles) {
    return '*'.repeat(texto.length || 3);
  }
  return '*'.repeat(texto.length - visibles) + texto.slice(-visibles);
}

function redactarEmail(valor) {
  const email = String(valor || '').trim();
  if (!email || !email.includes('@')) {
    return email ? '***@***' : '';
  }

  const [local, dominio] = email.split('@');
  const localRedactado = local.length > 1 ? `${local[0]}***` : '***';
  return `${localRedactado}@***`;
}

function redactarTicket(valor) {
  const texto = String(valor || '');
  if (texto.length <= 3) {
    return '*'.repeat(texto.length || 3);
  }
  return `${texto.slice(0, 3)}***`;
}

const REGLAS_REDACT = [
  {
    match: (key) => /dni|documento|document/i.test(key),
    redactar: (val) => redactarUltimos(val, 4)
  },
  {
    match: (key) => /email|correo|mail/i.test(key),
    redactar: redactarEmail
  },
  {
    match: (key) => /id_operacion|nro_operacion|idoperacion|nrooperacion|payment_id|paymentId|transaction[_-]?id|transaction[_-]?amount/i.test(key),
    redactar: (val) => redactarUltimos(val, 4)
  },
  {
    match: (key) => /external[_-]?reference|externalreference|external[_-]?ref/i.test(key),
    redactar: (val) => redactarUltimos(val, 4)
  },
  {
    match: (key) => /importe|monto|amount|total|monto_total|montoTotal/i.test(key),
    redactar: () => '***'
  },
  {
    match: (key) => /ticket[_-]?number|ticketnumber|ticket[_-]?id|ticketid/i.test(key),
    redactar: redactarTicket
  }
];

function aplicarRegla(key, value) {
  if (value === null || value === undefined) {
    return value;
  }

  const regla = REGLAS_REDACT.find((r) => r.match(key));
  return regla ? regla.redactar(value) : value;
}

function sanitizar(obj, seen = new WeakSet()) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (seen.has(obj)) {
    return '[Circular]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    const resultado = obj.map((item) => sanitizar(item, seen));
    seen.delete(obj);
    return resultado;
  }

  const resultado = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      resultado[key] = sanitizar(value, seen);
    } else {
      resultado[key] = aplicarRegla(key, value);
    }
  }

  seen.delete(obj);
  return resultado;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
function safeLog(obj) {
  if (!IS_PRODUCTION) {
    return obj;
  }

  return sanitizar(obj);
}

module.exports = { safeLog };
