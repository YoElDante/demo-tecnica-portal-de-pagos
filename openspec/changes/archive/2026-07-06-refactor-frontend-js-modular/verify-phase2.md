# Verificación PR #2 — Domain Modules + onclick Migration

> Cambio: `refactor-frontend-js-modular`
> Fecha: 2026-07-05
> Fase: PR #2 — módulos `deuda/selection`, `ticket/generator`, `pago/init` + migración de `onclick`

## Scope ejecutado

- Se crearon:
  - `public/javascripts/modules/deuda/selection.js`
  - `public/javascripts/modules/ticket/generator.js`
  - `public/javascripts/modules/pago/init.js`
- Se actualizó `public/javascripts/entry.js` para:
  - importar/init de los nuevos módulos;
  - registrar handlers con `addEventListener` para `#btn-ir-a-pagar`, `#btn-ir-a-pagar-bottom`, `#btn-volver-arriba`, chips demo (`data-dni-sugerido`).
- Se actualizó `views/index.ejs` removiendo los 4 `onclick` de PR #2.

## Checks de sintaxis (requerido)

```bash
node --check public/javascripts/modules/deuda/selection.js
node --check public/javascripts/modules/ticket/generator.js
node --check public/javascripts/modules/pago/init.js
node --check public/javascripts/entry.js
```

Resultado: todos pasan sin errores.

## Test suite (requerido)

```bash
npm test
```

Resultado:
- PASS: tests de utilidades de PR #1 + `tests/connection.db.test.js`.
- FAIL (preexistente/no relacionado con PR #2):
  - `tests/intereses/engine.test.js` → `ReferenceError: describe is not defined`
  - `tests/placeholder.test.js` → `ReferenceError: describe is not defined`

## App quick check (requerido)

- Se verificó `GET /` en entorno demo: HTTP 200.
- Se verificó carga de módulos nuevos por HTTP 200:
  - `/javascripts/entry.js`
  - `/javascripts/modules/deuda/selection.js`
  - `/javascripts/modules/ticket/generator.js`
  - `/javascripts/modules/pago/init.js`

## Observaciones / riesgos

1. PR #2 evita cambios en wiring de jsPDF, tal como exige el plan (eso queda para PR #2b).
2. Se mantiene compatibilidad legacy (`window.*` bridge) y no se eliminaron scripts legacy (`deudas.js`, `index.js`) en esta fase.
3. En este entorno no hubo navegador interactivo para ejecutar la matriz manual 7x5 completa; la validación realizada fue de sintaxis + tests + disponibilidad HTTP.

## Estado PR #2

- Tareas 2.1 a 2.6: marcadas como completas en `tasks.md`.
- Resultado técnico: listo para continuar con PR #2b, sujeto a la validación funcional manual completa en entorno con navegador real.
