# Delta for Data Model

## ADDED Requirements

### Requirement: 18 New Debt-Domain Models

The system MUST provide Sequelize models for the 18 new debt-domain tables listed below, each with columns, types, and constraints transcribed verbatim from `script_creacion_bd_ElManzano_062026.sql`.

| # | Model | Table | Key Columns |
|---|-------|-------|-------------|
| 5 | `DatosGenerales` | `DatosGenerales` | `TasaInteres`, `TasaDescuento`, `IndiceFinal`, `FechaDesdeIntereses` |
| 6 | `Numeracion` | `Numeracion` | Ticket numbering reference |
| 7 | `CobrosCtaCte` | `CobrosCtaCte` | Payment rows (CodMovim D) |
| 8 | `ClientesCtaCteTransitoria` | `ClientesCtaCteTransitoria` | Transitory debt entries |
| 9 | `Devengamientos` | `Devengamientos` | Debt generation source |
| 10 | `Automotores` | `Automotores` | `dominio`, `ID_BIEN`, `Codigo` (FK to Cliente) |
| 11 | `Catastro` | `Catastro` | Property debts (TIPO_BIEN `CACA`) |
| 12 | `CIActividades` | `CIActividades` | Commerce/industry debts (TIPO_BIEN `CICI`) |
| 13 | `CementerioServicios` | `CementerioServicios` | Cemetery services (TIPO_BIEN `CEM1`) |
| 14 | `AguaClientes` | `AguaClientes` | Water client link (TIPO_BIEN `OBSA`) |
| 15 | `AguaServicios` | `AguaServicios` | Water service link (TIPO_BIEN `OBSA`) |
| 16 | `PavimentoClientes` | `PavimentoClientes` | Pavimento client link |
| 17 | `PavimentoServicios` | `PavimentoServicios` | Pavimento service link |
| 18 | `Medidores` | `Medidores` | Water meter context |
| 19 | `Feriados` | `Feriados` | Holiday dates for mora calculation |
| 20 | `PadronBase` | `PadronBase` | Padron backbone |
| 21 | `CTACTESUM` | `CTACTESUM` | Summarized current account |
| 22 | `Provincias` | `Provincias` | Referenced by `Cliente.Provincia` |

#### Scenario: All 18 models load without sync errors

- GIVEN the El Manzano database is reachable
- WHEN `npm run testDB` executes
- THEN all 22 models (4 existing + 18 new) sync without errors

#### Scenario: Model columns match SQL schema exactly

- GIVEN a model file in `models/`
- WHEN its column definitions are compared to `script_creacion_bd_ElManzano_062026.sql`
- THEN every column name, type, length, and constraint matches verbatim

### Requirement: Model Associations

The system MUST register explicit Sequelize associations in `models/model.index.js` for all new models that reference existing ones.

Required associations:
- `Automotores` → `Cliente` via `Codigo`
- `Catastro` → `Cliente`
- `CIActividades` → `Cliente`
- `AguaClientes` → `Cliente`
- `PavimentoClientes` → `Cliente`
- `Cliente` → `Provincias` via `Provincia`
- `ClientesCtaCte` → `Cliente`
- `CobrosCtaCte` → `Cliente`
- `ClientesCtaCteTransitoria` → `Cliente`

#### Scenario: Associations resolve without circular dependency errors

- GIVEN `model.index.js` is loaded
- WHEN all associations are initialized
- THEN no circular dependency or missing model errors occur

#### Scenario: Existing queries unaffected by new associations

- GIVEN existing queries in `deudas.service.js` and `clientes.service.js`
- WHEN the new associations are registered
- THEN existing queries return identical results (no unintended joins)

### Requirement: DESC_INMUEBLE Guarded Constant

The system MUST expose `DESC_INMUEBLE` as a single named constant in `config/intereses.config.js`, defaulting to `1.0`, with a startup `console.warn` logged until the accountant provides the real value.

#### Scenario: Startup warning logged

- GIVEN `DESC_INMUEBLE` is still at its default `1.0`
- WHEN the application starts
- THEN a `console.warn` is emitted indicating the placeholder value

#### Scenario: Constant is easy to change

- GIVEN the accountant provides the real `descinmueble` value
- WHEN a developer updates `DESC_INMUEBLE` in `config/intereses.config.js`
- THEN no other file needs modification for the value to propagate

### Requirement: cuotabasica Mapping Marker

The system MUST document the `cuotabasica` → `TIPO_PLAN` (or equivalent) mapping decision in `ClientesCtaCte` with a review marker comment, noting the alternative and rationale.

#### Scenario: Mapping marker present in code

- GIVEN the `ClientesCtaCte` model or formula dispatcher
- WHEN a developer searches for `cuotabasica`
- THEN a clearly marked comment explains the mapping choice and flags it for future review

## MODIFIED Requirements

### Requirement: 22 Total Models Registered

The `models/model.index.js` MUST export all 22 debt-domain models (4 existing + 18 new) with their associations resolvable at load time.
(Previously: only 4 models existed — `Cliente`, `ClientesCtasCtes`, `TicketsPago`, `TicketPagoEventos`)

#### Scenario: model.index.js exports 22 models

- GIVEN `model.index.js` is required
- WHEN its exports are counted
- THEN exactly 22 model definitions are present

#### Scenario: All associations resolvable

- GIVEN all 22 models are registered
- WHEN association resolution is attempted
- THEN no "model not defined" errors occur

## REMOVED Requirements

None.

## RENAMED Requirements

None.
