# 🚀 Guía de Despliegue en Azure App Service

> **Propósito**: Documentar el proceso de despliegue del Portal de Pagos en Azure
> **Última actualización**: 2026-03-09

---

## 📋 Prerequisitos

1. **Cuenta de Azure** con suscripción activa
2. **Azure App Service** creado (Plan B1 mínimo)
3. **Azure SQL Database** configurada con los datos del municipio
4. **Repositorio Git** conectado (GitHub o Azure DevOps)

---

## 1. Crear el App Service

### Desde Azure Portal

1. Ir a **Azure Portal** → **Crear un recurso** → **App Service**
2. Configurar:
   - **Nombre**: `portal-pagos-{municipio}` (ej: `portal-pagos-elmanzano`)
   - **Pila de runtime**: Node 20 LTS
   - **Sistema operativo**: Linux
   - **Plan**: B1 (mínimo para producción)
   - **Región**: Elegir cercana a los usuarios

### Desde Azure CLI

```bash
# Crear grupo de recursos
az group create --name rg-portal-pagos --location brazilsouth

# Crear plan de App Service
az appservice plan create \
  --name plan-portal-pagos \
  --resource-group rg-portal-pagos \
  --sku B1 \
  --is-linux

# Crear App Service
az webapp create \
  --name portal-pagos-elmanzano \
  --resource-group rg-portal-pagos \
  --plan plan-portal-pagos \
  --runtime "NODE:20-lts"
```

---

## 2. Configurar Variables de Entorno

### Desde Azure Portal

1. Ir a **App Service** → **Configuración** → **Configuración de la aplicación**
2. Agregar las siguientes variables:

| Variable | Valor | Notas |
|----------|-------|-------|
| `NODE_ENV` | `production` | Entorno de producción |
| `PORT` | `8080` | Azure asigna este puerto |
| `MUNICIPIO` | `elmanzano` | Identificador del municipio |
| `DB_HOST` | `xxx.database.windows.net` | Host de Azure SQL |
| `DB_NAME` | `nombre_bd` | Nombre de la base de datos |
| `DB_USER` | `usuario` | Usuario de BD |
| `DB_PASS` | `contraseña` | ⚠️ Marcar como "Secreto" |
| `TASA_INTERES_ANUAL` | `40` | Tasa de interés (%) |
| `PAYMENT_GATEWAY` | `siro` | Pasarela de pago activa |
| `API_GATEWAY_URL` | `https://api-gateway.azurewebsites.net` | URL del gateway |
| `FRONTEND_PUBLIC_URL` | `https://portal-pagos-elmanzano.azurewebsites.net` | URL pública |
| `WEBHOOK_SECRET` | `secreto_seguro` | ⚠️ Marcar como "Secreto" |

3. **Guardar** y el App Service se reiniciará automáticamente

### Desde Azure CLI

```bash
az webapp config appsettings set \
  --name portal-pagos-elmanzano \
  --resource-group rg-portal-pagos \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    MUNICIPIO=elmanzano \
    DB_HOST=xxx.database.windows.net \
    DB_NAME=nombre_bd \
    DB_USER=usuario \
    TASA_INTERES_ANUAL=40 \
    PAYMENT_GATEWAY=siro \
    API_GATEWAY_URL=https://api-gateway.azurewebsites.net \
    FRONTEND_PUBLIC_URL=https://portal-pagos-elmanzano.azurewebsites.net
```

Para secretos (más seguro):
```bash
az webapp config appsettings set \
  --name portal-pagos-elmanzano \
  --resource-group rg-portal-pagos \
  --slot-settings DB_PASS="contraseña_segura" WEBHOOK_SECRET="secreto"
```

---

## 3. Configurar Firewall de Azure SQL

El App Service necesita acceso a la base de datos:

1. Ir a **Azure SQL Server** → **Firewalls y redes virtuales**
2. Activar **Permitir que los servicios de Azure accedan a este servidor**
3. O agregar la IP del App Service específicamente

```bash
# Obtener IP del App Service
az webapp show --name portal-pagos-elmanzano --resource-group rg-portal-pagos --query outboundIpAddresses

# Agregar regla de firewall
az sql server firewall-rule create \
  --server xxx \
  --resource-group rg-portal-pagos \
  --name AllowAppService \
  --start-ip-address X.X.X.X \
  --end-ip-address X.X.X.X
```

---

## 4. Conectar Repositorio Git

### Opción A: GitHub Actions (Recomendado)

