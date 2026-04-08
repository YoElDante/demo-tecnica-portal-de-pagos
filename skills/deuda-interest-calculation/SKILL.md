---
name: deuda-interest-calculation
description: >
  Calculo de mora, intereses y validacion de reglas de deuda municipal.
  Trigger: calculate interest, calcular deuda, mora, interes municipal, debt calculation, tasa interes.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando se modifique `services/deudas.service.js`.
- Cuando haya que cambiar la formula de mora o volverla configurable.
- Cuando se agreguen nuevos conceptos que impacten montos o intereses.

## Critical Patterns

- La formula diaria debe ser explicita y comprobable.
- Si la deuda no vencio, no debe generar mora.
- La tasa debe poder venir de entorno o configuracion municipal.
- Los cambios deben preservar compatibilidad con los tipos de deuda existentes.

## Commands

```bash
npm run dev
```

## Resources

- **Documentation**: See [references/docs.md](references/docs.md) for local debt logic guidance.