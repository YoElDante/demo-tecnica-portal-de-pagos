# Design: Refactor Frontend JS — Modular Architecture

## Technical Approach

Migración en fases usando **ES modules nativos** (`<script type="module">`) sin build step. Estrategia de coexistencia: módulos nuevos conviven con `<script defer>` legacy hasta verificación completa. jsPDF se mantiene como UMD vendor separado. Bridge pattern garantiza backward compat en cada fase.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| ES modules nativos | Sin build, sin `npm install`, sirve `express.static` | ✅ Elegido |
| Vite / esbuild | Agrega build step, `npm install`, overkill para ~978 líneas | ❌ Rechazado |
| Mantener `<script defer>` | No resuelve acoplamiento, no permite tests unitarios | ❌ Rechazado |
| jsPDF vía npm + import | Fuerza build step solo para 1 lib vendored | ❌ Rechazado |
| `node:test` como runner | Cero deps, nativo Node 20+, suficiente para funciones puras | ✅ Elegido |
| Jest / Vitest | 200+ dependencias, configuración extra | ❌ Rechazado |

**Decisión de bridge**: Phase 1 re-exporta utils a `window.*` → backward compat con `onclick`. Phase 2 convierte `onclick` → `addEventListener`. Phase 3 elimina bridges. Cada fase es independientemente revertible con `git revert`.

**Decisión de `contribuyenteData`**: Tag `<script type="application/json">` (no ejecutable, CSP-friendly) en lugar de inline `var` (PII en global scope) o `data-*` attributes (no escala para objetos).

## Target Architecture

```
public/javascripts/
├── vendor/jspdf.umd.min.js     ← UMD vendor (sin cambios)
└── entry.js                     ← Entry point (type="module")

src/client/modules/
├── utils/
│   ├── currency.js              extraerNumero, extraerNumeroConSigno, formatCurrency
│   ├── currency.test.js         node:test
│   ├── date.js                  parsearFechaParaOrden
│   ├── date.test.js             node:test
│   └── dom.js                   getCsrfToken, isRowVisible, scrollToElement
├── state/
│   ├── contribuyente.js         fetch PII + inline fallback
│   └── demo-panel.js            IIFE extraído de demo-panel.ejs
├── deuda/
│   └── selection.js             checkbox mgmt, total, filtro, recopilar
├── ticket/
│   ├── generator.js             generarTicket (API + DOM render)
│   └── pdf.js                   descargarPDF (jsPDF, 370 líneas extraídas de deudas.js)
└── pago/
    ├── init.js                  iniciarPago (orquestación)
    └── polling.js               polling de pendiente.ejs

DELETED (Phase 3): public/javascripts/{deudas.js, index.js, csrf-helper.js}
```

## Per-Phase File Inventory

### Phase 1 — Pure Utils + node:test (PR #1, ~198 líneas)

| File | Action | Lines |
|------|--------|-------|
| `src/client/modules/utils/currency.js` | CREATE | 40 |
| `src/client/modules/utils/currency.test.js` | CREATE | 60 |
| `src/client/modules/utils/date.js` | CREATE | 15 |
| `src/client/modules/utils/date.test.js` | CREATE | 30 |
| `src/client/modules/utils/dom.js` | CREATE | 35 |
| `public/javascripts/entry.js` | CREATE | 15 |
| `views/index.ejs` | MODIFY | +2 |
| `package.json` | MODIFY | +1 |

**Total**: ~198 líneas. `entry.js` re-exporta utils a `window.*` → los 4 `onclick` siguen funcionando. `npm test` pasa.

### Phase 2 — Domain Modules + onclick Migration (PR #2, ~389 líneas)

| File | Action | Lines |
|------|--------|-------|
| `src/client/modules/deuda/selection.js` | CREATE | 180 |
| `src/client/modules/ticket/generator.js` | CREATE | 100 |
| `src/client/modules/pago/init.js` | CREATE | 80 |
| `public/javascripts/entry.js` | MODIFY | +10/-5 |
| `views/index.ejs` | MODIFY | +8/-4 |

**Total**: ~389 líneas. Convierte 4 `onclick` → `addEventListener` en `entry.js`. PR de más alto riesgo — verificación manual obligatoria antes merge.

