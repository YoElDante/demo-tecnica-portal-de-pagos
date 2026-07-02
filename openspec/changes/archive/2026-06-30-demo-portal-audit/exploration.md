## Exploration: demo-portal-de-pago — Audit Completo

### Current State

El proyecto es un portal web municipal Node.js/Express con arquitectura MVC bien definida que soporta múltiples municipios desde un solo código base. Tiene 6 skills instalados, 4 cambios OpenSpec activos y una estructura de documentación extensa (16+ archivos .md). La integración con el gateway de pagos está completa con webhook JWT, redirect exchange code pattern, y modelo TicketsPago formal en BD.

### Affected Areas

| Path | Relevance |
|------|-----------|
| `demo-portal-de-pago/AGENTS.md` | Necesita correcciones y secciones faltantes |
| `demo-portal-de-pago/README.md` | Contradice AGENTS.md en estrategia de ramas |
| `demo-portal-de-pago/docs/` | Documentación extensa, algunos archivos referenciados que no existen |
| `demo-portal-de-pago/controllers/payment.controller.js` | 11 console.log dispersos, debug mode en producción |
| `demo-portal-de-pago/routes/users.js` | Boilerplate de Express Generator (respond with a resource) |
| `demo-portal-de-pago/tests/` | Solo 1 test de conexión a BD |
| `demo-portal-de-pago/openspec/` | 4 cambios con proposal/design/tasks completos |
| `demo-portal-de-pago/services/paymentGateway.service.js` | 3 TODOs (PagoTic, MacroPay, checkPaymentStatus) |

### Approaches

1. **Fix AGENTS.md + crear status report** — Corregir inconsistencias, agregar secciones faltantes, consolidar estado del proyecto en un reporte
   - Pros: Acción concreta, resuelve contradicción develop/main, documenta el estado real
   - Cons: No toca deuda técnica subyacente
   - Effort: Low

2. **Audit + Fix + Security Hardening bundle** — Incluir helmet, HTTPS, y arreglos de AGENTS.md en un solo cambio
   - Pros: Aborda riesgos de seguridad de producción de una vez
   - Cons: Mezcla documentación con implementación — más difícil de revisar
   - Effort: Medium

3. **Audit solo (proposal para que el orquestador decida prioridades)** — Entregar hallazgos y dejar que el roadmap se decida en proposal
   - Pros: No fuerza decisiones, permite priorizar basado en datos
   - Cons: Un paso adicional antes de la acción
   - Effort: Low

### Recommendation

**Approach 1** — Arreglar AGENTS.md primero (es la fuente de verdad para los agentes IA y tiene una contradicción operativa grave develop vs main). Luego en la misma propuesta incluir la creación de un status report comprehensivo que documente el estado real del proyecto. Las correcciones de seguridad y tests pueden ser cambios separados.

### Findings Detail

**AGENTS.md Issues:**
1. Contradicción develop vs main (Regla 11 dice develop eliminada; README.md línea 337 dice que el trabajo parte de develop)
2. Salto de numeración 5→7 en flujo SDD
3. Falta sección de Testing/Security
4. No incluye `npm run dev:calchinoeste` en comandos
5. README.md dice Node.js v22.x, AGENTS.md dice Node.js 20+
6. No documenta el mantenimiento automático de tickets (startTicketsMaintenance en app.js)

**Documentation:**
- 16+ archivos .md, buena organización
- docs/README.md con índice por categorías
- Contrato de integración muy completo (368 líneas)
- Falta: checklist de lanzamiento, plan de pruebas

**Technical Debt:**
- 1 solo test (conexión a BD)
- console.log en controllers (11 en payment.controller.js)
- Helmet no instalado
- 3 TODOs en paymentGateway.service.js
- users.js es boilerplate sin implementar

**Integration Readiness: ✅ Excelente**
- Webhook JWT con rotación diaria de secretos
- Redirect exchange code pattern implementado
- Idempotencia en webhook
- Secretos separados (webhook vs exchange)
- Multi-municipio por configuración

### Risks

1. **Contradicción ramas develop/main** entre AGENTS.md y README.md — riesgo operativo grave si un agente IA sigue la fuente equivocada
2. **Sin tests automatizados** — cualquier cambio puede romper funcionalidad sin detección
3. **Security hardening pendiente** — portal sirve sin helmet en producción potencialmente
4. **console.log en controllers** — el logger formal existe pero no se usa consistentemente

### Ready for Proposal

Yes — Exploración completa. Recomiendo lanzar propuesta para corrección de AGENTS.md + status report.
