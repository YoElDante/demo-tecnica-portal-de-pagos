# ⚡ QUICK_RESUME.ai.md

> **Propósito**: Volver después de días/semanas y saber exactamente qué hacer
> **Última actualización**: 2026-03-09

---

## 🚀 Para Arrancar en 2 Minutos

### 1. Levantar el proyecto
```bash
cd c:\workspace\portal-de-pago\demo-portal-de-pago
npm install   # Solo si es la primera vez
npm run dev   # Modo desarrollo con watch
```

### 2. Verificar que funciona
- Abrir http://localhost:4000
- Probar con DNI: `17081206` o `29717814`

### 3. Ver estado del proyecto
- Leer `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` → sección "Checklist"

---

## 📍 ¿Dónde Estábamos?

### Última sesión (09 Marzo 2026)
- ✅ **FASE 1**: Configuración BD unificada (todo via variables de entorno)
- ✅ **FASE 2**: Tasa de interés configurable (`TASA_INTERES_ANUAL`)
- ✅ **FASE 3**: Imágenes organizadas por municipio (`public/images/{municipio}/`)
- ✅ **FASE 4**: Credenciales protegidas en `envs/` (no en repo)
- ✅ **FASE 5**: Estructura preparada para múltiples pasarelas de pago

### Estado del código
| Área | Estado |
|------|--------|
| Búsqueda DNI | ✅ Funciona |
| Ver deudas | ✅ Funciona |
| Generar ticket | ✅ Funciona |
| Descargar PDF | ✅ Funciona |
| Pagar con MP | ✅ Funciona |
| Config multi-municipio | ✅ 100% via env vars |
| Config multi-gateway | ✅ Estructura lista |
| Imágenes por municipio | ✅ Organizadas |

---

## 🎯 Próxima Tarea Inmediata

### Tarea: Completar FASE 6 - Documentación

**Pendiente**:
1. Crear `docs/DEPLOY_AZURE.md` (guía de despliegue)
2. Agregar scripts `dev:municipio` a package.json

### Luego: Sistema de Tickets
Crear tabla `TicketsPago` para registrar tickets generados.
Ver detalles en: `docs/ai/ROADMAP.ai.md`

---

## 🔧 Configuración Rápida

### Cambiar de municipio
```bash
# Editar .env
MUNICIPIO=elmanzano  # o sanjosedelassalinas, tinoco

# Reiniciar servidor
npm run dev
```

### Variables de entorno clave
```env
MUNICIPIO=tinoco              # Determina qué municipio cargar
DB_HOST=xxx.database.windows.net
DB_NAME=nombre_bd
DB_USER=usuario
DB_PASS=contraseña
TASA_INTERES_ANUAL=40         # Tasa de interés anual (%)
PAYMENT_GATEWAY=mercadopago   # Pasarela de pago activa
```

---

## 📂 Archivos Clave

| Archivo | Para qué sirve |
|---------|----------------|
| `config/index.js` | Selector central de municipio |
| `config/database.config.js` | Conexión a BD (lee de env) |
| `config/municipalidad.config.*.js` | Datos visuales por municipio |
| `services/deudas.service.js` | Cálculo de intereses |
| `services/paymentGateway.service.js` | Multi-gateway de pagos |
| `.env.example` | Template de variables |
| `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` | Plan maestro |

---

## 📁 Estructura de Imágenes

```
public/images/
├── common/              → favicon.ico, alcaldiaLogo.webp, qr_mercado.webp
├── elmanzano/           → ISOLOGOTIPO-EL_MANZANO.webp, logo_El_Manzano.jpg
├── sanjosedelassalinas/ → sanjosedelassalinas.webp, sanjosedelassalinas.ico
└── tinoco/              → tinocoLogo.webp, favicon.ico
```

---

## 🧪 DNIs de Prueba

| DNI | Municipio | Deudas |
|-----|-----------|--------|
| 17081206 | El Manzano | Varias |
| 29717814 | El Manzano | Varias |

---

## 🔧 Comandos Útiles

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run start

# Test de conexión a BD
npm run testDB
```

---

## 🐛 Problemas Comunes

### Error de conexión a BD
- Verificar variables en `.env`: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
- Verificar IP permitida en Azure SQL firewall

### Puerto ocupado
```bash
# Cambiar en .env
PORT=4001
```

### Logo no carga
- Verificar ruta en `config/municipalidad.config.{municipio}.js`
- Confirmar que imagen existe en `public/images/{municipio}/`

---

## 📚 Documentación

| Necesito... | Leer... |
|-------------|---------|
| Plan de configuración multi-ambiente | `docs/PLAN_CONFIGURACION_MULTIAMBIENTE.md` |
| Entender el proyecto completo | `docs/ai/PROJECT_CONTEXT.ai.md` |
| Ver qué falta hacer | `docs/ai/ROADMAP.ai.md` |
| Cómo cambiar de municipio | `config/MUNICIPIO_CONFIG.md` |
| Lógica de deudas/pagos | `docs/bd/LOGICA_DEUDAS_PAGOS.md` |
| Despliegue en Azure | `docs/DEPLOY_AZURE.md` (por crear) |

---
npm run start

# Test de conexión a BD
npm run testDB

# Ver estructura del proyecto
tree /F (Windows) o find . -type f -name "*.js" (Linux/Mac)
```

---

## 🐛 Problemas Comunes

### Error de conexión a BD
```
Verificar .env tiene:
- DB_USER correcto
- DB_PASS correcto
- IP permitida en Azure SQL firewall
```

### Puerto 4000 ocupado
```bash
# Cambiar en .env
PORT=4001
```

### Cambiar de municipio
```bash
# Editar .env
MUNICIPIO=sanjosedelassalinas  # o "manzano"

# Reiniciar servidor
npm run dev
```

---

## 📚 Si Necesitás Más Contexto

| Necesito... | Leer... |
|-------------|---------|
| Entender el proyecto completo | `docs/ai/PROJECT_CONTEXT.ai.md` |
| Ver qué falta hacer | `docs/ai/ROADMAP.ai.md` |
| Entender lógica de BD | `docs/bd/LOGICA_DEUDAS_PAGOS.md` |
| Ver plan original de MP | `docs/objetivos/PLAN_INTEGRACION_MERCADOPAGO.md` |
| Contrato con API Gateway | `docs/objetivos/instrucciones.md` |

---

## ✏️ Actualizar Este Documento

Cada vez que termines una sesión de trabajo:
1. Actualizar "Última sesión" con lo que hiciste
2. Actualizar "Próxima Tarea Inmediata" si cambió
3. Commit: `git commit -m "docs: actualizar QUICK_RESUME"`
