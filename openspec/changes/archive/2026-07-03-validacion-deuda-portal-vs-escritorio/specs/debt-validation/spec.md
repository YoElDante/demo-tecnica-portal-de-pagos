# Debt Validation Specification

## Purpose

Automated validation script that compares portal debt calculation output against desktop software reference data (CSV test files). Ensures parity between portal and escritorio behavior for interest and total calculations.

## Requirements

### Requirement: CSV test data ingestion

The validation script MUST read CSV test files from `docs/pruebas_documentos_a_comparar/`. Each CSV contains reference debt records exported from the desktop software with columns for DNI, Saldo, Interes, Total, TIPO_BIEN, and calculation metadata.

#### Scenario: Load single CSV file

- GIVEN a valid CSV file exists in `docs/pruebas_documentos_a_comparar/`
- WHEN the validation script runs
- THEN it parses all rows and extracts DNI, Saldo, Interes, Total, and TIPO_BIEN
- AND reports the number of test cases loaded

#### Scenario: Handle missing CSV directory

- GIVEN the `docs/pruebas_documentos_a_comparar/` directory does not exist
- WHEN the validation script runs
- THEN it exits with a clear error message indicating the missing directory

### Requirement: Portal debt query per taxpayer

The validation script MUST query the portal debt service directly (not via HTTP) for each DNI found in the CSV test files, retrieving calculated Saldo, Interes, and Total values.

#### Scenario: Query portal for each DNI

- GIVEN a CSV with 5 taxpayer DNI values
- WHEN the validation script processes each DNI
- THEN it calls the portal debt calculation service
- AND collects the portal's Saldo, Interes, and Total for each

#### Scenario: Skip AUAU records

- GIVEN a CSV row with `TIPO_BIEN = 'AUAU'`
- WHEN the validation script processes that row
- THEN it skips the row and logs it as excluded
- AND does not query the portal for that record

### Requirement: Row-by-row comparison with tolerance

The validation script MUST compare each CSV reference value against the portal's calculated value for Saldo, Interes, and Total. The comparison MUST use a tolerance of +-0.1 for floating-point rounding differences.

#### Scenario: Values within tolerance pass

- GIVEN CSV Saldo=1500.00, Interes=45.50, Total=1545.50
- AND portal Saldo=1500.05, Interes=45.45, Total=1545.50
- WHEN the validation script compares
- THEN all three fields pass (differences <= 0.1)

#### Scenario: Values outside tolerance fail

- GIVEN CSV Total=1545.50
- AND portal Total=1546.00
- WHEN the validation script compares
- THEN Total fails (difference 0.50 > 0.1)
- AND the failure is reported with both values and the delta

### Requirement: Clear pass/fail output per taxpayer

The validation script MUST produce a summary report showing pass/fail status for each taxpayer, including which fields passed or failed and the magnitude of any differences.

#### Scenario: All taxpayers pass

- GIVEN 5 taxpayers with all fields within tolerance
- WHEN the validation script completes
- THEN it outputs "5/5 PASSED" with a green summary

#### Scenario: Mixed pass/fail results

- GIVEN 5 taxpayers where 3 pass and 2 fail on Total
- WHEN the validation script completes
- THEN it outputs "3/5 PASSED, 2/5 FAILED"
- AND lists each failed taxpayer with the field, expected, actual, and delta

#### Scenario: No test data available

- GIVEN zero valid test rows after filtering
- WHEN the validation script completes
- THEN it outputs a warning that no test cases were executed
- AND exits with a non-zero code
