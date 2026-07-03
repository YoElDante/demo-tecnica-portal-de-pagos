# Design - Configurable Interest Rate

## Enfoque

- Leer primero la tasa desde entorno.
- Usar configuracion municipal como fallback funcional.
- Mantener un default seguro mientras se completa la migracion.

## Componentes Afectados

- `services/deudas.service.js`
- `config/municipalidad.config.*.js`
- `.env.example`

## Riesgos

- Cambios silenciosos en calculos historicos si no se aclara el origen de la tasa.