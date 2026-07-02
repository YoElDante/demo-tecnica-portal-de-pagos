# Exploración: Alinear modelos Sequelize con script BD El Manzano 06/2026

## Estado Actual

El proyecto tiene **5 archivos de modelo Sequelize** (`Cliente.js`, `ClientesCtasCtes.js`, `TicketsPago.js`, `TicketPagoEventos.js`, `model.index.js`) que mapean **4 tablas** del esquema `dbo`. El script SQL `docs/bd/script_creacion_bd_ElManzano_062026.sql` define **112 tablas** en total. Existe una brecha masiva: 108 tablas SQL no tienen representación Sequelize, y los 4 modelos existentes tienen múltiples discrepancias de tipos, longitudes y constraints.

La arquitectura es multi-municipio: la BD es la misma para todos los municipios (configurada vía `DB_*` env vars), y los datos se diferencian por `municipio_id` (donde aplica) o por esquemas separados de cliente.

## Áreas Afectadas

- `models/Cliente.js` — Múltiples mismatches de tipo/longitud contra `dbo.Clientes` SQL
- `models/ClientesCtasCtes.js` — ~14 mismatches críticos de tipo (STRING↔INTEGER, money↔DECIMAL, etc.)
- `models/TicketsPago.js` — Mismatches menores (DATE vs datetime2, TEXT vs nvarchar(max))
- `models/TicketPagoEventos.js` — Mismatches menores (mismos que TicketsPago)
- `models/model.index.js` — Asociaciones existentes, posiblemente necesite expansión
- `config/database.config.js` — Configuración de conexión (no necesita cambios)
- `services/deudas.service.js` — Usa `ClientesCtaCte` directamente, hereda problemas del modelo
- `services/clientes.service.js` — Usa `Cliente` directamente

## Análisis Detallado

### 1. Resumen de tablas

| Métrica | Valor |
|---|---|
| Tablas en script SQL | 112 |
| Vistas en script SQL | 1 (`vw_TicketsPagoResumen`) |
| Modelos Sequelize existentes | 4 (mapean 4 tablas) |
| Tablas SQL sin modelo | **108** |
| Modelos con mismatches | **4 de 4** |

### 2. Tablas en SQL sin modelo (108)

**Portal de Pagos / Core:**
- `CTACTESUM` — Resumen de cuenta corriente (usado en deuda queries)
- `PadronBase` — Base de contribuyentes por ID_BIEN/TIPO_BIEN

**Catastro/Inmobiliario:**
- `Catastro`, `CatastroAnt`, `CatastroTemp`, `CATASTRO26`
- `PavimentoClientes`, `PavimentoServicios`

**Automotores:**
- `Automotores`, `AlicuotasAutos`, `CategoriasAutos`
- `MarcayModeloAutos`, `MarcayModeloAcara`, `MarcayModeloDNRPA`
- `ValuacionAutosAnoCip`

**Comercio e Industria:**
- `CIActividades`, `CIClientesActividades`, `Tipo_Actividad_IBrutos`

**Agua:**
- `AguaClientes`, `AguaServicios`, `Medidores`, `MedidoresCarga`, `MedidoresCategorias`, `MedidoresTarifa`

**Cementerio:**
- `CementerioClientes`, `CementerioServicios`

**Contabilidad/Financiero:**
- `Plancuentas2`, `PlanCuentas2026`, `PlanCuentasBase`, `PlanCuentasPGM`
- `LibrosContablesCuentas`, `LibrosSubDiarios`
- `Bancos`, `BancosChequeras`, `BancosLibros`, `BancosTiposCuentas`, `BancosTiposMovim`
- `CajaCtaCteCheques`, `TransitoriaDeCaja`
- `Devengamientos`, `SConceptos`, `SGen`, `SLiq`, `Srlc`, `Svc`
- `liquidaciones`, `TiposLiquidaciones`

