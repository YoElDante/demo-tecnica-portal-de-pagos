# Delta for Data Model

## ADDED Requirements

### Requirement: Missing columns in ClientesCtaCte

The model MUST include columns `Usuario` (VARCHAR(24)) and `CoeficienteCuota` (DECIMAL(15,2)) as defined in the SQL schema.

#### Scenario: Usuario column available for queries

- GIVEN the ClientesCtaCte model is loaded
- WHEN a query accesses the `Usuario` attribute
- THEN the value maps to SQL column `Usuario` VARCHAR(24)

#### Scenario: CoeficienteCuota column available for queries

- GIVEN the ClientesCtaCte model is loaded
- WHEN a query accesses the `CoeficienteCuota` attribute
- THEN the value maps to SQL column `CoeficienteCuota` as DECIMAL(15,2)

### Requirement: Missing column in Cliente

The model MUST include column `Deshabilita` (VARCHAR(20)) as defined in the SQL schema.

#### Scenario: Deshabilita column available for queries

- GIVEN the Cliente model is loaded
- WHEN a query accesses the `Deshabilita` attribute
- THEN the value maps to SQL column `Deshabilita` VARCHAR(20)

### Requirement: Default values in TicketsPago and TicketPagoEventos

The model MUST declare `defaultValue` for columns that have SQL DEFAULT constraints: `issuedAtUtc`, `createdAtUtc`, `updatedAtUtc` (sysutcdatetime), `retryCount` (0), `currencyCode` ('ARS') in TicketsPago; `receivedAtUtc` (sysutcdatetime) in TicketPagoEventos.

#### Scenario: New ticket inherits defaults

- GIVEN a new TicketsPago record is created without explicit values
- WHEN the record is saved
- THEN `currencyCode` defaults to 'ARS', `retryCount` to 0, and timestamp fields to current UTC

## MODIFIED Requirements

### Requirement: ClientesCtaCte column types match SQL schema

The ClientesCtaCte model MUST use correct Sequelize types for all columns per `script_creacion_bd_ElManzano_062026.sql`. Critical corrections: `NRO_INTERNO`, `ID_BIEN`, `TIPO_PLAN`, `TIPO_CUOTA`, `ANO_CUOTA`, `NRO_CUOTA`, `TablaLiq`, `NumeroPago`, `NumeroPagoTmp` → STRING with SQL lengths; `Operacion` → DECIMAL(15,2); `MOF`, `LOF` → STRING(3); `EsPago`, `EsDocumento` → BOOLEAN; `DiasPromedio` → DECIMAL(15,2); `NroRenglonAsiento` → INTEGER(smallint).
(Previously: ~14 columns had wrong types — INTEGER/DECIMAL where SQL defines VARCHAR, STRING where SQL defines money/bit)

#### Scenario: String-coded identifiers query correctly

- GIVEN a ClientesCtaCte record with `NRO_INTERNO` = '12345' and `ID_BIEN` = 'ABC123'
- WHEN the model reads the record
- THEN both values are returned as strings without cast errors

#### Scenario: Monetary columns map correctly

- GIVEN a ClientesCtaCte record with `Operacion` = 1500.50 (SQL money)
- WHEN the model reads the record
- THEN the value is returned as DECIMAL(15,2) without truncation

#### Scenario: Boolean flags map correctly

- GIVEN a ClientesCtaCte record with `EsPago` = 1 (SQL bit)
- WHEN the model reads the record
- THEN the value is returned as boolean true

### Requirement: Cliente column types and lengths match SQL schema

The Cliente model MUST correct type mismatches: `DesHabilitado`, `IvaDiferencial` → BOOLEAN; `Ciudad` → STRING(30); `LLevaFlete`, `PercepIBTucuman` → BOOLEAN; `TipoIva` → STRING(1); `Observaciones` → STRING(200). Length corrections: `Nombre`, `Apellido` → STRING(100); `IDENTIFICADOR` → STRING(6) NOT NULL; `DOCUMENTO` → STRING(8) NOT NULL; `ID_COMERCIO_INDUSTRIA` → STRING(6) NOT NULL; plus 12+ other length adjustments per SQL.
(Previously: INTEGER used where SQL defines bit/varchar, STRING lengths exceeded SQL limits causing silent truncation)

#### Scenario: Boolean fields serialize correctly

- GIVEN a Cliente record with `DesHabilitado` = 1 (SQL bit)
- WHEN the model reads the record
- THEN the value is returned as boolean true

#### Scenario: Name fields accept full SQL length

- GIVEN a Cliente record with `Nombre` = 90 characters
- WHEN the model reads the record
- THEN the full name is returned without truncation (previously capped at 50)

#### Scenario: NOT NULL columns reject null inserts

- GIVEN the Cliente model with `DOCUMENTO` marked NOT NULL
- WHEN an insert attempts null for `DOCUMENTO`
- THEN Sequelize rejects the insert before reaching the database

### Requirement: TicketsPago rowVersion and TEXT columns

The TicketsPago model MUST treat `rowVersion` as VIRTUAL (read-only, not written) since SQL `timestamp` is auto-managed binary(8). `payloadSnapshot` MUST use STRING('max') instead of deprecated TEXT.
(Previously: rowVersion declared as BLOB with allowNull:true, payloadSnapshot as TEXT)

#### Scenario: rowVersion not included in inserts

- GIVEN a new TicketsPago record is created
- WHEN the record is saved
- THEN `rowVersion` is NOT included in the INSERT statement

#### Scenario: rowVersion read after update

- GIVEN an existing TicketsPago record is updated
- WHEN the record is re-read
- THEN `rowVersion` contains the updated binary(8) value from SQL Server

### Requirement: TicketPagoEventos TEXT and default columns

The TicketPagoEventos model MUST use STRING('max') for `payloadJson` instead of deprecated TEXT. `receivedAtUtc` MUST declare `defaultValue: Sequelize.fn('sysutcdatetime')`.
(Previously: payloadSnapshot as TEXT, no default for receivedAtUtc)

#### Scenario: Large payload stored correctly

- GIVEN a TicketPagoEventos record with a 50KB JSON payload
- WHEN the record is saved
- THEN the full payload is stored without truncation

### Requirement: Service compatibility after type changes

Services consuming corrected models (`deudas.service.js`, `clientes.service.js`) MUST operate without numeric casts on columns now typed as STRING, and MUST handle boolean returns from columns previously INTEGER/STRING.
(Previously: services applied parseInt/parseFloat on columns the model now returns as strings)

#### Scenario: Debt query works with string identifiers

- GIVEN `deudas.service.js` queries ClientesCtaCte by `NRO_INTERNO`
- WHEN the query executes against the corrected model
- THEN the comparison uses string matching and returns correct results

#### Scenario: Client lookup works with boolean flags

- GIVEN `clientes.service.js` filters by `DesHabilitado`
- WHEN the query executes against the corrected model
- THEN the filter uses boolean true/false instead of integer 0/1

## REMOVED Requirements

None — no behavioral requirements are removed. This change corrects model definitions to match existing SQL schema.

## RENAMED Requirements

None — no requirements are renamed.
