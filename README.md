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
- Procesar pagos via MercadoPago (y otras pasarelas futuras)

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
│   └── paymentGateway.service.js # Multi-pasarela (MercadoPago, etc.)
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
PAYMENT_GATEWAY=mercadopago      # mercadopago | pagotic | siro | macropay
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
| `GET /pago/exitoso` | Confirmación de pago exitoso |
| `GET /pago/pendiente` | Pago pendiente de confirmación |
| `GET /pago/fallido` | Error en el pago |

---

## 💳 Pasarelas de Pago

El sistema soporta múltiples pasarelas via la variable `PAYMENT_GATEWAY`:

| Pasarela | Estado | Variable |
|----------|--------|----------|
| MercadoPago | ✅ Activo | `mercadopago` |
| PagoTic | ⏳ Pendiente | `pagotic` |
| SIRO | ⏳ Pendiente | `siro` |
| MacroPay | ⏳ Pendiente | `macropay` |

---

## 🛠️ Tecnologías

- **Runtime:** Node.js v22.x
- **Framework:** Express
- **ORM:** Sequelize
- **Base de datos:** Azure SQL (driver: tedious)
- **Vistas:** EJS
- **Pagos:** MercadoPago SDK

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [DEPLOY_AZURE.md](docs/DEPLOY_AZURE.md) | Guía de despliegue en Azure App Service |
| [MUNICIPIO_CONFIG.md](config/MUNICIPIO_CONFIG.md) | Cómo cambiar de municipio |
| [INTEGRACION_PAGOS.md](docs/INTEGRACION_PAGOS.md) | Flujo de integración con MercadoPago |
| [QUICK_RESUME.ai.md](docs/ai/QUICK_RESUME.ai.md) | Resumen rápido para desarrolladores |

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

1. Abrir issue con bug o feature request
2. Crear branch con cambios y abrir PR

---

## 📄 Licencia

MIT

---

## 📧 Contacto

**Dante Marcos Delprato**  
Repositorio: https://github.com/YoElDante/demo-tecnica-portal-de-pagos
