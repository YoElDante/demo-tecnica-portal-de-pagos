# 🔗 Guía de Integración Multi-Proyecto

> **Para**: Desarrolladores que trabajan con múltiples repositorios interconectados  
> **Nivel**: Junior → Intermedio  
> **Última actualización**: 2026-03-19

---

## 📋 Índice

1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Arquitectura de Nuestro Sistema](#arquitectura-de-nuestro-sistema)
3. [¿Necesito un Proyecto "Padre"?](#necesito-un-proyecto-padre)
4. [Contratos de API](#contratos-de-api)
5. [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
6. [Checklist del Desarrollador](#checklist-del-desarrollador)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🎓 Conceptos Fundamentales

### ¿Qué es una integración entre proyectos?

Cuando dos aplicaciones se comunican entre sí mediante HTTP (APIs REST), necesitan "hablar el mismo idioma". Esto incluye:

- **Endpoints**: URLs a las que un proyecto llama
- **Formato de datos**: Estructura del JSON que se envía/recibe
- **Autenticación**: Cómo se identifican entre sí
- **Manejo de errores**: Qué pasa cuando algo falla

### Protocolos que usamos

| Comunicación | Protocolo | Descripción |
|--------------|-----------|-------------|
| Portal → API de Pagos | **REST API** | HTTP POST con JSON |
| API → Pasarela SIRA | **Payment Gateway Protocol** | Redirect con firma HMAC |
| Pasarela → API (resultado) | **Webhook/IPN** | Notificación server-to-server |
| API → Portal (retorno) | **Redirect + Callback** | URL con parámetros de estado |

### Glosario

| Término | Significado |
|---------|-------------|
| **Contrato de API** | Acuerdo documentado sobre cómo se comunican dos sistemas |
| **Webhook** | URL que recibe notificaciones automáticas de otro sistema |
| **IPN** | Instant Payment Notification - notificación de pago del banco |
| **Preferencia de pago** | Datos del pago que el usuario quiere realizar |
| **Callback URL** | URL a donde vuelve el usuario después de pagar |

---

## 🏗️ Arquitectura de Nuestro Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO COMPLETO DE PAGO                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │   CONTRIBUYENTE  │                                                       │
│  │   (Navegador)    │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           │ 1. Ingresa DNI, ve deudas, selecciona conceptos                 │
│           ▼                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │  PORTAL WEB      │  2.POST │  API GATEWAY     │                          │
│  │  (Proyecto 1)    │────────►│  DE PAGOS        │                          │
│  │                  │ prefere-│  (Proyecto 2)    │                          │
│  │  demo-portal-de- │ ncia    │                  │                          │
│  │  pago/           │         │  api-gateway-mp/ │                          │
│  └──────────────────┘         └────────┬─────────┘                          │
│           ▲                            │                                    │
│           │                            │ 3. Arma request firmado            │
│           │                            ▼                                    │
│           │                   ┌──────────────────┐                          │
│           │                   │  PASARELA SIRA   │                          │
│           │                   │  (Banco Roela)   │                          │
│           │                   └────────┬─────────┘                          │
│           │                            │                                    │
│           │    6. Redirect             │ 4. Usuario paga                    │
│           │    con resultado           │                                    │
│           │                            ▼                                    │
│           │                   ┌──────────────────┐                          │
│           │                   │  5. Webhook IPN  │                          │
│           │                   │  (notifica       │                          │
│           └───────────────────┤   resultado)     │                          │
│                               └──────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Nuestros dos proyectos

| Proyecto | Carpeta | Responsabilidad |
|----------|---------|-----------------|
| **Portal Web** | `demo-portal-de-pago/` | UI, consulta deudas, muestra resultados |
| **API Gateway de Pagos** | `api-gateway-mp/` | Procesa pagos, comunica con SIRA |

---

## 📁 ¿Necesito un Proyecto "Padre"?

### Respuesta corta: **NO**

No necesitas crear un nuevo repositorio que contenga a los otros dos. Eso sería un **monorepo** y tiene sus propias complejidades.

### Lo que SÍ debes hacer

```
📁 C:\workspace\portal-de-pago\          ← Carpeta de trabajo (NO es un repo Git)
│
├── 📁 demo-portal-de-pago/              ← Repo Git independiente
│   ├── .git/
│   └── ... (código del portal)
│
├── 📁 api-gateway-mp/                   ← Repo Git independiente  
│   ├── .git/
│   └── ... (código de la API)
│
└── 📁 contracts/                        ← OPCIONAL: Carpeta para contratos
    └── payment-api.schema.json          ← Definición compartida
```

### ¿Cómo abrir ambos proyectos en VS Code?

**Opción 1: Multi-root Workspace (RECOMENDADA)**

1. Abre VS Code
2. File → Add Folder to Workspace
3. Agrega ambas carpetas
4. File → Save Workspace As → `portal-pagos.code-workspace`

Esto crea un archivo `.code-workspace`:

```json
{
  "folders": [
    { "path": "demo-portal-de-pago", "name": "Portal Web" },
    { "path": "api-gateway-mp", "name": "API Pagos" }
  ],
  "settings": {}
}
```

**Opción 2: Abrir carpeta padre**

Simplemente abrir `C:\workspace\portal-de-pago\` en VS Code. La IA verá ambos proyectos.

### ¿Cuándo SÍ necesitarías un monorepo?

- Si compartes mucho código entre proyectos
- Si deploys siempre van juntos
- Si tienes más de 5 proyectos interconectados

**Para 2-3 proyectos independientes → Repos separados es lo correcto.**

---

## 📜 Contratos de API

### ¿Qué es un contrato de API?

Es un **acuerdo documentado** entre dos sistemas sobre:

- Qué endpoints existen
- Qué datos se envían
- Qué datos se reciben
- Qué errores pueden ocurrir

### ¿Por qué es importante?

Sin contrato:
```
Portal: "Te mando el DNI como 'dni'"
API: "Yo esperaba 'documento'"
→ ERROR 💥
```

Con contrato:
```
Contrato dice: "El campo se llama 'contribuyenteDocumento'"
Portal y API usan ese nombre → FUNCIONA ✅
```

### ¿Dónde poner el contrato?

**Opción A: En la documentación de la API (RECOMENDADA para empezar)**

```
api-gateway-mp/
└── docs/
    └── API_CONTRACT.md      ← Documentación del contrato
```

**Opción B: Archivo de esquema compartido**

```
portal-de-pago/
└── contracts/
    └── payment-preference.schema.json
```

**Opción C: OpenAPI/Swagger (más profesional)**

```yaml
# api-gateway-mp/openapi.yaml
openapi: 3.0.0
info:
  title: API Gateway de Pagos
  version: 1.0.0
paths:
  /api/v1/payment/preference:
    post:
      summary: Crear preferencia de pago
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentPreference'
```

### Ejemplo de Contrato Simple (Markdown)

```markdown
## POST /api/v1/payment/preference

### Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| contribuyenteId | string | ✅ | ID único del contribuyente |
| contribuyenteDocumento | string | ✅ | DNI/CUIT |
| contribuyenteNombre | string | ✅ | Nombre completo |
| conceptos | array | ✅ | Lista de conceptos a pagar |
| conceptos[].id | number | ✅ | ID del concepto |
| conceptos[].descripcion | string | ✅ | Descripción |
| conceptos[].monto | number | ✅ | Monto en pesos |
| montoTotal | number | ✅ | Suma de todos los montos |
| callbackUrl | string | ✅ | URL de retorno al portal |
| municipioId | string | ✅ | Identificador del municipio |

### Response (200 OK)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | boolean | true si se procesó |
| redirectUrl | string | URL para redirigir al usuario |
| transactionId | string | ID único de la transacción |

### Response (400 Bad Request)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| success | boolean | false |
| error | string | Código de error |
| message | string | Descripción del error |
```

---

## 🌿 Flujo de Trabajo con Git

El flujo de ramas para este proyecto ya está documentado en detalle en `docs/GUIA_RAMAS.md`.

### Regla operativa para trabajo multi-proyecto

- Crear una rama equivalente en cada repositorio involucrado.
- Mantener el contrato de integración alineado antes de implementar.
- Validar el flujo cruzado en staging antes de mergear a producción.
- Revisar `git status` y `git diff` en cada repo por separado.

### Secuencia mínima recomendada

```bash
# Portal
cd demo-portal-de-pago
git checkout develop
git pull origin develop
git checkout -b feature/integracion-portal

# Gateway
cd ../api-gateway-mp
git checkout develop
git pull origin develop
git checkout -b feature/integracion-api
```

Para el detalle completo de ramas, merges y emergencias, usar `docs/GUIA_RAMAS.md` como fuente de verdad.

---

## ✅ Checklist del Desarrollador

### Antes de empezar la integración

- [ ] Ambos proyectos clonados en la misma carpeta padre
- [ ] Ambos proyectos en rama `develop` actualizada
- [ ] Ramas de feature creadas en ambos proyectos
- [ ] VS Code abierto en carpeta padre o como multi-root workspace

### Durante el desarrollo

- [ ] Contrato de API definido y documentado
- [ ] Variables de entorno configuradas para URLs entre proyectos
- [ ] Manejo de errores implementado en ambos lados
- [ ] Logs para debugging de la comunicación

### Antes de hacer commit

- [ ] `git status` revisado en ambos proyectos
- [ ] `git diff` revisado para ver cambios
- [ ] Tests ejecutados (si existen)
- [ ] Aplicación probada localmente

### Después del merge

- [ ] Probar en staging con ambos proyectos desplegados
- [ ] Verificar logs de comunicación
- [ ] Probar flujo completo de pago (si es posible)

---

## ❓ Preguntas que Debes Responder

### Sobre la arquitectura

1. **¿La API de pagos ya tiene endpoints definidos?**
   - Si SÍ → ¿Cuáles son? (necesito verlos)
   - Si NO → Hay que crearlos

2. **¿Qué datos necesita recibir la API del Portal?**
   - Contribuyente (DNI, nombre, etc.)
   - Conceptos seleccionados (IDs, montos)
   - URLs de callback

3. **¿Cómo se autentica el Portal con la API?**
   - [ ] API Key
   - [ ] JWT Token
   - [ ] Sin autenticación (solo en desarrollo)

### Sobre el flujo de pago

4. **¿El resultado del pago cómo vuelve al Portal?**
   - [ ] Redirect con query params
   - [ ] Webhook a endpoint del Portal
   - [ ] Ambos

5. **¿Qué estados de pago existen?**
   - [ ] Exitoso
   - [ ] Pendiente
   - [ ] Rechazado
   - [ ] Error
   - [ ] Otros: ____________

### Sobre el ambiente

6. **¿En qué puertos corren localmente?**
   - Portal: `localhost:____`
   - API: `localhost:____`

7. **¿URLs en producción/staging?**
   - Portal staging: ____________
   - API staging: ____________

---

## ❓ Preguntas para la IA

Cuando le pidas a la IA que integre los proyectos, debe poder responder:

### Explorando el Portal (Proyecto 1)

1. ¿Dónde está el código que maneja "ir a pagar"?
2. ¿Existe un servicio de pagos o gateway ya implementado?
3. ¿Qué datos del contribuyente y deudas están disponibles?
4. ¿Hay vistas para mostrar resultado de pago?

### Explorando la API (Proyecto 2)

1. ¿Qué endpoints existen actualmente?
2. ¿Cómo se conecta con SIRA/Banco Roela?
3. ¿Qué validaciones tiene?
4. ¿Cómo notifica el resultado del pago?

### Integrando ambos

1. ¿Los formatos de datos son compatibles?
2. ¿Las variables de entorno están configuradas?
3. ¿Falta implementar algo en alguno de los proyectos?

---

## 📚 Recursos Adicionales

- [GUIA_RAMAS.md](./GUIA_RAMAS.md) - Flujo de trabajo con Git
- [INTEGRACION_PAGOS.md](./INTEGRACION_PAGOS.md) - Detalles técnicos del flujo de pago

---

## 🆘 Troubleshooting

### "La IA editó archivos pero no sé en qué rama están"

```bash
# Ver rama actual de cada proyecto
cd demo-portal-de-pago && git branch --show-current
cd ../api-gateway-mp && git branch --show-current
```

### "Quiero deshacer todos los cambios de la IA"

```bash
# Descartar cambios no commiteados
git checkout -- .

# Si ya hiciste commit, volver al anterior
git reset --hard HEAD~1
```

### "Los proyectos no se comunican"

1. Verificar que ambos estén corriendo
2. Revisar URLs en variables de entorno
3. Ver logs de ambos servidores
4. Probar endpoint manualmente con curl/Postman

---

> **Recuerda**: Cada proyecto tiene su propio `.git`. La IA edita archivos, pero TÚ decides cuándo commitear y a qué rama.
