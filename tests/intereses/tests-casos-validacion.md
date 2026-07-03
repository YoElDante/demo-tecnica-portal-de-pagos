# Casos de Prueba — Fórmulas de Deuda El Manzano

**Fecha**: 2026-07-03 | **BD**: alcaldiasmlqdsmanzano (productiva)
**Objetivo**: Validar que el portal replica exactamente los montos del software de escritorio.

---

## Instrucciones para generar CSVs desde el escritorio

Para cada DNI listado abajo, ejecutar en el software de escritorio:

1. Ir a **Consulta de Deuda**
2. Ingresar el DNI
3. Exportar a CSV (mismo formato que `Cons PLAINO JUAN DOMINGO2026-07-02-235421.csv`)
4. Guardar como `Cons {APELLIDO}_{FECHA}.csv` en `docs/formulas/`

**Columnas esperadas en el CSV**: CODIGO, FECHA, DH, DETALLE, IMPORTE, ID_BIEN, TIPO_BIEN, ANO CUOTA, NRO CUOTA, X, SALDO, REC/DTO, OPERACION, TABLADEV, TIPO MOV, PAGO, PLAN PAGO

---

## Los 10 Casos de Prueba

### Caso 1 — PLAINO JUAN DOMINGO ✅ (REFERENCIA)
| Campo | Valor |
|-------|-------|
| **DNI** | **17720479** |
| Perfil | ININ puro, modo T + C, 35 deudas |
| Validación | Ya confirmada: 35/35 coinciden |
| CSV | `docs/formulas/Cons PLAINO JUAN DOMINGO2026-07-02-235421.csv` |

### Caso 2 — MISERENDINO (múltiples TIPO_BIEN)
| Campo | Valor |
|-------|-------|
| **DNI** | **16856346** |
| Perfil | CICI + ININ + PEPE, 43 deudas, modo T + C |
| Interés | Verificar que cada TIPO_BIEN usa su propio factor |
| CSV | Por generar |

### Caso 3 — TICUPIL (CICI + ININ, muchas deudas)
| Campo | Valor |
|-------|-------|
| **DNI** | **08410205** |
| Perfil | CICI + ININ, 90 deudas, modo T + C |
| Interés | Alta cantidad, buen stress test |
| CSV | Por generar |

### Caso 4 — CRAVERO (CICI + ININ)
| Campo | Valor |
|-------|-------|
| **DNI** | **29308519** |
| Perfil | CICI + ININ, 56 deudas |
| CSV | Por generar |

### Caso 5 — CACERES (CICI + ININ)
| Campo | Valor |
|-------|-------|
| **DNI** | **14537335** |
| Perfil | CICI + ININ, 42 deudas |
| CSV | Por generar |

### Caso 6 — OLMOS (ININ + PEPE)
| Campo | Valor |
|-------|-------|
| **DNI** | **12212197** |
| Perfil | ININ + PEPE, 36 deudas |
| CSV | Por generar |

### Caso 7 — VALUCH (ININ + PEPE + RRNC)
| Campo | Valor |
|-------|-------|
| **DNI** | **35667364** |
| Perfil | ININ + PEPE + RRNC (nota crédito), 12 deudas |
| Interés | Verificar notas de crédito (TipoMovim != FA → interés 0) |
| CSV | Por generar |

### Caso 8 — ILICH (ININ + NDND)
| Campo | Valor |
|-------|-------|
| **DNI** | **33083311** |
| Perfil | ININ + NDND (nota débito), 26 deudas |
| Interés | Verificar notas de débito |
| CSV | Por generar |

### Caso 9 — LOPEZ (ININ puro, 90 deudas)
| Campo | Valor |
|-------|-------|
| **DNI** | **22372096** |
| Perfil | ININ puro, 90 deudas, alto volumen |
| CSV | Por generar |

### Caso 10 — VILCHEZ (monto bajo, pocas deudas)
| Campo | Valor |
|-------|-------|
| **DNI** | **02787812** |
| Perfil | Pocas deudas, montos bajos (~$146k total) |
| Interés | Caso simple, fácil de verificar manualmente |
| CSV | Por generar |

---

## Script de validación automática

Una vez generados los CSVs, ejecutar:

```bash
node tests/intereses/validar-contra-csv.js
```

Este script:
1. Conecta a la BD productiva de El Manzano
2. Lee cada CSV
3. Calcula intereses con el motor del portal
4. Compara fila por fila
5. Reporta diferencias

---

## Fórmulas implementadas en el portal

### Modo T — Interés Simple
```
interés = Saldo × (TasaInteres ÷ 365 ÷ 100) × días_desde_vencimiento
```
Aplica cuando: FechaVto >= FechaDesdeInt (2024-12-31) O CoeficienteCuota es NULL

### Modo C — Coeficiente
```
interés = Saldo × (IndiceFinal ÷ CoeficienteCuota)
```
Aplica cuando: FechaVto < FechaDesdeInt Y CoeficienteCuota > 0

### Modo D — Descuento Cuota Única
```
descuento = Saldo × (TasaDescuento ÷ 100) × -1
```
Aplica cuando: NRO_CUOTA === '000' Y TipoMovim === 'FA'

### Parámetros (desde DatosGenerales)
| Parámetro | Valor El Manzano |
|-----------|-----------------|
| TasaInteres | 40 |
| TasaDescuento | 10 |
| IndiceFinal | 7694.0075 |
| FechaDesdeInt | 2024-12-31 |

---

## Resumen de resultados esperados

| # | DNI | Filas | Modo T | Modo C | ¿Coincide? |
|---|-----|-------|--------|--------|------------|
| 1 | 17720479 | 35 | 5 | 30 | ✅ 35/35 |
| 2 | 16856346 | ~43 | ? | ? | Pendiente |
| 3 | 08410205 | ~90 | ? | ? | Pendiente |
| 4 | 29308519 | ~56 | ? | ? | Pendiente |
| 5 | 14537335 | ~42 | ? | ? | Pendiente |
| 6 | 12212197 | ~36 | ? | ? | Pendiente |
| 7 | 35667364 | ~12 | ? | ? | Pendiente |
| 8 | 33083311 | ~26 | ? | ? | Pendiente |
| 9 | 22372096 | ~90 | ? | ? | Pendiente |
| 10 | 02787812 | ~189 | ? | ? | Pendiente |
