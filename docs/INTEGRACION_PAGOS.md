# Integracion de Pagos con SIRO

> Flujo operativo vigente del portal con el gateway de pagos.
> La plataforma activa es SIRO del Banco Roela.
> El material histórico de MercadoPago fue movido a `docs/_archive/INTEGRACION_PAGOS_MERCADOPAGO.md`.

## Arquitectura actual

```text
Contribuyente
  -> Portal Web Municipal
  -> API Gateway
  -> SIRO / Banco Roela
  -> webhook al gateway
  -> webhook interno al portal
```

## Flujo de pago

1. El contribuyente selecciona deudas en el portal.
2. El portal arma el payload y llama al gateway.
3. El gateway genera la operación de pago en SIRO.
4. El portal redirige al contribuyente a la URL segura devuelta por el gateway.
5. SIRO procesa el pago.
6. SIRO notifica al gateway.
7. El gateway valida, normaliza y reenvía la confirmación al portal.
8. El portal registra cobro y cancela deuda.

## Regla critica

El redirect del usuario nunca confirma el pago.
La unica fuente de verdad es el webhook server-to-server enviado por el gateway.

## Contrato operativo minimo

### Portal -> Gateway

- Endpoint: `POST /api/pagos`
- Responsable: portal web
- Objetivo: crear la operación de pago

Payload esperado:

```json
{
  "municipio_id": "tinoco",
  "contribuyente": {
    "dni": "12345678",
    "nombre": "Juan Perez",
    "email": "juan@email.com"
  },
  "conceptos": [
    {
      "id": "1234",
      "descripcion": "Tasa Municipal - Cuota 1/2026",
      "monto": 5500
    }
  ],
  "monto_total": 5500,
  "callback_url": "https://portal/api/pagos/confirmacion"
}
```

Respuesta esperada:

```json
{
  "success": true,
  "id_operacion": "abc123",
  "payment_url": "https://siropagosh.bancoroela.com.ar/...",
  "estado": "CREADO"
}
```

### Gateway -> Portal

- Endpoint: `POST /api/pagos/confirmacion`
- Responsable: gateway
- Objetivo: confirmar el resultado del pago en forma idempotente

Campos mínimos a persistir:

- `id_operacion`
- `NRO_OPERACION`
- `estado`
- `fecha_pago`
- `monto`
- `medio_pago = SIRO`

## Estados esperados

| Estado | Significado |
|--------|-------------|
| `CREADO` | Operación emitida por el gateway |
| `PENDIENTE` | El contribuyente fue derivado a SIRO pero no hay confirmación final |
| `APROBADO` | Pago confirmado y registrable |
| `RECHAZADO` | Pago informado como fallido |
| `EXPIRADO` | Ticket vencido antes de la confirmación |

## Configuración minima

```env
PAYMENT_GATEWAY=siro
API_GATEWAY_URL=https://gateway-pagos.alcaldia.com.ar
FRONTEND_PUBLIC_URL=https://portal-{municipio}.azurewebsites.net
WEBHOOK_SECRET=...
```

## Dónde seguir

- `docs/CONTRACT-PORTAL-GATEWAY.md` para el contrato detallado
- `docs/bd/LOGICA_DEUDAS_PAGOS.md` para registración contable
- `docs/integracion/GUIA_INTEGRACION_MULTIPROYECTO.md` para coordinación entre repos
