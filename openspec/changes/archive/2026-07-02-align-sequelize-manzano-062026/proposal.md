# Proposal: Alinear modelos Sequelize con script BD El Manzano 06/2026

## Intent

Los 4 modelos Sequelize (`Cliente`, `ClientesCtaCte`, `TicketsPago`, `TicketPagoEventos`) discrepan del script `docs/bd/script_creacion_bd_ElManzano_062026.sql`: ~14 mismatches graves en `ClientesCtaCte` (varchar modelado como INTEGER/DECIMAL), 7 en `Cliente`, y menores en los dos de tickets. Provoca casts silenciosos, truncamiento de datos y errores en runtime. Se alinean los modelos al esquema real sin alterar comportamiento funcional.

## Scope

### In Scope
- Corregir tipos/longitudes/nullabilidad de los 4 modelos vs SQL (detalle exhaustivo en `explore.md` §3)
- `ClientesCtaCte`: 14 fixes críticos (NRO_INTERNO, ID_BIEN, TIPO_PLAN, TIPO_CUOTA, ANO_CUOTA, NRO_CUOTA, TablaLiq, NumeroPago, NumeroPagoTmp, MOF, LOF → STRING; Operacion → money) + columnas `Usuario`, `CoeficienteCuota`
- `Cliente`: Ciudad→STRING, LLevaFlete/PercepIBTucuman→BOOLEAN, 3 NOT NULL, `Deshabilita`, Nombre/Apellido→100
- `TicketsPago`: rowVersion→VIRTUAL read-only, TEXT→STRING('max'), defaults
- `TicketPagoEventos`: TEXT/DATE + default
- Verificar `deudas.service.js` y `clientes.service.js` tras los cambios de tipo

### Out of Scope
- Modelar las **108 tablas** SQL sin uso en el portal
- Modelar la vista `vw_TicketsPagoResumen`
- Reflejar CHECK constraints en modelos (se evalúa en spec/design)
- Nuevas features o queries

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — alineación de modelo de datos (implementación), no cambio de requisitos de comportamiento. `ticket-lifecycle`, `interest-calculation`, `payment-gateway-contract` describen comportamiento que no cambia. Si spec/design decide que reflejar CHECK constraints/defaults merece delta, lo decide esa fase.

## Approach

Enfoque **quirúrgico**, prioridad por severidad: `ClientesCtaCte` → `Cliente` → `TicketsPago` → `TicketPagoEventos`. Tipo por tipo contra el SQL. Mapeos: `money`/`smallmoney`→`DECIMAL(15,2)`, `bit`→`BOOLEAN`, `datetime2(0)`/`smalldatetime`→`DATE`, `nvarchar(max)`→`STRING('max')`. Se preservan asociaciones en `model.index.js`. Commit atómico por modelo. Los 4 modelos actuales SÍ existen en el SQL (explore §4): no hay modelos a flaggear ni eliminar.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `models/ClientesCtasCtes.js` | Modified | 14 fixes tipo + 2 columnas nuevas |
| `models/Cliente.js` | Modified | 7 fixes + 1 columna + longitudes |
| `models/TicketsPago.js` | Modified | rowVersion, TEXT, defaults |
| `models/TicketPagoEventos.js` | Modified | TEXT, DATE, default |
| `models/model.index.js` | Modified | Revisar asociaciones (sin nuevas) |
| `services/deudas.service.js` | Verified | Ajustar casts numéricos heredados |
| `services/clientes.service.js` | Verified | Ajustar casts heredados |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Servicios con casts numéricos sobre columnas ahora STRING rompen | Med | Auditar services; fixear en mismo cambio |
| Nullability más estricta rechaza inserts con null | Baja | Validar contra datos reales en demo |
| Multi-municipio: tablas compartidas sin `municipio_id` | Baja | Solo tipos; sin nuevos filtros |

## Rollback Plan

`git revert` del commit por modelo. Cambios solo en modelos (sin migraciones de BD, sin datos) → rollback inmediato y sin pérdida. Commit atómico por modelo permite revertir uno solo si falla.

## Dependencies

Ninguna externa. Internas: `deudas.service.js`, `clientes.service.js` (en scope).

## Success Criteria

- [ ] 4 modelos coinciden con SQL en tipo/longitud/nullabilidad (diff columna por columna)
- [ ] `npm run testDB` pasa
- [ ] Smoke demo: búsqueda por DNI + flujo ticket→gateway OK
- [ ] No se eliminan modelos; no se modelan las 108 tablas
- [ ] `deudas.service.js` y `clientes.service.js` operan sin errores tras los fixes

## Proposal question round

1. **Backwards-compat en casts**: columnas INTEGER→STRING (NRO_CUOTA, NRO_INTERNO, etc.) pueden romper `deudas.service.js` si las trata como números. ¿Getters defensivos transitorios o romper+fixear el service aquí? → *Asunción: romper+fixear (mantiene honestidad del modelo).*
2. **`money` mapping**: Sequelize no tiene `money` nativo. ¿`DECIMAL(15,2)` o `DECIMAL(19,4)` para coincidir con money de SQL Server? → *Asunción: `DECIMAL(15,2)` por consistencia con el modelo actual.*
3. **CHECK constraints**: ¿reflejarlos como validaciones Sequelize ahora o diferir a cambio separado? → *Asunción: diferir; este cambio es solo alineación de tipos.*
