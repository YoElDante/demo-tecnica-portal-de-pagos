# Verificación PR #3 — State + Cleanup + Legacy Deletion

> Cambio: `refactor-frontend-js-modular`
> Fecha: 2026-07-05
> Fase: PR #3 — estado modular, extracción de scripts inline y limpieza final

## Scope ejecutado

- Se crearon:
  - `public/javascripts/modules/state/contribuyente.js`
  - `public/javascripts/modules/state/demo-panel.js`
  - `public/javascripts/modules/pago/polling.js`
- Se actualizó `public/javascripts/entry.js` para bootstrap modular completo (sin puente `window.*`).
- Se actualizó `views/index.ejs` para:
  - remover `<script defer>` legacy (`deudas.js`, `index.js`, `csrf-helper.js`);
  - mantener `entry.js` como único entry modular + `jspdf` vendor;
  - migrar `contribuyenteData` inline a `<script type="application/json" id="contribuyente-data-inline">`.
- Se actualizó `views/partials/demo-panel.ejs` removiendo la IIFE inline (ahora inicializa vía módulo desde `entry.js`).
- Se actualizó `views/pago/pendiente.ejs` para usar `startPolling()` desde módulo ES.
- Se eliminaron archivos legacy:
  - `public/javascripts/deudas.js`
  - `public/javascripts/index.js`
  - `public/javascripts/csrf-helper.js`

## Checks de sintaxis

```bash
node --check public/javascripts/entry.js
node --check public/javascripts/modules/state/contribuyente.js
node --check public/javascripts/modules/state/demo-panel.js
node --check public/javascripts/modules/pago/polling.js
```

Resultado: todos los checks pasan sin errores.

## Test suite

```bash
npm test
```

Resultado:
- PASS: tests modulares de utilidades y conexión DB.
- FAIL (preexistente/no relacionado con PR #3):
  - `tests/intereses/engine.test.js` → `ReferenceError: describe is not defined`
  - `tests/placeholder.test.js` → `ReferenceError: describe is not defined`

## App quick check

```bash
npm run dev:demo
```

Resultado: arranque OK, pero con advertencia de puerto 4000 en uso (instancia previa activa).

Checks HTTP realizados:
- `GET /` → 200
- `GET /javascripts/modules/state/contribuyente.js` → 200
- `GET /javascripts/modules/state/demo-panel.js` → 200
- `GET /javascripts/modules/pago/polling.js` → 200
- `GET /javascripts/deudas.js` → 404 (esperado)
- `GET /javascripts/index.js` → 404 (esperado)
- `GET /javascripts/csrf-helper.js` → 404 (esperado)

Adicional en `GET /`:
- `entry.js` presente.
- referencias a `deudas.js`, `index.js`, `csrf-helper.js` ausentes.

## Desvíos respecto a tasks/design

1. En `3.6`, en lugar de agregar `<script type="module">` dentro de `demo-panel.ejs`, la inicialización quedó centralizada en `entry.js` (`initDemoPanel()`).
   - Motivo: evitar múltiples entrypoints para una misma pantalla y mantener bootstrap único.
2. En `3.4`, `entry.js` no importa `pago/polling.js` porque ese módulo se consume en `views/pago/pendiente.ejs` (contexto de otra vista).
   - Motivo: evitar imports no usados y separar bootstrap por pantalla.

## Riesgos pendientes

1. Falta ejecutar matriz funcional manual 7x5 completa con navegador real (interacciones end-to-end por municipio).
2. `node:test` emite warning `MODULE_TYPELESS_PACKAGE_JSON` por tests ESM sin `"type": "module"`; no bloquea ejecución, pero conviene resolverlo en hardening posterior.

## Estado PR #3

- Tareas 3.1 a 3.11: marcadas como completas en `tasks.md`.
- Resultado técnico: implementación lista para fase de verificación integral/QA funcional final.
