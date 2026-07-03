# Proposal: Validacion de Deuda Portal vs Escritorio

## Intent

Garantizar que los importes de deuda que muestra el portal coincidan EXACTAMENTE con los del software de gestion municipal de escritorio, usando la BD de produccion de El Manzano como referencia. La exploracion detecto que el portal calcula `TOTAL` sobre `Importe` (no `Saldo`), omite el filtro `CodMovim = 'H'`, y el Modo C del motor de intereses es codigo muerto segun aclaracion del contador.

## Scope

### In Scope
- G1: Cambiar `TOTAL = importe + interes` a `Saldo + interes` en `services/deudas.service.js`.
- G2: Agregar filtro `CodMovim: 'H'` en `obtenerDeudasPorCodigo` y `obtenerDeudasPorCodigoODni`.
- Reducir el motor a 2 modos reales: Modo A (coeficiente) y Modo B (interes diario).
- Eliminar Modo C / `cuotabasica` (el portal no maneja cuota unica).
- Crear script de validacion contra los 5 CSV de `docs/pruebas_documentos_a_comparar/`.
- Corregir tests `engine.test.js` con escenarios A/B reales, sin Modo C.
- Actualizar spec `interest-calculation` a 2 modos y TOTAL por Saldo.

### Out of Scope
- Factor `DESC_INMUEBLE` (diferido; el contador indico asumir 1.0).
- Tipos de bien sin datos de prueba (`OBSA`, `CEM1`, `PEPE`, `CACA`).
- Redondeo half-even (diferido salvo que la validacion muestre deltas > 0.01).
- Caso `AUAU` atipico (PLAINO) y verificacion de `RecIntereses` (pendiente confirmacion).

## Capabilities

### New Capabilities
- `debt-validation`: harness de validacion portal-vs-escritorio contra dataset de 5 contribuyentes.

### Modified Capabilities
- `interest-calculation`: motor reducido a Modo A (coeficiente) y Modo B (interes diario); TOTAL basado en Saldo; filtro CodMovim explicito.

## Approach

1. Corregir `services/deudas.service.js`: agregar `CodMovim: 'H'` al WHERE y cambiar TOTAL a `saldo + resultado.interes`.
2. Simplificar `services/intereses.service.js`: conservar Modo A y B, eliminar rama Modo C y logica de `cuotabasica`.
3. Crear `scripts/validate-debt-vs-csv.js`: lee CSV, ejecuta el motor por DNI, compara fila a fila (Saldo, Int_Dto, TOTAL), reporta deltas y PASS/FAIL por contribuyente.
4. Corregir `tests/intereses/engine.test.js`: sin Modo C, con escenarios A/B usando valores reales de los CSV.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `services/deudas.service.js` | Modified | Filtro CodMovim + TOTAL por Saldo |
| `services/intereses.service.js` | Modified | Eliminar Modo C, aislar 2 modos |
| `scripts/validate-debt-vs-csv.js` | New | Harness de comparacion |
| `tests/intereses/engine.test.js` | Modified | Tests A/B reales, sin Modo C |
| `openspec/specs/interest-calculation/spec.md` | Modified | 2 modos, TOTAL por Saldo |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Eliminar Modo C rompa callers externos | Low | Grep usos de `cuotabasica` antes de borrar |
| Deltas de redondeo > tolerancia (0.01) | Medium | Si aparece, analizar half-even en design |
| Registros drop por filtro CodMovim | Low | Validar contra totales esperados del CSV |

## Rollback Plan

Revertir los commits de `services/deudas.service.js`, `services/intereses.service.js` y `tests/intereses/engine.test.js`. El nuevo `scripts/validate-debt-vs-csv.js` y el dataset `docs/pruebas_documentos_a_comparar/` son aditivos y seguros de dejar.

## Dependencies

- Acceso a BD El Manzano produccion (`MUNICIPIO=elmanzano`).
- `csv-parse` (version exacta, pin) si no esta presente.
- CoeficienteCuota ya mapeado por cambio previo `sequelize-mapping-manzano-debt-formulas` (completado).

## Success Criteria

- [ ] Los 5 contribuyentes: TOTAL portal == TOTAL CSV dentro de +-0.01.
- [ ] Saldo e Int_Dto por fila coinciden con el CSV.
- [ ] Ningun registro `CodMovim='D'` aparece en resultados de deuda.
- [ ] `scripts/validate-debt-vs-csv.js` ejecuta y emite PASS/FAIL por contribuyente.
- [ ] Modo C eliminado; tests A/B en verde.
- [ ] Spec `interest-calculation` actualizada a 2 modos.