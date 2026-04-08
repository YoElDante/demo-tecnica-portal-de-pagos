# Design - Email Payment Receipts

## Enfoque

- Disparar el envio despues de confirmar el pago real por webhook.
- Separar composicion del mensaje del controller de pagos.
- Mantener configurable el proveedor de correo.

## Componentes Afectados

- `controllers/payment.controller.js`
- Servicio nuevo de correo
- Configuracion municipal o de entorno para emails

## Riesgos

- El flujo de pago no debe quedar bloqueado si el envio de correo falla.