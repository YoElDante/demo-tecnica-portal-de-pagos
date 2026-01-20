# ⚡ QUICK_RESUME.ai.md

> **Propósito**: Volver después de días/semanas y saber exactamente qué hacer
> **Última actualización**: 2026-01-20

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
- Leer `docs/ai/ROADMAP.ai.md` → sección "Próximo Sprint"

---

## 📍 ¿Dónde Estábamos?

### Última sesión (20 Enero 2026)
- ✅ Migración completa a BEM (CSS y clases HTML)
- ✅ CSS responsive corregido para ticket-preview
- ✅ Lógica de colores Int/Dto corregida (cargos=negro, descuentos=verde)
- ✅ PDF funcionando correctamente
- ✅ Vistas de pago (exitoso/fallido/pendiente) migradas a BEM
- ✅ Documentación actualizada

### Estado del código
| Área | Estado |
|------|--------|
| Búsqueda DNI | ✅ Funciona |
| Ver deudas | ✅ Funciona |
| Generar ticket | ✅ Funciona |
| Descargar PDF | ✅ Funciona |
| CSS Responsive | ✅ Funciona |
| Metodología BEM | ✅ Migrado |
| Pagar con MP | ✅ Funciona (falta tabla de tickets) |
| Registrar pago en BD | ✅ Funciona |
| Config multi-municipio | ✅ Implementado |

---

## 🎯 Próxima Tarea Inmediata

### Tarea: Crear Sistema de Tickets (Tabla + ID único)

**¿Por qué es importante?**
Necesitamos registrar los tickets generados para:
- Saber qué pagos virtuales se hicieron
- Enviar comprobantes por email
- Controlar tickets expirados (>24hs)

**Pasos**:
1. Crear tabla `TicketsPago` en la BD
2. Crear modelo Sequelize `TicketPago.js`
3. Generar ID único formato `YYYYMMDDHHMMSS-DNI`
4. Registrar ticket al generarlo y al pagarlo

**Ver detalles en**: `docs/ai/ROADMAP.ai.md` → Tarea 2-4

---

## 📂 Archivos Clave

| Archivo | Para qué sirve |
|---------|----------------|
| `services/deudas.service.js` | Cálculo de intereses (línea ~17: `TASA_INTERES_ANUAL`) |
| `services/pagos.service.js` | Confirma pagos, actualiza BD |
| `models/model.index.js` | ⚠️ Aquí se cambia municipio (líneas 10-11) |
| `controllers/payment.controller.js` | Flujo de pago con MP |
| `public/javascripts/deudas.js` | Lógica del frontend |

---

## 🧪 DNIs de Prueba

| DNI | Municipio | Deudas |
|-----|-----------|--------|
| 17081206 | Manzano | Varias |
| 29717814 | Manzano | Varias |
| 10901809 | Manzano | Algunas |
| 23765820 | Manzano | Pocas |

---

## 🔧 Comandos Útiles

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
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
