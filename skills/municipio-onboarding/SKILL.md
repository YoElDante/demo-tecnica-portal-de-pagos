---
name: municipio-onboarding
description: >
  Alta de un nuevo municipio en el portal multi-municipio.
  Trigger: add new municipality, nuevo municipio, agregar municipio, onboarding municipio, alta municipio.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando haya que sumar un municipio nuevo al portal.
- Cuando se necesite preparar configuracion, branding y script de desarrollo por municipio.
- Cuando se quiera validar que el proyecto sigue siendo multi-municipio y no una variante hardcodeada.

## Critical Patterns

- Crear `config/municipalidad.config.{municipio}.js` a partir de una configuracion existente.
- Registrar el municipio en `config/index.js`.
- Crear carpeta en `public/images/{municipio}/` con nombres estandarizados.
- Agregar `envs/.env.{municipio}` y script `dev:{municipio}` en `package.json`.
- Verificar siempre el flujo local usando el script del nuevo municipio.
- Si el cambio requiere despliegue, complementar con la skill `azure-multiappservice-payment`.

## Commands

```bash
npm run dev:{municipio}
npm run testDB
```

## Resources

- **Documentation**: See [references/docs.md](references/docs.md) for local onboarding guidance.