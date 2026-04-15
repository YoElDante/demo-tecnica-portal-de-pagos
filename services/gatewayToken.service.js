const jwt = require('jsonwebtoken');

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Argentina/Cordoba';

function formatearFechaEnZona(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function obtenerSecretBase() {
  return process.env.GATEWAY_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
}

function obtenerTokenBearer(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
}

function construirSecretosRotativos(secretBase) {
  const ahora = new Date();
  const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  return [formatearFechaEnZona(ahora), formatearFechaEnZona(ayer)].map((fecha) => `${secretBase}${fecha}`);
}

function verifyGatewayToken(token) {
  const secretBase = obtenerSecretBase();

  if (!secretBase) {
    throw new Error('No está configurado GATEWAY_WEBHOOK_SECRET ni WEBHOOK_SECRET');
  }

  if (!token) {
    throw new Error('Token ausente');
  }

  let lastError = null;

  for (const secret of construirSecretosRotativos(secretBase)) {
    try {
      return jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'api-gateway-pagos'
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Token inválido o expirado');
}

module.exports = {
  obtenerTokenBearer,
  verifyGatewayToken
};
