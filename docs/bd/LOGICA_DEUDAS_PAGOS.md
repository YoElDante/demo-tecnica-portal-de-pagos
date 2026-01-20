# Lógica de Deudas y Pagos - Portal de Pago Municipal

> **Documento de referencia técnica para IA y desarrolladores**
> 
> Proyecto: `demo-portal-de-pago`  
> Fecha: 2025-12-16  
> Autor: Sistema + Dante Marcos Delprato

---

## 1. Estructura de la Tabla ClientesCtaCte

La tabla `dbo.ClientesCtaCte` es el registro contable de todas las transacciones de los contribuyentes.

### 1.1 Campos Clave

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdTrans` | INT (PK) | Identificador único de transacción |
| `Codigo` | VARCHAR(10) | Código del contribuyente |
| `Fecha` | DATE | Fecha de la transacción |
| `CodMovim` | VARCHAR(10) | **H** = Haber (deuda) / **D** = Debe (cobro) |
| `Detalle` | VARCHAR(200) | Descripción del movimiento |
| `Importe` | DECIMAL(15,2) | Monto original |
| `Saldo` | DECIMAL(15,2) | Saldo pendiente |
| `TipoMovim` | VARCHAR(10) | FA = Factura, CO = Cobro, RR = Recibo |
| `EsPago` | INT | 0 = No pagado, 1 = Pagado |
| `FechaVto` | DATE | Fecha de vencimiento |
| `FechaPago` | DATE | Fecha en que se realizó el pago |
| `NumeroPago` | INT | Número secuencial del pago |
| `NRO_OPERACION` | VARCHAR(50) | Número de operación (igual a NumeroPago) |
| `ANO_CUOTA` | INT | Año de la cuota |
| `NRO_CUOTA` | INT | Número de cuota (0-6, donde 0 = anual) |
| `TIPO_BIEN` | VARCHAR(20) | Tipo de deuda (AUAU, ININ, OBSA, etc.) |
| `Ejercicio` | VARCHAR(10) | Ejercicio fiscal |

---

## 2. Tipos de Deuda (TIPO_BIEN)

| Código | Descripción | Ejemplo Detalle |
|--------|-------------|-----------------|
| `AUAU` | Automotores | "PAGO 2024 003 AUAU" |
| `ININ` | Serv. Propiedad (Inmuebles) | "PAGO 2024 001 ININ" |
| `CICI` | Comercio e Industria | "PAGO 2024 002 CICI" |
| `OBSA` | Servicio de Agua | "PAGO 2023 006 OBSA" |
| `CACA` | Catastro | "PAGO 2024 000 CACA" |
| `CEM1` | Cementerio | "PAGO 2024 001 CEM1" |
| `PEPE` | Licencias / Tasas | "PAGO 2024 001 PEPE" |

---

## 3. Formato del Detalle de PAGO

El campo `Detalle` para registros de COBRO (CodMovim='D') sigue el patrón:

```
PAGO YYYY CCC XXXX
```

Donde:
- **YYYY** = Año de la cuota (`ANO_CUOTA`) - Ej: 2024, 2023, 0000
- **CCC** = Número de cuota (`NRO_CUOTA`) - Ej: 001, 002, 006, 000
- **XXXX** = Tipo de bien (`TIPO_BIEN`) - Ej: AUAU, ININ, OBSA

### Ejemplos reales del sistema:
```
PAGO 2024 001 AUAU  → Automotor, cuota 1 de 2024
PAGO 2023 006 ININ  → Inmueble, cuota 6 de 2023
PAGO 2024 000 OBSA  → Agua, cuota anual 2024
PAGO 0000 000 xxxx  → Pago genérico (sin tipo específico)
```

### Patrón del Número Secuencial (NRO_CUOTA)

El número de cuota NO depende del tipo de deuda, depende del **período facturado**:
- `000` = Pago anual o cuota única
- `001` a `006` = Cuotas bimestrales (6 por año)
- `001` a `012` = Cuotas mensuales (12 por año)

---

## 4. Cálculo de Intereses por Mora

### 4.1 Configuración en `services/deudas.service.js`

```javascript
const TASA_INTERES_ANUAL = 40; // Porcentaje anual (40%)
const DIAS_POR_ANIO = 365;
const TASA_DIARIA = TASA_INTERES_ANUAL / 100 / DIAS_POR_ANIO; // ~0.001096
```

### 4.2 Fórmula de Cálculo

```
Interés = Importe × TASA_DIARIA × DíasMora
Total = Importe + Interés
```

### 4.3 Días de Mora

```javascript
function calcularDiasMora(fechaVencimiento, fechaActual = new Date()) {
  const vencimiento = new Date(fechaVencimiento);
  const hoy = new Date(fechaActual);
  
  // Normalizar a medianoche
  vencimiento.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);
  
  const diferenciaMilisegundos = hoy - vencimiento;
  const diasMora = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
  
  return diasMora > 0 ? diasMora : 0; // No hay mora si no venció
}
```

### 4.4 Para Modificar la Tasa de Interés

**Archivo:** `demo-portal-de-pago/services/deudas.service.js`  
**Línea:** ~17  
**Variable:** `TASA_INTERES_ANUAL`

---

## 5. Criterios de Deuda PAGADA vs PENDIENTE

### 5.1 Deuda PENDIENTE (sin pagar)

```sql
-- Criterios para identificar deuda pendiente:
CodMovim = 'H'           -- Es un movimiento de HABER (deuda)
AND Saldo > 0            -- Tiene saldo pendiente
AND (EsPago = 0 OR EsPago IS NULL)  -- No está marcada como pagada
AND NRO_OPERACION IS NULL           -- No tiene operación de pago
```

### 5.2 Deuda PAGADA

```sql
-- Criterios para identificar deuda pagada:
Saldo = 0                -- Saldo en cero
AND EsPago = 1           -- Marcada como pagada
AND NRO_OPERACION IS NOT NULL  -- Tiene número de operación
AND NumeroPago IS NOT NULL     -- Tiene número de pago
AND FechaPago IS NOT NULL      -- Tiene fecha de pago
```

### 5.3 Registro de COBRO (contrapartida)

Cuando se paga, se crea un nuevo registro con:
```sql
CodMovim = 'D'           -- Movimiento de DEBE (cobro)
TipoMovim = 'CO' o 'RR'  -- CO = Cobro, RR = Recibo/Recaudación
Detalle = 'PAGO YYYY CCC XXXX'  -- Formato estandarizado
Saldo = 0                -- El cobro no tiene saldo
EsPago = 1               -- Es un pago
```

---

## 6. Proceso de Confirmación de Pago (MercadoPago)

### 6.1 Flujo de Actualización

```
1. Webhook recibe confirmación de pago
2. Extraer external_reference y metadata.conceptos_ids
3. Para cada IdTrans en conceptos_ids:
   a. Verificar que no esté ya pagado (idempotencia)
   b. Actualizar registro de DEUDA (CodMovim='H')
   c. Crear registro de COBRO (CodMovim='D')
