# Design - Security Hardening

## Enfoque

- Insertar seguridad al comienzo del pipeline de middlewares.
- Configurar CSP explicitamente para scripts, iframes y conexiones externas necesarias.
- Activar HTTPS forzado solo en produccion y con `trust proxy`.

## Componentes Afectados

- `app.js`
- `middlewares/forceHttps.js`
- `package.json`

## Riesgos

- Una CSP demasiado estricta puede romper el flujo de MercadoPago.