# Tasks: Validación de Deuda Portal vs Escritorio

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~340 (68 core + 270 tests/validation) |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes (logical split: fixes vs verification) |
| Suggested split | PR 1 → PR 2 (stacked) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Core bug fixes (G1 + G2 + Mode C removal + FechaDesdeInt) | PR 1 | ~68 lines; base: develop |
| 2 | Test rewrite + validation script | PR 2 | ~270 lines; base: PR 1 branch or develop after merge |

## Phase 1: Core Bug Fixes

- [x] 1.1 **`services/deudas.service.js`** — Add `CodMovim: 'H'` to WHERE in `obtenerDeudasPorCodigo` (line ~207) and `obtenerDeudasPorCodigoODni` (line ~269). Add `'CodMovim'` to `QUERY_ATTRIBUTES` array (line ~82). (~4 lines)
- [x] 1.2 **`services/deudas.service.js`** — Change `total` calculation in `formatearDeuda` (line ~300): replace `importe + resultado.interes` with `saldo + resultado.interes`. (~1 line)
- [x] 1.3 **`services/intereses.service.js`** — Remove `calcularDescuentoUnicoPago` function (lines 57-77). Remove `MAPPING_CUOTABASICA` from import (line 13). Remove from `module.exports` (line 191). Update header comment: "3 modos" → "2 modos". (~25 lines deleted)
- [x] 1.4 **`services/intereses.service.js`** — Remove cuotabasica detection block (lines 119-128: `TIPOS_CON_CUOTA_UNICA`, `nroCuota`, `tipoBien`, `esCuotaUnica`, `cuotabasica` variable). Remove `if (cuotabasica === '')` wrapper — keep inner content as the main flow. Remove entire `cuotabasica !== ''` branch (lines 174-186). (~25 lines deleted, restructure)
- [x] 1.5 **`services/intereses.service.js`** — Fix FechaDesdeInt comparison (line ~147): change `fechaVtoDate < fechaLimite` to `fechaVtoDate <= fechaLimite`. (~1 line)
- [x] 1.6 **`services/intereses.service.js`** — Add commented RecIntereses block before the Mode B calculation with explanation: desktop code has it commented, kept for future activation if validation shows deltas. (~8 lines)
- [x] 1.7 **`config/intereses.config.js`** — Remove `MAPPING_CUOTABASICA` constant and its export. Add comment noting Mode C removal and that `NRO_CUOTA` detection is no longer used. (~4 lines)

## Phase 2: Test Rewrite

- [x] 2.1 **`tests/intereses/engine.test.js`** — Remove entire Mode C describe block (lines 84-108). Remove `calcularDescuentoUnicoPago` from imports. Update header comment to "2 modos". (~26 lines deleted)
- [x] 2.2 **`tests/intereses/engine.test.js`** — Fix Modo B tests: remove 4th parameter (`descInmueble`) from `calcularInteresSimpleFA` calls — function only accepts 3 params. Remove "aplica factor descinmueble" test (tests nonexistent behavior). (~5 lines changed)
- [x] 2.3 **`tests/intereses/engine.test.js`** — Rewrite dispatcher tests: replace `TIPO_PLAN` references with `NRO_CUOTA` + `TIPO_BIEN` for cuota única detection. Remove Mode C dispatcher tests (lines 158-179). Add Mode A test: `CoeficienteCuota > 0` + `FechaVto <= fechaDesdeIntereses` → expects `tipo: 'C'`. Add Mode B test: `CoeficienteCuota = 0`, `TipoMovim: 'FA'`, `dias > 0` → expects `tipo: 'T'`. (~40 lines)
- [x] 2.4 **`tests/intereses/engine.test.js`** — Add edge-case tests: `CoeficienteCuota = 0` falls to Mode B; `CoeficienteCuota = null/undefined` falls to Mode B; `FechaVto === fechaDesdeIntereses` (boundary) triggers Mode A with `<=` fix. (~20 lines)

## Phase 3: Validation Script

- [x] 3.1 **`tests/intereses/validar-contra-csv.js`** — Script standalone con conexión a BD vía `config/database.config.js` y `.env` (sin credenciales hardcodeadas). Directorio CSV: `docs/pruebas_documentos_a_comparar/`. (~20 lines)
- [x] 3.2 **`tests/intereses/validar-contra-csv.js`** — CSV reader: parsea archivos `.csv`, excluye `PLAINO` (AUAU), extrae Saldo, Int_Dto, TOTAL. Mapea nombre de archivo a DNI vía `ARCHIVO_A_DNI`. (~40 lines)
- [x] 3.3 **`tests/intereses/validar-contra-csv.js`** — BD query: busca cliente por DNI en `dbo.Clientes`, obtiene deudas de `dbo.ClientesCtaCte` con filtro `CodMovim = 'H'` y `Saldo > 0`. (~20 lines)
- [x] 3.4 **`tests/intereses/validar-contra-csv.js`** — Comparación: match CSV↔BD por `ANO_CUOTA + NRO_CUOTA + TIPO_BIEN + Importe` (±0.02). Compara Saldo (exacto), Interés (±0.1 tolerancia), Total (±0.1 tolerancia). (~35 lines)
- [x] 3.5 **`tests/intereses/validar-contra-csv.js`** — Output: tabla por contribuyente con PASS/FAIL por fila, resumen final con totales. Maneja edge cases: DNI no encontrado, CSV vacío, sin match en BD. (~35 lines)