### Phase 2b — PDF Extraction (PR #3, ~373 líneas)

⚠️ **Separado del Phase 2 original**: `pdf.js` (~370 líneas) por sí solo casi alcanza el budget de 400. Se extrae en PR propio para mantener cada entrega ≤400.

| File | Action | Lines |
|------|--------|-------|
| `src/client/modules/ticket/pdf.js` | CREATE | 370 |
| `public/javascripts/entry.js` | MODIFY | +3 |

### Phase 3 — State + Polling + Cleanup (PR #4, ~390 líneas)

| File | Action | Lines |
|------|--------|-------|
| `src/client/modules/state/contribuyente.js` | CREATE | 50 |
| `src/client/modules/state/demo-panel.js` | CREATE | 110 |
| `src/client/modules/pago/polling.js` | CREATE | 50 |
| `public/javascripts/entry.js` | MODIFY | +10/-25 |
| `views/index.ejs` | MODIFY | +3/-10 |
| `views/partials/demo-panel.ejs` | MODIFY | +1/-110 |
| `views/pago/pendiente.ejs` | MODIFY | +2/-50 |
| `public/javascripts/index.js` | DELETE | -237 |
| `public/javascripts/deudas.js` | DELETE | -731 |
| `public/javascripts/csrf-helper.js` | DELETE | -10 |

## Module Interfaces

```javascript
// utils/currency.js
export function extraerNumero(texto: string): number
export function extraerNumeroConSigno(celda: HTMLElement): number
export function formatCurrency(amount: number, locale?: string): string

// utils/date.js
export function parsearFechaParaOrden(fechaStr: string): Date

// utils/dom.js
export function getCsrfToken(): string
export function isRowVisible(row: HTMLElement): boolean
export function scrollToElement(id: string): void

// deuda/selection.js
export function obtenerCheckboxesConceptos(): HTMLElement[]
export function obtenerCheckboxesConceptosMarcados(): HTMLElement[]
export function obtenerCreditoAutomaticoVisible(): number
export function actualizarTotal(): void
export function toggleTodos(): void
export function actualizarContadores(): void
export function actualizarCheckboxTodos(): void
export function recopilarConceptosSeleccionados(): object[]
export function recopilarIdTransSeleccionados(): number[]
export function recopilarCreditosFavorVisibles(): object[]
export function recopilarConceptosParaPago(): object[]
export function initSelectionEvents(): void

// ticket/generator.js
export function generarTicket(): Promise<void>
export function extraerTextoDetalle(cell: HTMLElement): string
export function obtenerDatosContribuyente(): { dni: string, nombreCompleto: string }

// ticket/pdf.js — depends on window.jspdf (UMD)
export function descargarPDF(): Promise<void>

// pago/init.js
export function iniciarPago(): Promise<void>
export function initPagoEvents(): void

// pago/polling.js
export function startPolling(ref: string, token: string, code: string): void

// state/contribuyente.js
export let contribuyenteData: object | null
export function initContribuyenteData(): Promise<void>

// state/demo-panel.js
export const DEMO_PANEL: { resultado: string, modificaBD: boolean }
export function initDemoPanel(): void
```

## Dependency Graph

```
entry.js
  ├── utils/currency.js            (pure, no deps)
  ├── utils/date.js                (pure, no deps)
  ├── utils/dom.js                 (DOM-only)
  ├── state/contribuyente.js ────── utils/dom.js
  ├── state/demo-panel.js          (DOM-only, self-contained)
  ├── deuda/selection.js ────────── utils/{currency, dom}
  ├── ticket/generator.js ───────── deuda/selection.js, utils/dom.js
  ├── ticket/pdf.js ─────────────── utils/dom.js, window.jspdf (UMD)
  ├── pago/init.js ─────────────── deuda/selection.js, state/{contribuyente, demo-panel}, utils/{currency, dom}
  └── pago/polling.js              (self-contained, pure fetch)
```

## onclick Migration Detail

