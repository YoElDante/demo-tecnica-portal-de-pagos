# 🏛️ Portal de Pagos Municipal — Demo Técnica

> Portal de Pago Municipal multi-ambiente — complemento del programa **Alcald+IA**  
> Un solo código base para múltiples municipios, configurado via variables de entorno

**Repositorio:** https://github.com/YoElDante/demo-tecnica-portal-de-pagos  
**Deploy Demo en Azure:** https://demo.alcaldia.com.ar

---

## 📋 Descripción

Portal web que permite a contribuyentes:
- Consultar deudas pendientes por DNI
- Generar tickets de pago
- Procesar pagos via SIRO del Banco Roela mediante un gateway intermedio

El sistema soporta **múltiples municipios** con el mismo código, diferenciados por variables de entorno.

### Municipios configurados

| Municipio | Script | Base de datos |
|-----------|--------|---------------|
| El Manzano | `npm run dev:elmanzano` | Azure SQL |
| Tinoco | `npm run dev:tinoco` | Azure SQL |
| San José de las Salinas | `npm run dev:sanjose` | Azure SQL |

### DNIs de prueba

```
17081206 | 29717814 | 10901809 | 23765820
```

---

## 🚀 Inicio Rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/YoElDante/demo-tecnica-portal-de-pagos
cd demo-tecnica-portal-de-pagos
npm install
```

### 2. Configurar variables de entorno

Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

O usar un archivo de municipio existente (si tienes acceso a `envs/`):
```bash
cp envs/.env.elmanzano .env
```

### 3. Ejecutar

```bash
# Desarrollo genérico
npm run dev

# O por municipio específico (copia automática de envs/)
npm run dev:elmanzano
npm run dev:tinoco
npm run dev:sanjose
```

---

## 📁 Estructura del Proyecto

```
├── config/
│   ├── index.js                 # Selector central de configuración
│   ├── database.config.js       # Conexión BD (lee de variables de entorno)
│   └── municipalidad.config.*.js # Datos públicos por municipio
├── services/
│   ├── deudas.service.js        # Lógica de cálculo de deudas
│   ├── pagos.service.js         # Gestión de pagos
│   └── paymentGateway.service.js # Integración con gateway de pagos
├── routes/
│   ├── index.js                 # Rutas web
│   └── api/                     # Rutas API REST
├── views/                       # Templates EJS
├── public/images/{municipio}/   # Logos por municipio
├── envs/                        # Archivos .env por municipio (NO en repo)
└── docs/                        # Documentación
```

---

## ⚙️ Variables de Entorno

Archivo `.env` en la raíz del proyecto:

```env
# === MUNICIPIO ===
MUNICIPIO=elmanzano              # elmanzano | tinoco | sanjosedelassalinas

# === BASE DE DATOS (Azure SQL) ===
DB_HOST=servidor.database.windows.net
DB_NAME=nombre_base_datos
DB_USER=usuario
DB_PASS=contraseña_segura
DB_PORT=1433
DB_DIALECT=mssql

# === SERVIDOR ===
PORT=4000
NODE_ENV=development

# === CONFIGURACIÓN MUNICIPAL ===
TASA_INTERES_ANUAL=40            # Tasa de interés anual (%)

# === PASARELA DE PAGOS ===
PAYMENT_GATEWAY=siro             # Activa hoy: SIRO (Banco Roela)
API_GATEWAY_URL=https://api-gateway.azurewebsites.net
FRONTEND_PUBLIC_URL=http://localhost:4000

# === SEGURIDAD ===
WEBHOOK_SECRET=secreto_para_validar_webhooks
```

Ver [.env.example](.env.example) para la plantilla completa.

---

## 📜 Scripts NPM

| Script | Descripción |
|--------|-------------|
| `npm start` | Iniciar servidor (producción) |
| `npm run dev` | Desarrollo con hot-reload |
| `npm run dev:elmanzano` | Desarrollo con El Manzano |
| `npm run dev:tinoco` | Desarrollo con Tinoco |
| `npm run dev:sanjose` | Desarrollo con San José de las Salinas |
| `npm run testDB` | Probar conexión a base de datos |

---

## 🪵 Logging en Desarrollo

En `development`, el proyecto usa logger unificado con niveles y metadata estructurada.

- `npm run dev` arranca con `LOG_LEVEL=trace` por defecto.
- `npm run dev:*` (demo, elmanzano, tinoco, sanjose) hereda el mismo nivel.
- Los `console.log/info/warn/error/debug` se normalizan al mismo formato.

Niveles soportados:

```bash
error | warn | info | debug | trace
```

Formato base de salida:

```text
[timestamp] [LEVEL] mensaje | { metadata }
```

Incluye request/response con:

- `requestId`
- método y URL
- IP y `user-agent`
- duración de respuesta (`duration_ms`)
- status HTTP

---

## 🔌 Integración Local Portal + Gateway

Configuración recomendada para desarrollo local (`NODE_ENV=development`):

- Portal: `http://localhost:4000`
- Gateway: `http://localhost:3000`

Variables clave en el portal:

```env
API_GATEWAY_URL=http://localhost:3000
FRONTEND_PUBLIC_URL=http://localhost:4000
```

### Endpoints esperados en local

- Portal expone webhook en `POST /api/webhook/pago` (alias legacy: `POST /api/pagos/confirmacion`).
- Gateway debe crear pagos en `POST /api/pagos` (consumido por el portal usando `API_GATEWAY_URL`).
- Redirect de usuario vuelve al portal en:
	- `GET /pagos/exitoso`
	- `GET /pagos/pendiente`
	- `GET /pagos/error` (y alias `GET /pagos/fallido`)