**Proveedores:**
- `Proveedores`, `ProveedoresCtaCte`, `ProveedoresCanjeValores`, `ProveedoresCuentas`, `ProveedoresTipos`
- `ProveTransiCuentas`, `ProveTransiCuentasImp`

**RRHH/Sueldos:**
- `Personal`, `PersonalCtacte`, `SueldosCtaCte`, `SueldosLiquidacion`

**Stock:**
- `Stock`, `StockAjustePorInflacion`, `StockDepositos`, `StockDevolucion`, `StockMovimientos`
- `StockOCompra`, `StockOperaciones`, `StockPrecios`, `StockPrecioxArticulo`
- `StockRecepcion`, `StockRubros`, `StockSubRubros`, `StockTiposMovim`

**Varios:**
- `AccesoUsuarios`, `ActividadesUsuarios`
- `ClientesContactos`, `ClientesCtaCteTransitoria`
- `CobrosCtaCte`
- `DatosGenerales`, `Feriados`, `Provincias`
- `Expedientes`, `ExpedientesMovimientos`
- `MailServerConfiguracion`
- `MIGRACION`
- `Numeracion`
- `Pdfs`
- `Tarjetas`, `TarjetasCobros`, `TarjetasCtaCobros`, `TarjetasCtaCte`, `TarjetasPlanes`, `TarjetasPlanilla`
- `TipoIVA`, `TipoIVAxTasaIVA`, `TipoTasaIVA`
- `TipoMovim`
- `TipoRetenciones`, `TipoRetGanancia`, `TipoRetGananciaAux`
- `TiposDevoluciones`
- `RegimenGanancias`, `RegimenIVA`
- `ResumenBancoCordoba`, `ResumenBancoRio`
- `RetencionGanancias`, `RetencionIBrutos`, `RetencionIVA`
- `VentasTiposServicios`
- `aaapruebaliq` (tabla de prueba legacy)

### 3. Modelos existentes que NECESITAN actualizaciones

#### 3a. `TicketsPago` → `dbo.TicketsPago`

| Atributo Modelo | SQL | Problema |
|---|---|---|
| `rowVersion` BLOB allowNull:true | `timestamp NOT NULL` | `timestamp` SQL Server es `binary(8)` rowversion, no manejable como BLOB. Debería ser omitido de writes o `DataTypes.VIRTUAL` |
| `currencyCode` STRING(3) | `char(3)` | STRING → `nvarchar(3)`. Menor, pero inconsistente con el esquema SQL |
| `payloadSnapshot` TEXT | `nvarchar(max)` | `TEXT` está deprecated en SQL Server. Debería usar `STRING('max')` |
| Todos los `DATE` | `datetime2(0)` | Sequelize `DATE` mapea a `DATETIME`, no `datetime2(0)`. Funcionalmente igual por la precisión (0), pero no idéntico |
| `issuedAtUtc` | DEFAULT `sysutcdatetime()` | Modelo no declara `defaultValue`. El default se aplica a nivel BD, el modelo no lo conoce |
| `createdAtUtc` | DEFAULT `sysutcdatetime()` | Idem |
| `updatedAtUtc` | DEFAULT `sysutcdatetime()` | Idem |
| `retryCount` | DEFAULT `(0)` | Modelo no declara `defaultValue: 0` |
| `currencyCode` | DEFAULT `('ARS')` | Modelo no declara `defaultValue: 'ARS'` |

**CHECK constraints no reflectidas en modelo:**
- `CK_TicketsPago_status`: `'CREADO','PENDIENTE','APROBADO','RECHAZADO','EXPIRADO','CONCILIANDO'`
- `CK_TicketsPago_gateway_provider`: `'ARGENPAGO[...]','OTRO'`
- `CK_TicketsPago_reconciliation_source`: `NULL,'WEBHOOK_INMEDIATO','CONCILIACION','MANUAL'`
- `CK_TicketsPago_amount_total`: `> 0`
- `CK_TicketsPago_retain_until`: `retain_until_utc >= issued_at_utc`