| Línea EJS | Handler | Migración en entry.js |
|-----------|---------|----------------------|
| 132 | `onclick="seleccionarContribuyente('...')"` | `chip.addEventListener('click', () => seleccionarContribuyente(chip.dataset.dni))` |
| 272 | `onclick="iniciarPago()"` | `document.getElementById('btn-ir-a-pagar').addEventListener('click', iniciarPago)` |
| 287 | `onclick="iniciarPago()"` | `document.getElementById('btn-ir-a-pagar-bottom').addEventListener('click', iniciarPago)` |
| 290 | `onclick="volverArriba()"` | `document.getElementById('btn-volver-arriba').addEventListener('click', volverArriba)` |

## EJS → Module Bridge

**`contribuyenteData`**: inline `<script>var</script>` se reemplaza por `<script type="application/json" id="contribuyente-data-inline">`. `state/contribuyente.js` hace `JSON.parse(el.textContent)`.

**`window.DEMO_PANEL`**: IIFE inline de 108 líneas se extrae a `state/demo-panel.js`. `demo-panel.ejs` carga `<script type="module">import { initDemoPanel } from '/javascripts/modules/state/demo-panel.js'; initDemoPanel();</script>`.

## Verification Matrix (por PR)

| Interacción | demo | elmanzano | tinoco | sanjose | calchinoeste |
|-------------|------|-----------|--------|---------|--------------|
| Búsqueda DNI | [ ] | [ ] | [ ] | [ ] | [ ] |
| Checkbox + total | [ ] | [ ] | [ ] | [ ] | [ ] |
| Filtro tipo deuda | [ ] | [ ] | [ ] | [ ] | [ ] |
| Generar ticket | [ ] | [ ] | [ ] | [ ] | [ ] |
| Descargar PDF | [ ] | [ ] | [ ] | [ ] | [ ] |
| Ir a Pagar | [ ] | [ ] | [ ] | [ ] | [ ] |
| Demo panel | [ ] | N/A | N/A | N/A | N/A |

Completar y commitear como `openspec/changes/refactor-frontend-js-modular/verify-phase{N}.md`.

## node:test Setup

```json
// package.json — nuevo script
"test": "node --test"
```

Convención: `*.test.js` en `src/client/modules/`. Node 20+ los descubre recursivamente. Ejecutar: `npm test`.

Ejemplo `currency.test.js`:
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extraerNumero } from './currency.js';

describe('extraerNumero', () => {
  it('parsea $ 1.234,56 → 1234.56', () => {
    assert.strictEqual(extraerNumero('$ 1.234,56'), 1234.56);
  });
  it('retorna 0 para texto vacío', () => {
    assert.strictEqual(extraerNumero(''), 0);
  });
});
```

## Rollback por Fase

```bash
# Phase 1
git revert <phase-1-commit>

# Phase 2
git revert <phase-2-commit>   # Restaura onclick en EJS

# Phase 2b
git revert <phase-2b-commit>

# Phase 3
git revert <phase-3-commit>   # Restaura <script defer> + archivos legacy

# Emergencia total
git revert <phase-3> <phase-2b> <phase-2> <phase-1>
```

Sin cambios en BD, rutas ni controladores — solo frontend JS.

## ADR-011 (apéndice para docs/architecture/adr.md)

```markdown
## ADR-011: Frontend JS Modular sin Build Step

**Fecha**: 2026-07-05
**SDD Change**: refactor-frontend-js-modular

### Contexto
Frontend JS (~978 líneas, 3 archivos) usa funciones globales con dependencia en orden
de carga de `<script defer>`. `extraerNumero()` definido en `deudas.js` pero llamado
desde `index.js` por convención — reordenar tags rompe `iniciarPago()` sin error visible.

### Decisión
ES modules nativos (`<script type="module">`) sin build step. Bridge pattern en 4 fases
para migración sin downtime. jsPDF UMD vendor separado. `node:test` como test runner.

### Consecuencias
- ✅ `extraerNumero` es importable — orden de tags irrelevante
- ✅ Funciones puras testables con `node:test` por primera vez
- ✅ Sin build step, sin `npm install` nuevo
- ✅ Rollback independiente por fase (git revert por PR)
- ❌ jsPDF sigue como UMD global externo al module graph
- ❌ `pendiente.ejs` y `demo-panel.ejs` requieren `<script type="module">` inline

### Archivos
- `src/client/modules/` — nuevo árbol de módulos
- `openspec/changes/refactor-frontend-js-modular/design.md`
```
