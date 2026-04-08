# Spec - Soporte Multi-Municipio

## Objetivo

Garantizar que el portal soporte multiples municipios con un unico codigo base y configuracion externa.

## Requisitos

### Requirement: Seleccion por entorno
El sistema MUST determinar el municipio activo exclusivamente mediante variables de entorno y configuracion centralizada.

#### Scenario: Municipio activo por variable `MUNICIPIO`
- **GIVEN** una instancia del portal con entorno configurado
- **WHEN** cambia el valor de `MUNICIPIO`
- **THEN** el portal carga branding, datos publicos y configuracion del municipio correspondiente sin tocar codigo de dominio

### Requirement: Configuracion desacoplada
La configuracion sensible y la configuracion publica MUST estar separadas.

#### Scenario: Credenciales fuera del codigo
- **GIVEN** una configuracion de base de datos por municipio
- **WHEN** el portal arranca
- **THEN** las credenciales se leen desde variables de entorno y no desde archivos versionados

### Requirement: Onboarding repetible
Agregar un municipio nuevo MUST seguir una secuencia documentada y repetible.

#### Scenario: Alta de nuevo municipio
- **GIVEN** un municipio nuevo
- **WHEN** se realiza el onboarding
- **THEN** se crean archivos de configuracion, imagenes, entorno y script de desarrollo sin duplicar el proyecto

## Fuentes

- `README.md`
- `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md`
- `docs/GUIA_NUEVO_MUNICIPIO.md`