# Proposal: Arreglar boton "Ir a Pagar" no responde (mismatch header CSRF)

## Intención

El boton "Ir a Pagar" no responde en produccion. La causa raiz es un mismatch en el nombre del header CSRF: el frontend envia `CSRF-Token` (segun la spec) pero el middleware en `middlewares/csrf.js:57` valida `req.headers['x-csrf-token']` (nombre distinto). Como Node.js loweracea los headers, `CSRF-Token` se convierte en `csrf-token`, pero el middleware nunca lo lee. Adicionalmente, `/generar-ticket` no envia header CSRF en absoluto. En desarrollo (`SECURITY_CSRF_ENABLED=false` por defecto) el bug no se manifiesta, lo que impide detectarlo localmente.

## Alcance

### Dentro del Alcance
- Corregir `middlewares/csrf.js:57-58`: cambiar `req.headers['x-csrf-token']` a `req.headers['csrf-token']`
- Anadir header `CSRF-Token` al fetch POST `/generar-ticket` en `public/javascripts/deudas.js:247-256`
- Verificar en staging con `SECURITY_CSRF_ENABLED=true` antes de merges a `main`

### Fuera del Alcance
- No renombrar el header en el frontend (la spec `csrf-protection` ya define `CSRF-Token`)
- No anadir tests automatizados del flujo CSRF (scope futuro)
- No modificar la generacion/inyeccion del token (ya es correcta via `res.locals.csrfToken`)
- No alterar el orden del middleware CSRF ni la configuracion de exenciones

## Capacidades

### Capacidades Nuevas
- Ninguna

### Capacidades Modificadas
- `csrf-protection`: El requisito "Token CSRF en requests AJAX/fetch" ya describe el header `CSRF-Token` correctamente en la spec; la implementacion (middleware `getTokenFromRequest`) no cumple el escenario "Fetch POST con header CSRF es aceptado". El delta spec corrige la implementacion para alinearla con la spec existente.

## Enfoque

Fix quirurgico de ~5 lineas en 2 archivos, siguiendo la Recomendacion del explore (Approach #1 + #4):
1. `middlewares/csrf.js`: leer `req.headers['csrf-token']` en lugar de `req.headers['x-csrf-token']`
2. `public/javascripts/deudas.js`: anadir `'CSRF-Token': getCsrfToken()` al objeto `headers` del fetch a `/generar-ticket`

No se cambian contratos, bodies ni specs de dominio. El header ya esta definido en la spec `csrf-protection` (criterio #6).

## Areas Afectadas

| Area | Impacto | Descripcion |
|------|---------|-------------|
| `middlewares/csrf.js` | Modified | `getTokenFromRequest` lee el header correcto |
| `public/javascripts/deudas.js` | Modified | `generarTicket()` envia header CSRF |

## Riesgos

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| El bug solo se reproduce en produccion con CSRF activo | Alta | Verificar en staging con `SECURITY_CSRF_ENABLED=true` |
| Sin tests automatizados que cubran el flujo CSRF | Media | Registrar deuda tecnica; no se anaden tests en este cambio |
| Otros fetch sin CSRF quedan sin cubrir | Baja | Auditar endpoints POST restantes en follow-up |

## Plan de Rollback

Revertir los 2 commits (uno por archivo). Al revertir `csrf.js`, el middleware vuelve a validar `x-csrf-token` y el bug restaurado solo afecta produccion. Rollback seguro porque el cambio no toca base de datos ni contratos.

## Dependencias

- Spec `openspec/specs/csrf-protection/spec.md` (ya documenta el header `CSRF-Token`)
- Fase previa: security-hardening (`resolver-auditoria-03072026`) que introdujo CSRF

## Criterios de Exito

- [ ] En staging con `SECURITY_CSRF_ENABLED=true`, el boton "Ir a Pagar" redirige al gateway
- [ ] En staging con `SECURITY_CSRF_ENABLED=true`, `/generar-ticket` responde 200 con CSRF valido
- [ ] En staging, POST a `/pago/iniciar` sin CSRF retorna 403
- [ ] En desarrollo (`SECURITY_CSRF_ENABLED=false`) el flujo sigue funcionando sin cambios

## Proposal question round

Preguntas para afinar el PRD antes de pasar a specs (responder, saltar o corregir el encuadre):

1. **Business problem**: el boton "Ir a Pagar" roto en produccion impacta la recaudacion municipal hoy, o este cambio es preventivo antes de un deploy?
2. **Target users**: solo contribuyentes en produccion se ven afectados, o hay municipios especificos donde ya se detectaron tickets/reportes?
3. **Business rules**: hay alguna razon (compliance, auditoria de seguridad) para mantener el header `x-csrf-token` legacy como fallback ademas del nuevo `csrf-token`?
4. **Product outcome**: tras el fix, esperamos que todo flujo AJAX POST (incluyendo `/generar-ticket` y `/pago/iniciar`) funcione en produccion sin cambios UX. Confirmamos que no hay otros endpoints POST client-side fuera de estos dos?
5. **Edge cases**: que pasa si una sesion tiene un token CSRF expirado (cookie caducada) al presionar "Ir a Pagar"? Redirigimos a re-buscar por DNI o mostramos error en linea?

Asunciones por defecto si no hay respuesta:
- Cambio.correctivo de bug en produccion (no preventivo)
- Afecta a todos los municipios por igual (multi-municipio)
- No se mantiene fallback `x-csrf-token` (la spec no lo contempla)
- Solo `/generar-ticket` y `/pago/iniciar` son POST client-side relevantes