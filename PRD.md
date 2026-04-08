# PRD - Portal de Pagos Municipal Multi-Municipio

## Vision

Construir un portal web unico para municipios que permita consultar deudas, generar tickets y procesar pagos online con una pasarela externa, manteniendo un solo codigo base y diferenciando cada despliegue por configuracion y variables de entorno.

## Problema

Los municipios necesitan ofrecer pago web sin duplicar aplicaciones ni mezclar credenciales, branding y reglas de negocio entre implementaciones. El portal debe convivir con el software Alcaldia y con un gateway de pagos externo sin comprometer consistencia contable ni seguridad.

## Usuarios Principales

- Contribuyente que consulta deuda y realiza el pago
- Personal municipal que configura branding, tasas y despliegues
- Equipo tecnico que mantiene el portal y el gateway

## Alcance Actual

- Consulta de deudas por DNI
- Visualizacion de conceptos pendientes
- Calculo de intereses por mora
- Seleccion de conceptos y generacion de ticket
- Integracion con gateway de pago
- Webhook de confirmacion y vistas de resultado
- Soporte para multiples municipios en un mismo codigo base

## Requisitos de Negocio

1. Cambiar de municipio no debe requerir forks ni cambios manuales repartidos.
2. La confirmacion de pago debe ser segura e idempotente.
3. El contribuyente debe recibir informacion clara del estado del pago.
4. El sistema debe permitir sumar nuevas pasarelas sin reescribir el portal.
5. El despliegue por municipio debe ser repetible y auditable.

## Restricciones

- Base de datos: Azure SQL
- Backend: Node.js + Express + Sequelize
- Vistas server-side: EJS
- El portal no habla directo con la plataforma de cobro final; usa un gateway propio.
- La configuracion sensible vive fuera del repositorio.

## Riesgos Conocidos

- Aun falta una tabla dedicada para tracking de tickets pagados.
- Existen documentos con distinta madurez sobre seguridad y despliegue.
- La tasa de interes todavia aparece hardcodeada en parte del sistema.
- El webhook puede llegar despues de la expiracion operativa del ticket.

## Roadmap Inmediato

1. Crear el ciclo de vida formal de tickets pagados.
2. Hacer configurable la tasa de interes por municipio.
3. Endurecer seguridad HTTP en produccion.
4. Agregar envio de comprobantes por email.

## Fuentes

- `README.md`
- `docs/README.md`
- `docs/AI_CONTEXT.md`
- `docs/CONTRACT-PORTAL-GATEWAY.md`
- `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md`