#### 3b. `TicketPagoEventos` → `dbo.TicketPagoEventos`

| Atributo Modelo | SQL | Problema |
|---|---|---|
| `payloadJson` TEXT | `nvarchar(max)` | Mismo caso `TEXT` deprecated |
| `receivedAtUtc` DATE | `datetime2(0)` DEFAULT `sysutcdatetime()` | Mismo tipo DATE vs datetime2; falta default en modelo |

**CHECK constraints no reflectidas en modelo:**
- `CK_TicketPagoEventos_result`: `NULL,'APLICADO','DUPLICADO','IGNORADO','ERROR'`
- `CK_TicketPagoEventos_source`: `'PORTAL_MANUAL','GATEWAY_WEBHOOK','GATEWAY_CONCILIACION'`

#### 3c. `Cliente` → `dbo.Clientes` (MISMACHES CRÍTICOS)

| Atributo Modelo | SQL | Problema | Severidad |
|---|---|---|---|
| `DesHabilitado` INTEGER default 0 | `bit NOT NULL default 0` | **TIPO**: INTEGER vs bit | Media |
| `Ciudad` INTEGER | `varchar(30)` | **TIPO**: INTEGER vs varchar | **ALTA** — puede romper queries |
| `TipoIva` INTEGER default 0 | `char(1)` | **TIPO**: INTEGER vs char(1) | Media |
| `IvaDiferencial` INTEGER default 0 | `bit NOT NULL default 0` | **TIPO**: INTEGER vs bit | Media |
| `CodigoPostal` STRING(10) | `char(5)` | **LONGITUD** | Baja |
| `Telefono` STRING(20) | `varchar(30)` | **LONGITUD**: 20 vs 30 | Baja |
| `Fax` STRING(20) | `varchar(30)` | **LONGITUD**: 20 vs 30 | Baja |
| `Email` STRING(100) | `varchar(120)` | **LONGITUD**: 100 vs 120 | Baja |
| `Provincia` STRING(5) | `char(2)` | **LONGITUD**: 5 vs 2 | Baja |
| `TipoGanancia` STRING(10) | `char(1)` | **LONGITUD**: 10 vs 1 | Media |
| `Cuit` STRING(15) | `char(13)` | **LONGITUD**: 15 vs 13 | Baja |
| `IngBrutos` STRING(20) | `varchar(15)` | **LONGITUD**: 20 vs 15 | Baja |
| `Pais` STRING(50) | `varchar(25)` | **LONGITUD**: 50 vs 25 | Baja |
| `CodigoTipo` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `CondicionPago` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `Zona` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `QListaPrecios` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `QListaOferta` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `LLevaFlete` STRING(10) | `bit` | **TIPO**: STRING vs bit | **ALTA** |
| `Vendedor` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `PercepIBTucuman` STRING(20) | `bit` | **TIPO**: STRING vs bit | **ALTA** |
| `IDENTIFICADOR` STRING(20) allowNull:true | `varchar(6) NOT NULL` | **LONGITUD + NULL**: 20 vs 6, nullable vs NOT NULL | **ALTA** |
| `Apellido` STRING(50) | `varchar(100)` | **LONGITUD**: 50 vs 100 | Media (pierde datos) |
| `Nombre` STRING(50) | `varchar(100)` | **LONGITUD**: 50 vs 100 | Media (pierde datos) |
| `ID_COMERCIO_INDUSTRIA` STRING(20) allowNull:true | `varchar(6) NOT NULL` | **LONGITUD + NOT NULL** | **ALTA** |
| `DOCUMENTO` STRING(15) allowNull:true | `varchar(8) NOT NULL` | **LONGITUD + NOT NULL** | **ALTA** |
| `Posedor` STRING(20) | `varchar(100)` | **LONGITUD**: 20 vs 100 | Media |
| `DirNumero` STRING(10) | `char(6)` | **LONGITUD**: 10 vs 6 | Baja |
| `MaxLimCred` DECIMAL(15,2) | `money` | **TIPO**: DECIMAL vs money | Media |
| `DescuentoGeneral` DECIMAL(5,2) | `smallmoney` | **TIPO**: DECIMAL vs smallmoney | Media |
| `PorcentajePercepIBTucuman` DECIMAL(5,2) | `smallmoney` | **TIPO**: DECIMAL vs smallmoney | Media |
| `FechaAlta` DATE | `smalldatetime` | **PRECISIÓN**: minutos vs días | Baja |
| `FechaUltmod` DATE | `smalldatetime` | **PRECISIÓN**: minutos vs días | Baja |
| `Observaciones` TEXT | `varchar(200)` | **TIPO**: TEXT(MAX) vs varchar(200) | Media |
| **FALTA** `Deshabilita` | `varchar(20)` | **COLUMNA AUSENTE** en modelo | Media |

