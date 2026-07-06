# Matriz Manual 7x5 — refactor-frontend-js-modular

> Objetivo: completar validación funcional manual en navegador real para habilitar `sdd-archive`.
> Estado: pendiente de ejecución manual.

## Escenarios (7)

Se realizo el test solo para npm run dev:elmanzano

## Municipio: `elmanzano`

Comando: `npm run dev:elmanzano`

Primer error grabe, corri npm run dev:elmanzano pero se subio la version demo al puerto 4000 con la base de datos de prueba y logos de clachin

| Escenario | 
|---|---|---|---|
| 1. Búsqueda DNI | ☐ Pass 
| 2. Checkbox toggle | ☐ Pass 
| 3. Cálculo total | ☐ Pass
| 4. Generar Ticket | ☐ Pass
| 5. Descargar PDF | ☐ Pass
| 6. Iniciar Pago | ☐ Fail - Dice que no hay forma de conectar a la api de pago, habia que probar las conexiones a gateway.alcaldia.com.ar que en estos momentos corre perfectamente en linea con azure
| 7. Demo panel toggle | si funciona correctamente
## Gate de salida para `sdd-archive`

- Todos los escenarios requeridos en todos los municipios con resultado **Pass**.
- Sin errores de consola bloqueantes en flujo principal.
- Si hay fallos: documentar incidencia y volver a `apply` antes de archivar.