1. En Azure Portal → App Service → **Centro de implementación**
2. Seleccionar **GitHub** como origen
3. Autorizar acceso y seleccionar el repositorio
4. Azure creará automáticamente un workflow en `.github/workflows/`

### Opción B: Azure DevOps

1. Crear pipeline en Azure DevOps
2. Usar el template de Node.js
3. Configurar el despliegue al App Service

### Opción C: Despliegue manual con ZIP

```bash
# Crear archivo ZIP del proyecto
zip -r deploy.zip . -x "node_modules/*" -x ".env*" -x "envs/*"

# Desplegar
az webapp deployment source config-zip \
  --name portal-pagos-elmanzano \
  --resource-group rg-portal-pagos \
  --src deploy.zip
```

---

## 5. Verificar el Despliegue

### Verificar que la aplicación responde

```bash
curl https://portal-pagos-elmanzano.azurewebsites.net/
```

### Ver logs en tiempo real

```bash
az webapp log tail \
  --name portal-pagos-elmanzano \
  --resource-group rg-portal-pagos
```

### Verificar conexión a BD

En los logs deberías ver:
```
📊 Base de datos configurada:
   Host: xxx.database.windows.net
   Database: nombre_bd
   Usuario: usuario
🏛️  Municipio activo: Municipalidad de El Manzano
💳 Payment Gateway configurado: SIRO
✅ Conectado exitosamente a Azure SQL Database
```

---

## 6. Configuraciones Adicionales

### Habilitar HTTPS

1. App Service → **Configuración TLS/SSL**
2. Activar **Solo HTTPS**
3. Configurar certificado si se usa dominio personalizado

### Dominio Personalizado

1. App Service → **Dominios personalizados**
2. Agregar dominio (ej: `pagos.municipio.gob.ar`)
3. Configurar DNS del dominio

### Escalado Automático

1. App Service → **Escalar horizontalmente**
2. Configurar reglas basadas en CPU o memoria

### Nota sobre `develop` y `.env`

- `develop` se usa para demo/staging.
- El archivo `.env` local no se versiona porque está ignorado en git.
- `envs/` tampoco se versiona; la configuración real de demo y producción vive en App Service.
- Mergear cambios entre `main` y `develop` no debería tocar secretos ni configuración sensible si estos permanecen fuera del repositorio.

---

## 7. Checklist de Despliegue

### Pre-despliegue
- [ ] App Service creado
- [ ] Variables de entorno configuradas (especialmente secretos)
- [ ] Firewall de Azure SQL permite conexiones
- [ ] Repositorio conectado

### Post-despliegue
- [ ] Aplicación responde en la URL
- [ ] Logs muestran conexión exitosa a BD
- [ ] Logos y estilos cargan correctamente
- [ ] Búsqueda de DNI funciona
- [ ] Generación de ticket funciona
- [ ] Pasarela de pagos funciona (si aplica)

---

## 🔧 Troubleshooting

### Error de conexión a BD

```
❌ Error de conexión a la base de datos
```

**Causas posibles**:
1. Variables de entorno incorrectas (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`)
2. Firewall de Azure SQL no permite la IP del App Service
3. Usuario o contraseña incorrectos

**Solución**:
- Verificar variables en Azure Portal
- Agregar IP del App Service al firewall de SQL

### Logo no carga

```
GET /images/municipio/logo.webp 404
```

**Causa**: Ruta de imagen incorrecta en `municipalidad.config.{municipio}.js`

**Solución**: Verificar que las rutas coincidan con la estructura en `public/images/`

### Puerto incorrecto

Azure asigna el puerto dinámicamente via `PORT`. Asegurarse que la app use:

```javascript
const PORT = process.env.PORT || 4000;
```

### Timeout en inicio

Si la aplicación tarda mucho en iniciar, puede dar timeout.

**Solución**: Configurar en App Service → Configuración general:
- Start Time → 300 segundos (5 min)

---

## 📚 Referencias

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Node.js on Azure](https://docs.microsoft.com/azure/app-service/quickstart-nodejs)
- [Azure SQL Firewall](https://docs.microsoft.com/azure/azure-sql/database/firewall-configure)

---

## 🔄 Añadir Otro Municipio

Para desplegar el mismo portal para otro municipio:

1. **Crear nuevo App Service** (ej: `portal-pagos-tinoco`)
2. **Configurar variables** con los datos del nuevo municipio
3. **Conectar al mismo repositorio** (es el mismo código)
4. **Verificar que el municipio esté registrado** en `config/index.js`

El mismo código sirve para todos los municipios, solo cambian las variables de entorno.
