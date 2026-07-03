# Delta for Multi-Municipio

## ADDED Requirements

### Requirement: Per-Municipio Formula Configuration

The system MUST support `descinmueble`, `tasaInteresAnual`, `tasadescuento`, and other formula parameters as per-municipio configuration values, not hard-coded to El Manzano. Each municipality config file (`config/municipalidad.config.{municipio}.js`) MAY define these keys.

#### Scenario: El Manzano config includes formula keys

- GIVEN `config/municipalidad.config.elmanzano.js`
- WHEN loaded
- THEN it exposes `descinmueble`, `tasaInteresAnual`, and `tasadescuento` keys

#### Scenario: Other municipalities unaffected

- GIVEN a municipality other than El Manzano
- WHEN its config file is loaded
- THEN formula keys are optional and do not break the application if absent

### Requirement: DESC_INMUEBLE Per-Municipio Override

The system MUST allow `DESC_INMUEBLE` to be overridden per municipality via config, with the guarded constant `1.0` default applying only when no per-municipio value exists.

#### Scenario: Municipality overrides DESC_INMUEBLE

- GIVEN `config/municipalidad.config.elmanzano.js` sets `descinmueble = 1.25`
- WHEN the interest config resolves the value
- THEN `1.25` is used instead of the default `1.0`

#### Scenario: Default applies when no per-municipio value

- GIVEN a municipality config without `descinmueble`
- WHEN the interest config resolves the value
- THEN the default `1.0` is used with a startup warning

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## RENAMED Requirements

None.