4. Responder {received: true}
```

### 6.2 Actualización de Deuda (UPDATE)

```javascript
await ClientesCtaCte.update({
  Saldo: 0,
  EsPago: 1,
  FechaPago: new Date(paymentData.date_approved),
  NumeroPago: secuencialPago,
  NRO_OPERACION: paymentData.payment_id.toString(),
  Ejercicio: new Date().getFullYear().toString()  // Ejercicio del momento de pago
}, {
  where: { IdTrans: idTrans }
});
```

### 6.3 Creación de Registro COBRO (INSERT)

```javascript
await ClientesCtaCte.create({
  Codigo: deudaOriginal.Codigo,
  Fecha: new Date(paymentData.date_approved),
  CodMovim: 'D',  // DEBE = Cobro
  Detalle: `PAGO ${deudaOriginal.ANO_CUOTA} ${String(deudaOriginal.NRO_CUOTA).padStart(3, '0')} ${deudaOriginal.TIPO_BIEN}`,
  Importe: montoConInteres,
  Saldo: 0,
  TipoMovim: 'RR',  // Recibo/Recaudación
  FechaPago: new Date(paymentData.date_approved),
  EsPago: 1,
  NumeroPago: secuencialPago,
  NRO_OPERACION: paymentData.payment_id.toString(),
  TIPO_BIEN: deudaOriginal.TIPO_BIEN,
  ANO_CUOTA: deudaOriginal.ANO_CUOTA,
  NRO_CUOTA: deudaOriginal.NRO_CUOTA,
  ID_BIEN: deudaOriginal.ID_BIEN,
  Ejercicio: new Date().getFullYear().toString()
});
```

---

## 7. Control de Idempotencia

### 7.1 Estrategia

Evitar procesar el mismo pago dos veces usando `NRO_OPERACION` como clave de control.

```javascript
// Verificar si ya se procesó este pago
const yaExiste = await ClientesCtaCte.findOne({
  where: {
    NRO_OPERACION: paymentData.payment_id.toString(),
    CodMovim: 'D'  // Buscar en registros de cobro
  }
});