#### 3d. `ClientesCtaCte` → `dbo.ClientesCtaCte` (MISMACHES GRAVES)

| Atributo Modelo | SQL | Problema | Severidad |
|---|---|---|---|
| `Fecha` DATE | `smalldatetime` | **PRECISIÓN** | Baja |
| `CodMovim` STRING(10) | `char(1)` | **LONGITUD**: 10 vs 1 | Media |
| `Detalle` STRING(200) | `varchar(30)` | **LONGITUD**: 200 vs 30 | Media |
| `Letra` STRING(5) | `char(1)` | **LONGITUD**: 5 vs 1 | Baja |
| `Id` STRING(20) | `char(4)` | **LONGITUD**: 20 vs 4 | Baja |
| `Importe` DECIMAL(15,2) | `money` | **TIPO** | Media |
| `Saldo` DECIMAL(15,2) | `money` | **TIPO** | Media |
| `TipoMovim` STRING(10) | `char(2)` | **LONGITUD**: 10 vs 2 | Baja |
| `TipoFPago` STRING(20) | `char(3)` | **LONGITUD**: 20 vs 3 | Baja |
| `FechaVto` DATE | `smalldatetime` | **PRECISIÓN** | Baja |
| `Operacion` STRING(50) | `money` | **TIPO GRAVE**: STRING vs money | **CRÍTICO** |
| `NroRenglonAsiento` INTEGER | `smallint` | **TIPO** | Baja |
| `EsPago` INTEGER | `bit` | **TIPO** | Media |
| `EsDocumento` INTEGER | `bit` | **TIPO** | Media |
| `DiasPromedio` INTEGER | `smallmoney` | **TIPO GRAVE**: INTEGER vs smallmoney | **ALTA** |
| `PromedioReal` DECIMAL(15,2) | `smallmoney` | **TIPO** | Media |
| `IDENTIFICADOR` STRING(50) | `varchar(6)` | **LONGITUD**: 50 vs 6 | Media |
| `NRO_INTERNO` INTEGER | `varchar(10)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `ID_BIEN` INTEGER | `varchar(6)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `TIPO_BIEN` STRING(20) | `varchar(4)` | **LONGITUD**: 20 vs 4 | Media |
| `TIPO_PLAN` INTEGER | `varchar(2)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `TIPO_CUOTA` INTEGER | `varchar(2)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `ANO_CUOTA` INTEGER | `varchar(4)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `NRO_CUOTA` INTEGER | `varchar(3)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `ESTADO_DEUDA` STRING(20) | `varchar(2)` | **LONGITUD**: 20 vs 2 | Media |
| `NRO_OPERACION` STRING(50) | `varchar(10)` | **LONGITUD**: 50 vs 10 | Media |
| `Categoria` STRING(50) | `varchar(3)` | **LONGITUD**: 50 vs 3 | Media |
| `NRO_TALONARIO` STRING(50) | `varchar(8)` | **LONGITUD**: 50 vs 8 | Media |
| `NUMERO` STRING(50) | `varchar(10)` | **LONGITUD**: 50 vs 10 | Media |
| `NRO_RECIBO` STRING(50) | `varchar(15)` | **LONGITUD**: 50 vs 15 | Media |
| `CuentaContableAC` STRING(20) | `varchar(4)` | **LONGITUD**: 20 vs 4 | Baja |
| `CuentaContableV` STRING(20) | `varchar(4)` | **LONGITUD**: 20 vs 4 | Baja |
| `TablaLiq` INTEGER | `varchar(100)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `NumeroPago` INTEGER | `varchar(10)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `Dominio` STRING(20) | `varchar(12)` | **LONGITUD**: 20 vs 12 | Baja |
| `ACTUALIZACION_COBRADO` DECIMAL(15,2) | `money` | **TIPO** | Media |
| `NumeroPagoTmp` INTEGER | `varchar(10)` | **TIPO GRAVE**: INTEGER vs varchar | **CRÍTICO** |
| `Observaciones` TEXT | `nvarchar(100)` | **TIPO**: TEXT(MAX) vs nvarchar(100) | Media |
| `Ejercicio` STRING(10) | `varchar(6)` | **LONGITUD** | Baja |
| `RecIntereses` DECIMAL(15,2) | `money` | **TIPO** | Media |
| `MOF` DECIMAL(15,2) | `varchar(3)` | **TIPO GRAVE**: DECIMAL vs varchar | **CRÍTICO** |
| `LOF` DECIMAL(15,2) | `varchar(3)` | **TIPO GRAVE**: DECIMAL vs varchar | **CRÍTICO** |
| **FALTA** `Usuario` | `varchar(24)` | **COLUMNA AUSENTE** | Baja |
| **FALTA** `CoeficienteCuota` | `money` | **COLUMNA AUSENTE** | Baja |
| `FechaPago` DATE | `datetime` | **PRECISIÓN** | Baja |
| `FechaP` DATE | `datetime` | **PRECISIÓN** | Baja |
| `FECHA_ACTUALIZACION_DEUDA` DATE | `datetime` | **PRECISIÓN** | Baja |

