# Verification Report: align-sequelize-manzano-062026

## Change
Alinear los 4 modelos Sequelize (`ClientesCtasCtes`, `Cliente`, `TicketsPago`, `TicketPagoEventos`) con el script `docs/bd/script_creacion_bd_ElManzano_062026.sql`. Corrección de tipos/longitudes/nullabilidad sin alterar comportamiento funcional.

## Verification Mode
- **Persistence**: hybrid (OpenSpec file + Engram)
- **Strict TDD**: FALSE — solo verificación manual + smoke test `testDB`
- **Artifacts available**: proposal ✅, spec ✅, tasks ✅, design ❌ (no `design.md` existe)
- **Design coherence**: SKIPPED — no existe `design.md` en el cambio. Verificación limitada a proposal/spec/tasks + inspección de código + runtime.

## Task Completion

| Phase | Tasks | Completed |
|-------|-------|-----------|
| Phase 1: ClientesCtaCte | 1.1–1.5 | 5/5 ✅ |
| Phase 2: Cliente | 2.1–2.5 | 5/5 ✅ |
| Phase 3: TicketsPago + TicketPagoEventos | 3.1–3.3 | 3/3 ✅ |
| Phase 4: Service Compatibility | 4.1–4.3 | 3/3 ✅ |
| Phase 5: Final Verification | 5.1–5.3 | 3/3 ✅ |
| **Total** | **19** | **19/19 ✅** |

Todas las tareas marcadas `[x]` en `tasks.md` fueron verificadas contra el código fuente de los modelos.

## Build / Tests / Coverage Evidence

| Command | Result | Evidence |
|---------|--------|----------|
| `npm run testDB` | ✅ PASS | `Conexión a la BD: OK` contra `alcaldiasmlqdsmanzano.database.windows.net` (municipio El Manzano). Modelos cargan sin errores de tipo. |
| Type-check / lint | ⚠️ N/A | No existe comando de lint/type-check configurado en `package.json`. |
| Coverage | ⚠️ N/A | Sin suite de tests (strict_tdd FALSE). Solo smoke test de conexión. |

## Spec Compliance Matrix — ADDED Requirements

| Requirement | Scenario | Status | Evidence |
|-------------|----------|--------|----------|
| Missing columns in ClientesCtaCte (`Usuario`, `CoeficienteCuota`) | Usuario column available | ✅ PASS | `ClientesCtasCtes.js:221-224` `Usuario` STRING(24) allowNull:true |
| | CoeficienteCuota column available | ✅ PASS | `ClientesCtasCtes.js:225-228` `CoeficienteCuota` DECIMAL(15,2) allowNull:true |
| Missing column in Cliente (`Deshabilita`) | Deshabilita column available | ✅ PASS | `Cliente.js:200-203` `Deshabilita` STRING(20) allowNull:true |
| Default values in TicketsPago/TicketPagoEventos | New ticket inherits defaults | ⚠️ PARTIAL | `currencyCode`→'ARS' ✅, `retryCount`→0 ✅, timestamps→`DataTypes.NOW` ✅ (funcional) PERO spec exige `sysutcdatetime()`; ver WARNING-3 |

## Spec Compliance Matrix — MODIFIED Requirements

| Requirement | Scenario | Status | Evidence |
|-------------|----------|--------|----------|
| ClientesCtaCte column types match SQL | String-coded identifiers query correctly | ✅ PASS | 9 cols INTEGER→STRING verificadas (NRO_INTERNO/ID_BIEN/TIPO_PLAN/TIPO_CUOTA/ANO_CUOTA/NRO_CUOTA/TablaLiq/NumeroPago/NumeroPagoTmp) |
| | Monetary columns map correctly | ✅ PASS | `Operacion` DECIMAL(15,2) (`:60`), `DiasPromedio` DECIMAL(15,2) (`:84`) |
| | Boolean flags map correctly | ✅ PASS | `EsPago`/`EsDocumento` BOOLEAN (`:72`,`:76`); `MOF`/`LOF` STRING(3) (`:214`,`:218`); `Observaciones` STRING(100) (`:198`) |
| Cliente column types and lengths match SQL | Boolean fields serialize correctly | ✅ PASS | `DesHabilitado`/`IvaDiferencial`/`LLevaFlete`/`PercepIBTucuman` BOOLEAN con defaultValue:false |
| | Name fields accept full SQL length | ✅ PASS | `Nombre`/`Apellido`/`Posedor` STRING(100) |
| | NOT NULL columns reject null inserts | ✅ PASS | `IDENTIFICADOR`(6)/`DOCUMENTO`(8)/`ID_COMERCIO_INDUSTRIA`(6) allowNull:false |
| TicketsPago rowVersion and TEXT columns | rowVersion not included in inserts | ✅ PASS | `rowVersion` removido del modelo — no se incluye en INSERT |
| | rowVersion read after update | ⚠️ PARTIAL | Removido (no VIRTUAL). Default re-read NO retorna `rowVersion`; requiere `attributes:{include:['row_version']}`. Workaround documentado en comentario. Ver WARNING-1 |
| TicketPagoEventos TEXT and default columns | Large payload stored correctly | ⚠️ PARTIAL | `payloadJson` TEXT (NVARCHAR(MAX) en mssql) soporta 50KB ✅ funcional, PERO spec exige STRING('max'); ver WARNING-2 |
| Service compatibility after type changes | Debt query works with string identifiers | ✅ PASS | `deudas.service.js` usa `|| ''` en NRO_CUOTA/ANO_CUOTA/ID_BIEN/TIPO_BIEN (ahora STRING); `Number(deuda.Importe)` solo sobre DECIMAL |
| | Client lookup works with boolean flags | ✅ PASS | `clientes.service.js` no usa DesHabilitado/LLevaFlete/PercepIBTucuman; `DOCUMENTO: dni.trim()` compatible con STRING(8) |