if (yaExiste) {
  console.log(`Pago ${paymentData.payment_id} ya procesado, ignorando`);
  return { already_processed: true };
}
```

### 7.2 Campos de Control

| Campo | Uso para Idempotencia |
|-------|----------------------|
| `NRO_OPERACION` | ID único de pago de MercadoPago |
| `NumeroPago` | Secuencial interno del sistema |
| `payment_id` | ID devuelto por MercadoPago |

---

## 8. Generación del Número Secuencial (NumeroPago)

### 8.1 Estrategia Recomendada

Usar el `payment_id` de MercadoPago como `NumeroPago` para:
- Trazabilidad directa con el gateway de pago
- Unicidad garantizada
- Simplicidad de implementación

```javascript
const numeroPago = parseInt(paymentData.payment_id.toString().slice(-9)); // Últimos 9 dígitos
// O simplemente usar el payment_id completo como NRO_OPERACION
```

### 8.2 Alternativa: Secuencial propio

```javascript
const ultimoPago = await ClientesCtaCte.max('NumeroPago');
const nuevoNumeroPago = (ultimoPago || 5000000000) + 1;
```

---

## 9. Campos a Actualizar en el Momento del Pago

### 9.1 Registro de DEUDA (UPDATE)

| Campo | Valor |
|-------|-------|
| `Saldo` | 0 |
| `EsPago` | 1 |
| `FechaPago` | `date_approved` de MercadoPago |
| `NumeroPago` | Secuencial o payment_id |
| `NRO_OPERACION` | `payment_id` de MercadoPago |
| `Ejercicio` | Año actual (momento del pago) |

### 9.2 Registro de COBRO (INSERT)

| Campo | Valor |
|-------|-------|
| `Codigo` | Código del contribuyente |
| `Fecha` | `date_approved` |
| `CodMovim` | 'D' |
| `Detalle` | 'PAGO YYYY CCC XXXX' |
| `Importe` | Monto cobrado (con intereses) |
| `Saldo` | 0 |
| `TipoMovim` | 'RR' |
| `EsPago` | 1 |
| `NumeroPago` | Secuencial |
| `NRO_OPERACION` | `payment_id` |
| `TIPO_BIEN` | Del registro original |
| `ANO_CUOTA` | Del registro original |
| `NRO_CUOTA` | Del registro original |
| `ID_BIEN` | Del registro original |
| `Ejercicio` | Año actual |

---

## 10. Resumen Rápido para Implementación

```javascript
// CRITERIO DEUDA PENDIENTE
const deudasPendientes = await ClientesCtaCte.findAll({
  where: {
    Codigo: codigoCliente,
    Saldo: { [Op.ne]: 0 }  // Saldo diferente de cero
  }
});

// CRITERIO DEUDA PAGADA (verificación)
const estaPagada = deuda.Saldo === 0 && deuda.EsPago === 1;

// AL CONFIRMAR PAGO
// 1. UPDATE deuda: Saldo=0, EsPago=1, FechaPago, NumeroPago, NRO_OPERACION, Ejercicio
// 2. INSERT cobro: CodMovim='D', TipoMovim='RR', Detalle='PAGO...', etc.
// 3. VERIFICAR idempotencia con NRO_OPERACION antes de procesar
```

---

## 11. Referencias de Archivos

| Archivo | Propósito |
|---------|-----------|
| `models/ClientesCtasCtes.js` | Definición del modelo Sequelize |
| `services/deudas.service.js` | Cálculo de intereses y consulta de deudas |
| `services/pagos.service.js` | **A CREAR** - Confirmación de pagos |
| `controllers/payment.controller.js` | Endpoints de pago y webhook |

---

*Documento generado para referencia de desarrollo - Portal de Pago Municipal*
