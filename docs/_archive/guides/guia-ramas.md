# Estrategia de Ramas (ARCHIVADO - Julio 2026)

> **Estado**: 🗄️ Archivado — este documento describe la estrategia de ramas anterior.  
> **Fecha de archivado**: 2026-07-05  
> **Motivo**: Simplificación a una única rama `main` para todo el ciclo de vida (desarrollo, demo, producción).  
> **Estrategia actual**: Solo existe `main`. Todo cambio se implementa directamente en `main`.

---

## Estrategia Anterior (develop → main)

El proyecto usaba un modelo de dos ramas:

| Rama | Propósito |
|------|-----------|
| `develop` | Rama activa de trabajo. Todos los cambios nuevos partían desde `develop`. |
| `main` | Producción. Solo recibía merges aprobados desde `develop`. |

### Flujo de trabajo

1. `git checkout develop`
2. `git pull origin develop`
3. `git checkout -b feature/<nombre>`
4. Desarrollar y commitear
5. Mergear a `develop` vía PR
6. Validar en demo
7. Mergear `develop` → `main` para producción

### Reglas

- `.env` y `envs/` no se versionan ni se usan como mecanismo de promoción entre ramas.
- La configuración de demo y producción se define por entorno (variables de App Service).
- `MUNICIPIO` determina qué configuración de municipio se carga.

### Ramas feature (convención histórica)

- Formato: `feature/<nombre>`
- Ejemplo: `feature/resolver-auditoria-03072026/pr4-log-sanitization`
- Workflow stacked PR: pr1 → pr2 → pr3 → pr4

---

## Razón del cambio

Se unificó todo en `main` para simplificar el flujo de trabajo. Con un equipo pequeño y deploys por municipio gestionados por configuración de entorno, la separación `develop`/`main` agregaba complejidad innecesaria.
