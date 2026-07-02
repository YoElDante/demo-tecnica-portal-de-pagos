# Onboarding de Nuevo Municipio

Guía de datos a recolectar y dónde depositarlos para incorporar un municipio al portal de pagos.

---

## 1. Datos visuales del municipio

**Dónde van:** `config/municipalidad.config.[municipio].js`

| Dato | Descripción | Ejemplo |
|------|-------------|---------|
| Nombre corto | Aparece en títulos y menús | `El Manzano` |
| Nombre completo | Nombre oficial del organismo | `Comuna de El Manzano` |
| Dirección | Sede física | `Av. J.D. Perón 571` |
| Localidad | Ciudad o pueblo | `El Manzano` |
| Provincia | Provincia | `Córdoba` |
| Código postal | CP IRAM | `X5107` |
| Teléfono principal | Tel. de la municipalidad | `+54 (3525) 493225` |
| CUIT | CUIT del organismo | `30-XXXXXXXX-X` |
| Intendente / Presidente | Nombre del funcionario a cargo | `Juan Pérez` |
| Email de contacto | Mail institucional | `info@municipio.gob.ar` |
| Sitio web oficial | URL completa | `https://municipio.gob.ar` |
| Instagram | Cuenta oficial (opcional) | `@munimunicipio` |
| Tasa de interés anual por mora | Porcentaje de mora municipal | `40` |
| WhatsApp habilitado | ¿Mostrar botón de WhatsApp? | `true` / `false` |
| Teléfono WhatsApp | Número con código de país | `+54 (3525) 493225` |

---

## 2. Imágenes y logos

**Dónde van:** `public/images/[municipio]/`

| Archivo | Descripción | Dimensiones recomendadas |
|---------|-------------|--------------------------|
| `[municipio]-logo-web.webp` | Logo para el encabezado del portal | Ancho máx. 300px, fondo transparente |
| `[municipio]-logo-ticket.webp` | Logo para tickets/comprobantes PDF | Ancho máx. 200px, fondo blanco |
| `[municipio]-favicon.ico` | Favicon de la pestaña del navegador | 32×32px o 64×64px |

> Si solo hay un logo, se puede usar el mismo archivo para web y ticket.

---

## 3. Credenciales de base de datos (Azure SQL)

**Dónde van:**
- Desarrollo local: `envs/.env.[municipio]`
- Producción: `envs/azure.[municipio].json` → pegar en Azure App Service

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` | Servidor Azure SQL (`xxxx.database.windows.net`) |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario SQL (normalmente `SmlqdSAdmin`) |
| `DB_PASS` | Contraseña del usuario SQL |

> El puerto es siempre `1433` y el dialecto `mssql`.

---

## 4. Credenciales SIRO (pasarela de pago)

**Dónde van:** `api-gateway-pagos/.env` (local) y Azure App Service del gateway

| Variable | Descripción |
|----------|-------------|
| `SIRO_[MUNICIPIO]_USUARIO` | Usuario API de SIRO para este municipio |
| `SIRO_[MUNICIPIO]_PASSWORD` | Contraseña API de SIRO |
| `SIRO_[MUNICIPIO]_CONVENIO` | Número de convenio SIRO |
| `SIRO_[MUNICIPIO]_BASE_URL` | URL pública del portal del municipio (para callbacks) |

> `[MUNICIPIO]` va en mayúsculas: `SIRO_ELMANZANO_USUARIO`, `SIRO_TINOCO_CONVENIO`, etc.
> Las credenciales de homologación de prueba son: usuario `UsuarioTestApi`, password `Hola123`, convenio `5150058293`.

---

## 5. URL pública del portal

**Dónde va:** campo `FRONTEND_PUBLIC_URL` en `envs/azure.[municipio].json`

Es la URL del App Service de Azure asignada al municipio. Sigue el patrón:

```
https://[municipio].alcaldia.com.ar
```

Esta misma URL también va en `SIRO_[MUNICIPIO]_BASE_URL` en el gateway.

---

## 6. Checklist de alta — en orden

- [ ] Crear `config/municipalidad.config.[municipio].js` (copiar de `demo` y completar)
- [ ] Subir logos a `public/images/[municipio]/`
- [ ] Crear `envs/.env.[municipio]` con credenciales de BD (para desarrollo local)
- [ ] Crear `envs/azure.[municipio].json` con configuración de producción
- [ ] Agregar `'[municipio]'` al array `municipiosDisponibles` en `config/index.js`
- [ ] Agregar `SIRO_[MUNICIPIO]_*` al `.env` del `api-gateway-pagos` (local)
- [ ] Agregar `SIRO_[MUNICIPIO]_*` al Azure App Service del gateway
- [ ] Agregar la URL del portal a `CORS_ALLOWED_ORIGINS` en el Azure App Service del gateway
- [ ] Crear el App Service en Azure para el municipio y pegar el JSON de `azure.[municipio].json`
- [ ] Verificar que el portal carga en `https://[municipio].alcaldia.com.ar`
- [ ] Probar el flujo completo: búsqueda de deuda → selección → pago SIRO → comprobante

---

## 7. Para mostrar en demo sin App Service propio

Si el municipio todavía no tiene su portal productivo pero querés mostrarlo en `demo.alcaldia.com.ar`:

1. Completar paso 1 (datos visuales) y paso 2 (logos)
2. En el Azure App Service de **demo**, cambiar:
   ```
   DEMO_MUNICIPIO = [municipio]
   ```
3. El portal demo cargará el branding del municipio sin tocar las credenciales de BD.