### 4. Modelos que NO están en el script SQL (solo flag)

NINGUNO. Todos los modelos actuales tienen una tabla correspondiente en el script SQL de El Manzano.

### 5. Vistas

- `vw_TicketsPagoResumen` — Vista sobre TicketsPago, no tiene modelo Sequelize. Útil para reportes rápidos.

### 6. Relaciones y Constraints Detectados

**Foreign Key:**
- `TicketPagoEventos.ticket_id` → `TicketsPago.ticket_id` (ON DELETE NO ACTION) — YA implementada en `model.index.js`

**Check Constraints en BD (no validadas en modelos):**
- TicketsPago: 5 CHECK constraints (status, gateway_provider, reconciliation_source, amount_total, retain_until)
- TicketPagoEventos: 2 CHECK constraints (result, source)

**Defaults en BD (no en modelos):**
- TicketsPago: 4 defaults (issued_at_utc, currency_code, retry_count, created_at_utc, updated_at_utc)
- TicketPagoEventos: 1 default (received_at_utc)

## Riesgos

1. **CRÍTICO — `ClientesCtaCte` tiene ~14 mismatches de tipo grave**: columnas definidas como `varchar` en SQL pero como `INTEGER`/`DECIMAL` en el modelo (NRO_INTERNO, ID_BIEN, TIPO_PLAN, ANO_CUOTA, NRO_CUOTA, TablaLiq, NumeroPago, NumeroPagoTmp, MOF, LOF, Operacion). Sequelize puede lanzar errores de cast en tiempo de ejecución.

2. **CRÍTICO — `Cliente` tiene 7 mismatches de tipo**: `bit` vs `INTEGER`/`STRING`, y `varchar` vs `INTEGER` (Ciudad). También 3 columnas NOT NULL en SQL que son allowNull:true en el modelo (IDENTIFICADOR, ID_COMERCIO_INDUSTRIA, DOCUMENTO).