## Correctness Table

| Model | Columns Checked | Compliant | Deviations |
|-------|----------------|-----------|------------|
| ClientesCtasCtes | 9 INTEGER→STRING + 7 type fixes + 18 lengths + 2 new = 36 | 36/36 ✅ | None |
| Cliente | 7 type fixes + 6 NOT NULL/lengths + 16 lengths + 1 new = 30 | 30/30 ✅ | None |
| TicketsPago | rowVersion + payloadSnapshot + 5 defaults | 4/5 ⚠️ | rowVersion removed vs VIRTUAL; payloadSnapshot TEXT vs STRING('max'); defaults NOW vs sysutcdatetime() |
| TicketPagoEventos | payloadJson + receivedAtUtc default | 1/2 ⚠️ | payloadJson TEXT vs STRING('max'); receivedAtUtc NOW vs sysutcdatetime() |
| deudas.service.js | numeric-op audit | ✅ | None |
| clientes.service.js | numeric-op audit | ✅ | None |

## Design Coherence

SKIPPED — no existe `design.md` en `openspec/changes/align-sequelize-manzano-062026/`. La verificación se basó en proposal + spec + tasks + inspección de código. No se evaluó coherencia con decisiones de diseño (no hay artefacto de diseño).

## Issues

### CRITICAL
None.

### WARNING

**WARNING-1: `rowVersion` removido del modelo vs spec "MUST treat as VIRTUAL"**
- Spec (`spec.md:91`): "The TicketsPago model MUST treat `rowVersion` as VIRTUAL (read-only, not written)".
- Implementación (`TicketsPago.js:124-126`): `rowVersion` fue **removido** del modelo, no declarado como VIRTUAL.
- Impacto en escenario: "rowVersion read after update" NO se cumple por defecto — un `findByPk` estándar no retorna `rowVersion`. Requiere `attributes:{include:['row_version']}` (documentado en comentario).
- La decisión está registrada en `tasks.md:37` con justificación ("auto-managed por SQL Server"). Funcionalmente evita escribir la columna auto-gestionada (escenario "not included in inserts" ✅), pero no permite lectura transparente.
- **Acción**: reconciliar — either (a) declarar `rowVersion` como `DataTypes.VIRTUAL` para cumplir el spec, o (b) enmendar el spec para reflejar la decisión de remover la columna.

**WARNING-2: `payloadSnapshot` y `payloadJson` usan TEXT vs spec "MUST use STRING('max')"**
- Spec (`spec.md:91`, `spec.md:108`): "`payloadSnapshot` MUST use STRING('max') instead of deprecated TEXT" / "`payloadJson` MUST use STRING('max')".
- Implementación (`TicketsPago.js:108`, `TicketPagoEventos.js:55`): ambas usan `DataTypes.TEXT`.
- Impacto funcional: **ninguno** para mssql/tedious (ambos TEXT y STRING('max') mapean a `NVARCHAR(MAX)`); los escenarios de payload grande (50KB) se cumplen.
- La decisión está en `tasks.md:37-38` ("mapping correcto para nvarchar(max)").
- **Acción**: reconciliar spec/impl. Funcionalmente OK, pero el spec usa MUST explícito.

**WARNING-3: Defaults de timestamps usan `DataTypes.NOW` vs spec "MUST declare `sysutcdatetime()`"**
- Spec (`spec.md:33`, `spec.md:108`): defaults MUST ser `Sequelize.fn('sysutcdatetime')`.
- Implementación: `issuedAtUtc`/`createdAtUtc`/`updatedAtUtc`/`receivedAtUtc` usan `defaultValue: DataTypes.NOW`.
- Impacto funcional: **casi nulo** — `DataTypes.NOW` genera timestamp al momento del insert (Node `Date` es UTC-interno). Diferencia: tiempo del lado aplicación vs DB server UTC. Si los relojes divergen, los timestamps difieren. Los escenarios ("current UTC") se cumplen funcionalmente.
- **Acción**: si se exige UTC garantizado por DB server, cambiar a `sequelize.fn('SYSUTCDATETIME')`; si no, enmendar spec.

