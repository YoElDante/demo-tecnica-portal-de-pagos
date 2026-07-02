# Tasks: Align Sequelize Models with El Manzano SQL Schema (06/2026)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-200 (additions + deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | N/A |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: N/A
400-line budget risk: Low

## Phase 1: ClientesCtaCte Model Alignment (CRITICAL)

- [x] 1.1 Fix INTEGER→STRING columns: change `NRO_INTERNO` to STRING(10), `ID_BIEN` to STRING(6), `TIPO_PLAN` to STRING(2), `TIPO_CUOTA` to STRING(2), `ANO_CUOTA` to STRING(4), `NRO_CUOTA` to STRING(3), `TablaLiq` to STRING(100), `NumeroPago` to STRING(10), `NumeroPagoTmp` to STRING(10) in `models/ClientesCtasCtes.js` (~18 lines)
- [x] 1.2 Fix type mismatches: `Operacion` STRING(50)→DECIMAL(15,2), `MOF` DECIMAL→STRING(3), `LOF` DECIMAL→STRING(3), `EsPago` INTEGER→BOOLEAN, `EsDocumento` INTEGER→BOOLEAN, `DiasPromedio` INTEGER→DECIMAL(15,2), `Observaciones` TEXT→STRING(100) in `models/ClientesCtasCtes.js` (~14 lines)
- [x] 1.3 Fix string lengths: `CodMovim`→STRING(1), `Detalle`→STRING(30), `Letra`→STRING(1), `Id`→STRING(4), `TipoMovim`→STRING(2), `TipoFPago`→STRING(3), `TIPO_BIEN`→STRING(4), `ESTADO_DEUDA`→STRING(2), `NRO_OPERACION`→STRING(10), `Categoria`→STRING(3), `NRO_TALONARIO`→STRING(8), `NUMERO`→STRING(10), `NRO_RECIBO`→STRING(15), `CuentaContableAC`→STRING(4), `CuentaContableV`→STRING(4), `Dominio`→STRING(12), `IDENTIFICADOR`→STRING(6), `Ejercicio`→STRING(6) in `models/ClientesCtasCtes.js` (~36 lines)
- [x] 1.4 Add missing columns: `Usuario` STRING(24) allowNull:true, `CoeficienteCuota` DECIMAL(15,2) allowNull:true in `models/ClientesCtasCtes.js` (~8 lines)
- [x] 1.5 Verify: run `npm run testDB` to confirm model loads without errors against Azure SQL

## Phase 2: Cliente Model Alignment

- [x] 2.1 Fix type mismatches: `DesHabilitado` INTEGER→BOOLEAN (defaultValue:false), `Ciudad` INTEGER→STRING(30), `TipoIva` INTEGER→STRING(1), `IvaDiferencial` INTEGER→BOOLEAN (defaultValue:false), `LLevaFlete` STRING(10)→BOOLEAN, `PercepIBTucuman` STRING(20)→BOOLEAN, `Observaciones` TEXT→STRING(200) in `models/Cliente.js` (~14 lines)
- [x] 2.2 Fix NOT NULL + lengths: `IDENTIFICADOR`→STRING(6) allowNull:false, `DOCUMENTO`→STRING(8) allowNull:false, `ID_COMERCIO_INDUSTRIA`→STRING(6) allowNull:false, `Nombre`→STRING(100), `Apellido`→STRING(100), `Posedor`→STRING(100) in `models/Cliente.js` (~12 lines)
- [x] 2.3 Fix remaining lengths: `CodigoPostal`→STRING(5), `Telefono`→STRING(30), `Fax`→STRING(30), `Email`→STRING(120), `Provincia`→STRING(2), `TipoGanancia`→STRING(1), `Cuit`→STRING(13), `IngBrutos`→STRING(15), `Pais`→STRING(25), `CodigoTipo`→STRING(3), `CondicionPago`→STRING(3), `Zona`→STRING(3), `QListaPrecios`→STRING(3), `QListaOferta`→STRING(3), `Vendedor`→STRING(3), `DirNumero`→STRING(6) in `models/Cliente.js` (~32 lines)
- [x] 2.4 Add missing column: `Deshabilita` STRING(20) allowNull:true in `models/Cliente.js` (~4 lines)
- [x] 2.5 Verify: run `npm run testDB` to confirm model loads without errors

## Phase 3: TicketsPago + TicketPagoEventos Alignment

- [x] 3.1 Fix `models/TicketsPago.js`: `rowVersion` removido (auto-managed por SQL Server), `payloadSnapshot` mantenido como TEXT (mapping correcto para nvarchar(max)), add `defaultValue` para `currencyCode`('ARS'), `retryCount`(0), `issuedAtUtc`/`createdAtUtc`/`updatedAtUtc`(DataTypes.NOW) (~15 lines)
- [x] 3.2 Fix `models/TicketPagoEventos.js`: `payloadJson` mantenido como TEXT (mapping correcto para nvarchar(max)), add `defaultValue: DataTypes.NOW` para `receivedAtUtc` (~5 lines)
- [x] 3.3 Verify: run `npm run testDB` to confirm both models load without errors

## Phase 4: Service Compatibility

- [x] 4.1 Audit `services/deudas.service.js`: verificado — no hay parseInt/parseFloat sobre columnas ahora STRING. `formatearDeuda()` usa `|| ''` y concatenación de strings, compatible. `Number(deuda.Importe)` no afectado (Importe sigue DECIMAL). Sin cambios necesarios.
- [x] 4.2 Audit `services/clientes.service.js`: verificado — `buscarPorDni()` usa comparación de strings, compatible con STRING(8). Sin uso de `DesHabilitado`, `LLevaFlete`, ni `PercepIBTucuman` en el servicio. Concatenaciones con Nombre/Apellido (STRING(100)) intactas. Sin cambios necesarios.
- [x] 4.3 Verify: audit de código completo — cero cambios requeridos en services.

## Phase 5: Final Verification

- [x] 5.1 Run `npm run testDB` — ✅ Conexión OK, modelos cargan sin errores
- [x] 5.2 Audit de código: verificado que `deudas.service.js`, `clientes.service.js`, `pagos.service.js`, `ticket.service.js` y frontend `deudas.js` son compatibles con los nuevos tipos
- [x] 5.3 Diff confirmado: 4 modelos alineados, 192 inserciones, 151 eliminaciones, testDB OK