3. **Las columnas `Nombre` y `Apellido` en Cliente modelo son STRING(50) pero SQL es varchar(100)**: si algún registro tiene >50 caracteres, Sequelize truncará silenciosamente.

4. **`row_version` (timestamp) en TicketsPago**: el modelo la declara como BLOB. SQL Server `timestamp` es `binary(8)` y se actualiza automáticamente. El modelo debería tratarla como read-only o VIRTUAL.

5. **Multi-municipio**: la tabla `Clientes` y `ClientesCtaCte` parecen compartidas entre municipios (sin `municipio_id`). `TicketsPago` sí tiene `municipio_id`. Cualquier nuevo modelo para tablas compartidas debe considerar si necesita filtro por municipio.

6. **User-Defined Types en SQL**: `[dbo].[Cliente]`, `[dbo].[Sucursal]`, `[dbo].[CuentasContables]`, `[dbo].[TasaIVA]` son tipos definidos por el usuario en SQL Server (alias types). Sequelize no puede mapearlos directamente; hay que usar el tipo base (varchar/nvarchar).

7. **108 tablas sin modelo**: el script completo es para un ERP municipal completo. No todas las tablas necesitan modelo Sequelize para el portal de pagos. Hay que priorizar solo las que el portal necesita consultar.

## Enfoques

### 1. Enfoque Quirúrgico (recomendado)
Corregir solo los modelos existentes que usa el portal (`Cliente`, `ClientesCtaCte`, `TicketsPago`, `TicketPagoEventos`) alineándolos exactamente con el SQL de El Manzano.

**Pros:**
- Bajo esfuerzo, impacto controlado
- Solo se toca lo que el portal realmente usa
- Fácil de verificar

**Contras:**
- No cubre tablas que podrían necesitarse en el futuro
- La vista `vw_TicketsPagoResumen` quedaría sin modelo

**Esfuerzo:** Medio

### 2. Enfoque Mínimo + Vistas
Igual que el quirúrgico, pero además agrega un modelo para `vw_TicketsPagoResumen` y para las tablas de catastro de deuda que consulta el frontend (`CTACTESUM`, `PadronBase`).

**Pros:**
- Cubre necesidades actuales e inmediatas del portal
- Las tablas de deuda son consultadas indirectamente vía queries raw

**Contras:**
- Esfuerzo medio-alto para identificar exactamente qué tablas adicionales necesita el frontend

**Esfuerzo:** Medio

### 3. Enfoque Full
Crear modelos Sequelize para todas las 112 tablas.

**Pros:**
- Cobertura completa
- Consistencia total

**Contras:**
- Esfuerzo masivo e injustificado
- Muchas tablas de contabilidad/stock/RRHH no tienen sentido en el portal de pagos
- Riesgo de errores por la complejidad

**Esfuerzo:** Muy Alto (no recomendado)

## Recomendación

**Enfoque 1 (Quirúrgico)** — Corregir los 4 modelos existentes. Los mismatches en `ClientesCtaCte` son GRAVES y pueden estar causando errores silenciosos de truncamiento o cast en producción. Además, agregar la columna faltante `Deshabilita` en Cliente y `Usuario`/`CoeficienteCuota` en ClientesCtaCte.

Agregar validación de CHECK constraints vía hooks/validate en Sequelize donde tenga sentido (status, gateway_provider, process_result).

Las tablas adicionales (108) NO deben modelarse a menos que el portal las consulte directamente. Si se necesitan en el futuro, se agregan bajo demanda.

Vista `vw_TicketsPagoResumen`: útil para reportes, se puede modelar como read-only si es necesario.

## Ready for Proposal

Sí — el orchestrator debe iniciar la fase **propose** para el cambio `align-sequelize-manzano-062026`. Los hallazgos son claros y hay suficiente información para definir el alcance de las correcciones. La prioridad debe estar en los mismatches críticos de `ClientesCtaCte` y `Cliente`.