**WARNING-4: Archivos fuera de scope en el working tree**
- `git diff --stat` muestra 8 archivos cambiados, pero el proposal scope incluye solo los 4 modelos (+ model.index.js + 2 services verificados sin cambios).
- Fuera de scope:
  - `docs/bd/script.sql` — **eliminado** (binary, 276750→0 bytes). No mencionado en el proposal. El nuevo `script_creacion_bd_ElManzano_062026.sql` ya existe.
  - `config/index.js` — agrega municipio `'carrilobo'` a `municipiosDisponibles`. No relacionado con alineación de modelos.
  - `AGENTS.md` — 31 insertions/2 deletions (cambios de docs).
  - `.atl/skill-registry.md` — auto-generado por skill-registry.
- `tasks.md:52` (5.3) reclama "192 inserciones, 151 eliminaciones" pero ese conteo **incluye** estos archivos no relacionados.
- **Acción**: al commit, stagear solo los 4 archivos de modelo para este cambio. Separar `carrilobo`, `AGENTS.md`, y la eliminación de `script.sql` en commits propios.

### SUGGESTION

**SUGGESTION-1: `NroRenglonAsiento` usa INTEGER donde SQL define `smallint`**
- Spec (`spec.md:45`): "`NroRenglonAsiento` → INTEGER(smallint)".
- Implementación (`ClientesCtasCtes.js:68`): `DataTypes.INTEGER`.
- `INTEGER` es más ancho que `smallint` pero funcionalmente correcto (sin error). Para precisión exacta, `DataTypes.SMALLINT` mapea 1:1. No bloqueante.

**SUGGESTION-2: `Nro_Dev` podría requerir revisión de tipo**
- `ClientesCtasCtes.js:146` declara `Nro_Dev` como INTEGER sin comentario de alineación SQL. No está en la lista de correcciones del spec/tasks. Verificar contra SQL si es `int` o `smallint`. No bloqueante (fuera del scope explícito del spec).

**SUGGESTION-3: Documentar la decisión de mapeo `money`→`DECIMAL(15,2)`**
- Proposal `proposal.md:74` asume `DECIMAL(15,2)` por consistencia. SQL Server `money` tiene precisión `DECIMAL(19,4)`. Para valores monetarios grandes (>10^13) podría haber pérdida. No aplica a este dominio (deudas municipales). Considerar `DECIMAL(19,4)` en futuro si se modelan montos grandes. No bloqueante.

## Final Verdict

**PASS WITH WARNINGS**

- ✅ 19/19 tareas completadas y verificadas contra código fuente.
- ✅ `npm run testDB` PASS — modelos cargan contra Azure SQL El Manzano sin errores.
- ✅ Phase 1 (ClientesCtaCte) y Phase 2 (Cliente) — las CRÍTICAS — 100% compliant con spec.
- ✅ Services (`deudas.service.js`, `clientes.service.js`) compatibles con los nuevos tipos — cero cambios requeridos, cero casts numéricos sobre columnas ahora STRING.
- ⚠️ Phase 3 (TicketsPago/TicketPagoEventos): 3 desviaciones del spec-letter (rowVersion removed vs VIRTUAL; TEXT vs STRING('max'); NOW vs sysutcdatetime) — todas funcionalmente equivalentes y documentadas en tasks, pero no cumplen el MUST literal del spec.
- ⚠️ Working tree contiene archivos fuera de scope (script.sql eliminado, carrilobo en config, AGENTS.md, skill-registry) que no deben atribuirse a este cambio.

## Next Recommended

**`fix`** (antes de archivar)

Acciones requeridas antes de `sdd-archive`:
1. **Reconciliar spec vs implementación para los modelos de tickets** (WARNING-1/2/3). Dos caminos:
   - (a) Alinear el código al spec: declarar `rowVersion` como `DataTypes.VIRTUAL`, cambiar TEXT→`STRING('max')`, cambiar `DataTypes.NOW`→`sequelize.fn('SYSUTCDATETIME')`; o
   - (b) Enmendar `specs/data-model/spec.md` para reflejar la decisión documentada en tasks (remover columna, TEXT, NOW) y registrar la justificación.
2. **Limpiar el working tree** (WARNING-4): stagear solo los 4 archivos de modelo para el commit de este cambio; separar `carrilobo`/`AGENTS.md`/eliminación de `script.sql` en commits propios.

Una vez reconciliado el spec y limpiado el working tree, el cambio está listo para `sdd-archive`.
