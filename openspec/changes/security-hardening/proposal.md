# Proposal - Security Hardening

## Problema

El proyecto tiene una lista pendiente de headers de seguridad y forzado de HTTPS para produccion.

## Objetivo

Endurecer el portal sin romper integraciones de pago ni assets remotos necesarios.

## Alcance

- Helmet
- Middleware `forceHttps`
- Ajuste de CSP
- Validacion de compatibilidad con Azure y pasarelas