# 🚀 Portal de Pagos — Demo técnica

Descripción
---------
Portal de Pago Municipal (demo) — complemento del programa principal **Alcald+IA**. Permite que contribuyentes consulten deudas y generen datos para pago. Proyecto de ejemplo construido con Express + Sequelize y conexión a Azure SQL.

Repositorio: https://github.com/YoElDante/demo-tecnica-portal-de-pagos

Características
---------
- ✅ Búsqueda de contribuyentes por DNI
- ✅ Consulta de deudas pendientes (saldo != 0)
- ✅ Endpoint para generar JSON de pago a partir de transacciones seleccionadas
- ✅ Lista de contribuyentes con conteo de deudas pendientes
- 🖥 Interfaz simple con EJS para búsqueda por DNI

Tecnologías
---------
- Node.js (ej. v22.x)
- Express
- Sequelize (ORM)
- tedious (driver MSSQL para Node)
- EJS (vistas)
- dotenv (variables de entorno)
- Azure SQL Database (destino de la conexión)

Instalación
---------
1. Clonar:
   git clone https://github.com/YoElDante/demo-tecnica-portal-de-pagos
2. Entrar al proyecto:
   cd c:\workspace\proyecto-minimo\minimo-sql
3. Instalar dependencias:
   npm install

Variables de entorno (.env)
---------
Asegúrate de tener un archivo `.env` en la raíz con, como mínimo:
- DB_HOST=XXXXXXXX.database.windows.net
- DB_NAME=PDBpgII6eODRxh7
- DB_USER=XXXXAdmin
- DB_PASS=TuPasswordAqui
- DB_DIALECT=mssql
- PORT=3000

(Adaptar valores según tu entorno)

Notas de conexión a Azure
---------
- Driver usado: `tedious` (instalado en package.json).
- Sequelize dialect: `mssql`.
- Recomendaciones:
  - Mantener `dialectOptions.options.encrypt = true` para Azure.
  - Para pruebas locales con problemas TLS, `trustServerCertificate: true` temporalmente, pero no en producción.
  - Asegurar que la IP cliente esté permitida en el firewall de Azure SQL.
  - Usar credenciales seguras y no exponer el `.env` en VCS.

Scripts útiles (package.json)
---------
- npm run dev — iniciar servidor en modo watch (node --watch ./bin/www)
- npm start — iniciar servidor
- npm run testDB — test de conexión (node ./tests/connection.db.test.js)

Rutas de la API
---------
Base: /api

- GET /api/  
  - Información y lista de endpoints disponibles.

- GET /api/clientes  
  - Lista paginada de clientes  
  - Query params: `limit`, `offset`

- GET /api/clientes/deudas/:codigo  
  - Obtener deudas por código, dominio o DNI (si se pasa DNI busca primero en Clientes).  
  - Responde: { codigo, nombre, apellido, registrosEncontrados, deudas: [...] }

- GET /api/clientes/buscar/dni/:dni  
  - Buscar cliente por DNI y sus deudas pendientes.

- POST /api/clientes/generar-pago  
  - Genera JSON de pago a partir de IDs transaccionales.  
  - Body: { ids: [4906, 4907] }

- GET /api/clientes/contribuyentes  
  - Lista contribuyentes con `codigo`, `nombreCompleto`, `documento` y `cantidadDeudas` (número de registros con saldo != 0).  
  - Query params: `limit`, `offset`

Interfaz (UI)
---------
- GET / — formulario EJS para buscar por DNI (vista en `views/index.ejs`)
- POST /buscar — procesa búsqueda por DNI y renderiza resultados

Buenas prácticas y troubleshooting
---------
- Si ves: `DeprecationWarning: The logging-option should be either a function or false` — cambiar en `config/database.config.js`:
  ```js
  logging: false
  // o
  logging: (msg) => console.log(msg)
  ```
- Si sale `Cannot find module '../models'` — verificar que `models/model.index.js` exista y sea exportado con CommonJS (`module.exports = { sequelize, Cliente, ClientesCtaCte }`) y que las rutas relativas sean correctas.
- Para problemas de TLS/SSL al conectar Azure SQL, revisar `encrypt` y `trustServerCertificate` en `dialectOptions`.

Ejemplo: probar conexión rápida
---------
Desde la raíz del proyecto:
1. npm run testDB  
   Debe mostrar: `Conexión a la BD: OK`

Cómo contribuir
---------
1. Abrir issue con bug o feature request.
2. Crear branch con cambios y abrir PR.

Licencia
---------
MIT

Contacto
---------
Proyecto demo por Dante Marcos Delprato — repositorio: https://github.com/YoElDante/demo-tecnica-portal-de-pagos
