---
name: multiproject-workflow
description: >
  Coordinacion de trabajo entre el portal de pagos y proyectos relacionados como el gateway.
  Trigger: multi project, multi repo, gateway y portal, integracion multiproyecto, workflow dos repos.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando un cambio afecte simultaneamente portal y gateway.
- Cuando haya que sincronizar contrato de integracion, ramas o releases.
- Cuando se planifique validacion cruzada entre repositorios.

## Critical Patterns

- El contrato de integracion debe definirse antes de implementar en ambos lados.
- Evitar drift entre request/response documentados y payloads reales.
- Separar claramente responsabilidades del portal y del gateway.
- Versionar decisiones de integracion en `openspec/changes` si afectan comportamiento.

## Commands

```bash
git branch
git status
```

## Resources

- **Documentation**: See [references/docs.md](references/docs.md) for local multi-project workflow guidance.