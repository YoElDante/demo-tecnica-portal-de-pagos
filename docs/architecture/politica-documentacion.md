# Política de Documentación Automatizada

> **Propósito**: Este documento establece cómo se genera, mantiene y audita la documentación en este proyecto. Es la política oficial del Portal de Pagos Municipal — aplica a todo cambio de código, sin excepciones.
>
> Si llevás esta política a otro proyecto, pedile a la IA: *"aplicá la política de documentación de demo-portal-de-pago a este proyecto"*.

---

## Principio fundamental

**Todo archivo de código debe explicarse a sí mismo.** Un desarrollador — o una IA — debe poder abrir cualquier archivo y entender qué hace, qué controla su comportamiento y qué expone, sin necesidad de leerlo completo.

## Qué se documenta

| Elemento | Audiencia | Idioma | Ubicación |
|----------|-----------|--------|-----------|
| **File headers** | Humano + IA | Español (descripciones), Inglés (keywords JSDoc) | Arriba de cada archivo `.js`, `.ejs`, `.css`, `.sh` |
| **Section markers** | Humano + IA | Español | Dentro de cada archivo, delimitando bloques lógicos |
| **Documentos en `/docs/`** | Humano | Español | Carpetas por categoría (ver taxonomía abajo) |
| **Especificaciones OpenSpec** | IA (primario) | Inglés | `openspec/specs/` y `openspec/changes/` |
| **Memoria Engram** | IA (exclusivo) | Inglés | Persistencia automática entre sesiones |

## Idioma de la documentación

- **Documentación para humanos** (`/docs/`, headers de archivos, markers): **español**.
- **Documentación para IA** (OpenSpec, Engram, metadatos de skills): **inglés**.
- Las **keywords estructurales** de JSDoc (`@description`, `Key Variables`, `Exports`) se mantienen en inglés por ser estándar de la industria.
- Las **descripciones** dentro de esos bloques van en español.

## Cómo se genera la documentación

La documentación sigue el ciclo SDD (Spec-Driven Development) del proyecto. Cada cambio pasa por estas fases:

```
sdd-apply           → Crea archivos NUEVOS CON headers y section markers
                      (el agente que escribe el código tiene todo el contexto)

sdd-verify          → Verifica que el código funcione según las specs

sdd-document-code   → AUDITA cada archivo creado o modificado:
                      - ¿Tiene header? ¿Es preciso? → Corrige si no.
                      - ¿Tiene section markers? ¿Reflejan la estructura real? → Corrige si no.
                      - Genera una tabla de auditoría (code-audit)

sdd-document-docs   → 5 verificaciones obligatorias sobre `/docs/`:
                      1. Procedencia: docs referenciados en el cambio deben actualizarse
                      2. Precisión: docs que describen archivos modificados deben re-verificarse
                      3. Checklists: ítems completados se marcan como ✅
                      4. Nuevos docs: capabilities sin cobertura reciben su documento
                      5. ADRs: decisiones de arquitectura se registran

sdd-archive         → Sincroniza specs, limpia el índice de cambios activos
```

## Taxonomía de `/docs/`

| Carpeta | Tipo de documento |
|---------|------------------|
| `architecture/` | Decisiones de diseño, ADRs, políticas, seguridad |
| `domain/` | Reglas de negocio, fórmulas, lógica del dominio |
| `guides/` | Procedimientos: deploy, onboarding, runbook |
| `integration/` | Contratos con sistemas externos |
| `_archive/` | Documentos obsoletos (nunca se borran) |

Los archivos usan `kebab-case` en minúsculas. Ver [`docs/AGENTS.md`](../AGENTS.md) para las convenciones completas.

## Estructura de un file header

Todo archivo `.js` en el proyecto debe comenzar con:

```js
/**
 * Portal de Pagos Municipal — {nombre-del-modulo}
 * @description {qué problema resuelve este archivo, en una línea}
 *
 * Key Variables:
 *   {VARIABLE} — {cómo controla el comportamiento del módulo}
 *
 * Exports:
 *   {nombre}({params}) — {breve descripción}
 */
```

**Solo se listan las variables que controlan el comportamiento principal del módulo** (no temporales, no derivadas, no acumuladores).

## Estructura de los section markers

Los marcadores de sección dividen el archivo en bloques lógicos:

```js
// ---------------------------------------------------------------------------
// Dependencias
// ---------------------------------------------------------------------------
const express = require('express');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------
router.get('/', handler);
```

Si el archivo tiene una sola sección, el marcador se nombra según el propósito del archivo (ej: `// ---- Calculadora de Impuestos ----`).

## Manifiestos que gobiernan este proceso

Estos documentos definen el formato exacto. Son la fuente de verdad:

| Manifiesto | Define |
|-----------|--------|
| `skills/_shared/file-header-manifest.md` | Formato canónico de headers por tipo de archivo |
| `skills/_shared/section-marker-manifest.md` | Marcadores de sección estándar y orden canónico |
| `docs/AGENTS.md` | Convenciones de nombres, carpetas y proceso para `/docs/` |
| `skills/doc-conventions/SKILL.md` | Skill de IA que aplica las convenciones de documentación |

## Cómo auditar documentación existente

Para verificar que todo el proyecto cumple con esta política:

1. Ejecutá un ciclo SDD completo para un cambio.
2. `sdd-document-code` auditará cada archivo del tracking register.
3. `sdd-document-docs` revisará cada documento en `/docs/`.
4. El `code-audit` y `document-report` mostrarán qué archivos/docs necesitan atención manual.

Para una auditoría masiva (todo el proyecto), pedile a la IA: *"ejecutá sdd-document-code sobre todos los archivos del proyecto"*.

## Portabilidad a otros proyectos

Esta política está diseñada para ser portable. Para aplicarla en otro proyecto:

1. Copiá los skills de documentación (`sdd-document-code`, `sdd-document-docs`, `doc-conventions`).
2. Copiá los manifiestos (`file-header-manifest.md`, `section-marker-manifest.md`).
3. Asegurate de que el `openspec/config.yaml` del proyecto destino incluya las fases `document-code` y `document-docs`.
4. Pedile a la IA: *"aplicá la política de documentación de demo-portal-de-pago a este proyecto"*.
5. La IA ejecutará `sdd-init` con las fases actualizadas, detectará el stack del proyecto y aplicará los manifiestos correspondientes.

---

> **Última actualización**: 2026-07-04 — SDD "sdd-document-phase"
> **Autor**: Portal de Pagos Municipal