Para SIRO en local, el portal envía en el request al gateway:

- `callback_url=http://localhost:4000/api/pagos/confirmacion`
- `callbackUrl=http://localhost:4000/api/pagos/confirmacion`

Si en el gateway aparece el error `callbackUrl no configurada — PUBLIC_URL es requerido`, revisar su `.env`
y definir `PUBLIC_URL` correctamente (por ejemplo `http://localhost:3000` o el valor requerido por su implementación).

### Nota sobre HTTPS en local

Por defecto, este portal levanta servidor HTTP (no HTTPS) en `bin/www`.
Si necesitás `https://localhost:4000`, hace falta agregar terminación TLS local
(por ejemplo proxy local con certificados de desarrollo) o cambiar el bootstrap
del servidor para usar `https.createServer`.

---

## 🌐 Rutas de la API

Base: `/api`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/` | Info y endpoints disponibles |
| GET | `/api/clientes` | Lista paginada de clientes |
| GET | `/api/clientes/buscar/dni/:dni` | Buscar cliente por DNI |
| GET | `/api/clientes/deudas/:codigo` | Deudas por código/dominio/DNI |
| POST | `/api/clientes/generar-pago` | Generar JSON de pago |
| GET | `/api/clientes/contribuyentes` | Lista contribuyentes con deudas |

### Interfaz Web

| Ruta | Descripción |
|------|-------------|
| `GET /` | Formulario de búsqueda por DNI |
| `POST /buscar` | Procesar búsqueda |
| `GET /pagos/exitoso` | Confirmación de pago exitoso |
| `GET /pagos/pendiente` | Pago pendiente de confirmación |
| `GET /pagos/fallido` | Error en el pago |

---

## 💳 Pasarelas de Pago

La integración activa hoy es SIRO del Banco Roela. Otras pasarelas quedan como antecedente o capacidad futura del gateway.

| Pasarela | Estado | Variable |
|----------|--------|----------|
| SIRO / Banco Roela | ✅ Activo | `siro` |
| MercadoPago | 📦 Archivado | `mercadopago` |
| PagoTic | ⏳ Futuro | `pagotic` |
| MacroPay | ⏳ Futuro | `macropay` |

---

## 🛠️ Tecnologías

- **Runtime:** Node.js v22.x
- **Framework:** Express
- **ORM:** Sequelize
- **Base de datos:** Azure SQL (driver: tedious)
- **Vistas:** EJS
- **Pagos:** SIRO / Banco Roela via gateway externo

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/README.md](docs/README.md) | Índice maestro de documentación |
| [AI_CONTEXT.md](docs/AI_CONTEXT.md) | Contexto compacto para desarrolladores y agentes IA |
| [GUIA_RAMAS.md](docs/GUIA_RAMAS.md) | Estrategia de ramas y flujo de trabajo git |
| [DEPLOY_AZURE.md](docs/DEPLOY_AZURE.md) | Despliegue en Azure App Service |
| [CONTRACT-PORTAL-GATEWAY.md](docs/CONTRACT-PORTAL-GATEWAY.md) | Contrato portal ↔ gateway de pagos |
| [INTEGRACION_PAGOS.md](docs/INTEGRACION_PAGOS.md) | Flujo activo de integración con SIRO |
| [GUIA_NUEVO_MUNICIPIO.md](docs/GUIA_NUEVO_MUNICIPIO.md) | Alta de un nuevo municipio |
| [MUNICIPIO_CONFIG.md](config/MUNICIPIO_CONFIG.md) | Variables de configuración por municipio |
| [REDIRECT-WEBHOOK-DESIGN.md](docs/integracion/REDIRECT-WEBHOOK-DESIGN.md) | Decisiones finales redirect/webhook y render por ticket BD |

---

## 🔧 Troubleshooting

### Error de conexión a BD

```
❌ Error: Faltan variables de entorno de Base de Datos
```
**Solución:** Verificar que `.env` tenga `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`

### Logo no carga

```
GET /images/municipio/logo.webp 404
```
**Solución:** Verificar estructura en `public/images/{municipio}/`

### Problemas TLS/SSL

Para pruebas locales, en `config/database.config.js`:
```javascript
trustServerCertificate: true  // Solo desarrollo, NO producción
```

### Probar conexión rápida

```bash
npm run testDB
# Debe mostrar: ✅ Conectado exitosamente a Azure SQL Database
```

---

## 👥 Contribuir

Ver [docs/GUIA_RAMAS.md](docs/GUIA_RAMAS.md) para el flujo completo.

Resumen:
1. Todo trabajo nuevo parte desde `develop`, nunca desde `main`
2. Cambios funcionales relevantes requieren un change en `openspec/changes/` antes de la rama
3. Validar en `demo.alcaldia.com.ar` antes de mergear a `main`
4. `main` = producción — solo recibe merges aprobados desde `develop`
5. `.env` y `envs/` no viajan en git; la configuración del demo vive fuera del repositorio

### Política de dependencias

- Este proyecto usa versiones exactas en `package.json` (sin `^` ni `~`).
- En ambientes ya funcionando no se actualizan dependencias por rutina.
- Solo se actualiza por seguridad o corrección crítica, con validación explícita.
- Toda dependencia nueva se agrega con versión confiable y estable, fijada de forma exacta.

---

## 📄 Licencia

MIT

---

## 📧 Contacto

**Dante Marcos Delprato**  
Repositorio: https://github.com/YoElDante/demo-tecnica-portal-de-pagos
