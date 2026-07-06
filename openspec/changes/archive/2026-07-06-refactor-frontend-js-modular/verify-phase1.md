# Verificación PR #1 — Pure Utils + node:test

> Cambio: `refactor-frontend-js-modular`
> Fecha: 2026-07-05
> Fase: PR #1 — Extracción de utilidades puras + `node:test`

## Tests Automáticos

```bash
node --test public/javascripts/modules/utils/currency.test.js
# pass 9 / fail 0

node --test public/javascripts/modules/utils/date.test.js
# pass 4 / fail 0
```

`npm test` ejecuta correctamente los tests nuevos, pero **falla en tests legacy preexistentes** (`tests/intereses/engine.test.js` y `tests/placeholder.test.js`) porque usan la API global de Jest (`describe is not defined`). Estos archivos no fueron modificados por este PR.

## Servidor de Desarrollo

Comando: `npm run dev:demo`

- Inicialmente falló con `ReferenceError: ñ is not defined` en `middlewares/csrf.js:1`. Se trató de un **bug preexistente** (carácter corrupto al inicio del archivo).
- Se aplicó un fix de un solo carácter (`ñ/**` → `/**`) para desbloquear la verificación.
- Posteriormente el servidor levantó correctamente en `http://localhost:4000`.

## Verificación HTTP

| Request | Resultado |
|---------|-----------|
| `GET /` | 200 |
| HTML contiene `<script type="module" src="/javascripts/entry.js">` | OK |
| `GET /javascripts/entry.js` | 200 |
| `GET /javascripts/modules/utils/currency.js` | 200 |
| `GET /javascripts/modules/utils/date.js` | 200 |
| `GET /javascripts/modules/utils/dom.js` | 200 |
| `POST /buscar` (DNI demo `17720479`) | 200; contiene `.deudas__table`, `#total-final`, `#checkbox-todos` |

## Checks de Sintaxis

```bash
node --check public/javascripts/entry.js
node --check public/javascripts/modules/utils/currency.js
node --check public/javascripts/modules/utils/date.js
node --check public/javascripts/modules/utils/dom.js
```

Todos pasan sin errores.

## Verificación Manual / Navegador

**Limitación del entorno**: no se dispuso de un navegador real ni headless para inspeccionar la consola o ejecutar interacciones como checkbox toggle, cálculo de total, generación de ticket, descarga de PDF o "Ir a Pagar". La validación de carga de scripts se realizó vía HTTP 200 y syntax-check.

## Hallazgos / Bugs Preexistentes

1. `middlewares/csrf.js:1` contenía un `ñ` corrupto que impedía iniciar `npm run dev:demo`. Se aplicó fix de un carácter.
2. `tests/intereses/engine.test.js` y `tests/placeholder.test.js` usan API Jest y fallan bajo `node --test`.

## Estado del PR #1

Tareas implementadas: 9/9.
Líneas estimadas: ~198 según diseño.
PR listo para revisión; las interacciones finales del navegador se validarán en un entorno con browser real antes del merge.
