---
name: azure-multiappservice-payment
description: >
  Despliegue del portal de pagos por municipio en Azure App Service.
  Trigger: deploy portal, azure app service municipio, deploy municipio, app service portal pagos, azure deploy municipal portal.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando haya que desplegar una instancia municipal del portal en Azure.
- Cuando se necesite definir variables de entorno, firewall SQL y runtime de App Service.
- Cuando haya que repetir el despliegue para otro municipio sin cambiar el codigo base.

## Critical Patterns

- Un App Service por municipio con variables de entorno propias.
- `NODE_ENV`, `MUNICIPIO`, datos SQL y `WEBHOOK_SECRET` deben configurarse por entorno.
- Validar conectividad con Azure SQL antes de dar por listo el despliegue.
- No mezclar secretos en workflows ni en archivos versionados.
- Si se despliega mas de un municipio, mantener naming consistente y URLs publicas correctas.

## Commands

```bash
az group create --name <rg> --location brazilsouth
az appservice plan create --name <plan> --resource-group <rg> --sku B1 --is-linux
az webapp create --name <app> --resource-group <rg> --plan <plan> --runtime "NODE:20-lts"
```

## Resources

- **Documentation**: See [references/docs.md](references/docs.md) for local Azure deployment guidance.