# 🌿 Guía de Trabajo con Ramas

> **Modelo**: GitFlow simplificado  
> **Última actualización**: 2026-03-11

---

## 📋 Índice

1. [Estructura de Ramas](#estructura-de-ramas)
2. [Flujo de Trabajo](#flujo-de-trabajo)
3. [Referencia Rápida de Comandos](#referencia-rápida-de-comandos)
4. [Reglas de Oro](#reglas-de-oro)
5. [Comandos de Emergencia](#comandos-de-emergencia)
6. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🌳 Estructura de Ramas

```
main (producción)
│
│   ← Solo recibe merges de develop
│   ← Dispara deploy a: {municipios}.alcaldia.com.ar (y futuros municipios)
│
└── develop (desarrollo/staging)
      │
      │   ← Rama principal de trabajo
      │   ← Dispara deploy a: demo.alcaldia.com.ar
      │
      ├── feature/nueva-funcionalidad
      ├── fix/corregir-bug
      └── refactor/mejorar-codigo
```

### Propósito de cada rama

| Rama | Propósito | Despliega en | Protección |
|------|-----------|--------------|------------|
| `main` | Código de producción estable | ´{municipio}.alcaldia.com.ar | Solo merges |
| `develop` | Desarrollo y pruebas | demo.alcaldia.com.ar | Trabajo activo |
| `feature/*` | Nuevas funcionalidades | - | Temporal |
| `fix/*` | Corrección de bugs | - | Temporal |
| `refactor/*` | Mejoras de código | - | Temporal |

---

## 🔄 Flujo de Trabajo

### Flujo visual

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   1. CREAR FEATURE          2. DESARROLLAR        3. TESTEAR        │
│   ─────────────────         ──────────────        ──────────        │
│                                                                     │
│   git checkout develop      git add .             merge a develop   │
│   git checkout -b           git commit            git push          │
│     feature/xxx                                                     │
│                                                                     │
│         │                        │                     │            │
│         ▼                        ▼                     ▼            │
│   ┌──────────┐            ┌──────────┐          ┌──────────┐        │
│   │ develop  │ ────────── │ feature  │ ──────── │ develop  │        │
│   └──────────┘            └──────────┘          └──────────┘        │
│                                                       │             │
│                                                       ▼             │
│                                              ┌───────────────┐      │
│                                              │ demo.alcaldia │      │
│                                              │   .com.ar     │      │
│                                              └───────────────┘      │
│                                                       │             │
│   4. VALIDAR EN DEMO        5. APROBAR                │             │
│   ──────────────────        ──────────                │             │
│                                                       │             │
│   Probar en                 merge develop → main      │             │
│   demo.alcaldia.com.ar      git push origin main      │             │
│                                                       ▼             │
│                                              ┌───────────────┐      │
│                                              │ {municipios}. │      │
│                                              │ alcaldia.com  │      │
│                                              └───────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Paso a paso detallado

#### 1️⃣ Iniciar trabajo en una funcionalidad

```bash
# Asegurarte de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear rama de feature
git checkout -b feature/nombre-descriptivo
```

#### 2️⃣ Trabajar y guardar cambios

```bash
# Ver qué archivos cambiaste
git status

# Guardar cambios
git add .
git commit -m "feat: descripción clara del cambio"

# Si necesitas hacer más commits, repite
```

#### 3️⃣ Subir y probar en Demo

```bash
# Volver a develop
git checkout develop
git pull origin develop  # Por si alguien más subió cambios

# Mergear tu feature
git merge feature/nombre-descriptivo

# Subir → dispara deploy automático a demo.alcaldia.com.ar
git push origin develop
```

#### 4️⃣ Validar en demo.alcaldia.com.ar

- Esperar 2-3 minutos a que termine el deploy
- Verificar en: https://github.com/YoElDante/demo-tecnica-portal-de-pagos/actions
- Probar la funcionalidad en https://demo.alcaldia.com.ar

#### 5️⃣ Cuando está listo para producción

```bash
# Solo cuando todo está probado y validado
git checkout main
git pull origin main
git merge develop
git push origin main  # ⚡ Dispara deploy a producción
```

#### 6️⃣ Limpiar rama de feature (opcional)

```bash
# Eliminar rama local
git branch -d feature/nombre-descriptivo

# Eliminar rama remota (si la subiste)
git push origin --delete feature/nombre-descriptivo
```

---

## ⚡ Referencia Rápida de Comandos

### Comandos básicos del día a día

```bash
# ¿En qué rama estoy?
git branch

# Cambiar a develop
git checkout develop

# Actualizar desde remoto
git pull origin develop

# Ver cambios pendientes
git status

# Guardar cambios
git add .
git commit -m "tipo: descripción"

# Subir cambios
git push origin develop
```

### Crear y mergear features

```bash
# Crear feature
git checkout develop
git checkout -b feature/mi-cambio

# Mergear feature a develop
git checkout develop
git merge feature/mi-cambio
git push origin develop

# Pasar a producción
git checkout main
git merge develop
git push origin main
```

### Convención de commits

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feat:` | Nueva funcionalidad | `feat: agregar filtro por fecha` |
| `fix:` | Corrección de bug | `fix: corregir cálculo de mora` |
| `refactor:` | Mejora sin cambio funcional | `refactor: extraer función de validación` |
| `docs:` | Documentación | `docs: actualizar README` |
| `style:` | Formato (sin cambio de código) | `style: formatear con prettier` |
| `ci:` | Cambios en CI/CD | `ci: agregar workflow para tinoco` |
| `chore:` | Tareas de mantenimiento | `chore: actualizar dependencias` |

---

## 🛡️ Reglas de Oro

| # | Regla | Por qué |
|---|-------|---------|
| 1 | **Siempre verificar** `git branch` antes de empezar | Evita commits en rama equivocada |
| 2 | **Nunca trabajar directo en main** | Main es producción |
| 3 | **Siempre hacer pull antes de empezar** | Evita conflictos |
| 4 | **Probar en demo antes de main** | Demo es tu staging |
| 5 | **Commits pequeños y descriptivos** | Facilita rollback si hay problemas |
| 6 | **Una feature, una rama** | Aísla cambios, facilita revisión |
| 7 | **`.env` y `envs/` nunca forman parte del merge** | La config real vive fuera del repo |

### Lo que NUNCA debes hacer

```bash
# ❌ NUNCA hacer push directo a main sin probar en demo
git checkout main
git commit -m "cambio"
git push origin main  # ❌ PELIGROSO

# ❌ NUNCA forzar push a main o develop
git push --force origin main  # ❌ DESTRUYE HISTORIAL
```

---

## 🚨 Comandos de Emergencia
## 🗂️ Integración con el Flujo SDD

Antes de crear una rama para un **cambio funcional relevante**, el flujo correcto es:

```
[idea] → openspec/changes/<nombre>/ → feature/<nombre> → develop → main
```

### ¿Cuándo crear un change en openspec?

| Tipo de cambio | Requiere openspec | Requiere feature branch |
|---|---|---|
| Nueva funcionalidad que afecta pagos, municipios o seguridad | ✅ Sí | ✅ Sí |
| Bug fix puntual (1-2 archivos) | ❌ No | ✅ Sí |
| Mejora de documentación | ❌ No | ❌ No — directo a develop |
| Refactor sin cambio funcional | ❌ No | ✅ Sí |
| Alta de nuevo municipio | ✅ Sí | ✅ Sí |
| Cambio de variables de entorno / config | ❌ No | ✅ Sí |

> Regla de AGENTS.md: *"Antes de implementar una feature relevante, revisar `openspec/specs` y trabajar con `openspec/changes`."*

### Arrancar un cambio funcional paso a paso

```bash
# 1. Crear el change en openspec PRIMERO
mkdir -p openspec/changes/nombre-del-cambio
# → Escribir proposal.md antes de tocar código

# 2. Crear la rama desde develop actualizado
git checkout develop
git pull origin develop
git checkout -b feature/nombre-del-cambio

# 3. Desarrollar con commits atómicos
git commit -m "feat: descripción puntual"

# 4. Mergear a develop y validar en demo
git checkout develop
git merge feature/nombre-del-cambio
git push origin develop
# → Validar en https://demo.alcaldia.com.ar

# 5. Cuando todo está aprobado → main
git checkout main
git pull origin main
git merge develop
git push origin main
```

### Nombrado de ramas según tipo de change

| Tipo | Prefijo | Ejemplo |
|------|---------|---------|
| Funcionalidad nueva | `feature/` | `feature/tasa-interes-configurable` |
| Bug fix | `fix/` | `fix/calculo-mora-redondeo` |
| Nuevo municipio | `feature/municipio-` | `feature/municipio-villa-nueva` |
| Hardening / seguridad | `feature/security-` | `feature/security-helmet-csp` |
| Documentación | directo a `develop` | — |

---

## 🚨 Comandos de Emergencia

### Si commiteaste en la rama equivocada

```bash
# Deshacer último commit (mantiene los archivos)
git reset --soft HEAD~1

# Ahora puedes cambiar de rama y commitear ahí
git stash
git checkout develop
git stash pop
git add . && git commit -m "mensaje"
```

### Si quieres descartar cambios locales

```bash
# Descartar cambios en un archivo específico
git checkout -- archivo.js

# Descartar TODOS los cambios no commiteados
git checkout -- .

# Descartar archivos nuevos no trackeados
git clean -fd
```

### Si un merge tiene conflictos

```bash
# Abortar el merge y volver al estado anterior
git merge --abort

# O resolver conflictos manualmente:
# 1. Editar archivos con conflictos
# 2. git add archivo-resuelto.js
# 3. git commit
```

### Si necesitas volver a un commit anterior

```bash
# Ver historial de commits
git log --oneline -10

# Crear rama desde un commit anterior (seguro)
git checkout -b fix/rollback abc1234

# ⚠️ PELIGROSO: Resetear al commit (perder cambios)
git reset --hard abc1234
```

### Si subiste algo que no debías

```bash
# Si aún no hiciste push, deshacer commit
git reset --soft HEAD~1

# Si ya hiciste push, crear commit que revierte
git revert HEAD
git push origin develop
```

---

## 📚 Ejemplos Prácticos

### Ejemplo 1: Agregar nueva funcionalidad de filtros

```bash
# 1. Preparar
git checkout develop
git pull origin develop
git checkout -b feature/filtros-fecha

# 2. Trabajar (editar archivos...)
git add .
git commit -m "feat: agregar selector de rango de fechas"

# Más trabajo...
git add .
git commit -m "feat: conectar filtro con API de deudas"

# 3. Probar en demo
git checkout develop
git merge feature/filtros-fecha
git push origin develop

# 4. Verificar en demo.alcaldia.com.ar
# ... esperar deploy, probar ...

# 5. Pasar a producción
git checkout main
git merge develop
git push origin main

# 6. Limpiar
git branch -d feature/filtros-fecha
```

### Ejemplo 2: Corregir bug urgente en producción

```bash
# 1. Crear hotfix desde main
git checkout main
git pull origin main
git checkout -b fix/error-calculo-mora

# 2. Corregir
git add .
git commit -m "fix: corregir división por cero en cálculo de mora"

# 3. Mergear a main directamente (es urgente)
git checkout main
git merge fix/error-calculo-mora
git push origin main

# 4. También mergear a develop para mantenerlo sincronizado
git checkout develop
git merge main
git push origin develop

# 5. Limpiar
git branch -d fix/error-calculo-mora
```

### Ejemplo 3: Trabajar en algo experimental

```bash
# 1. Crear rama experimental
git checkout develop
git checkout -b feature/nueva-pasarela-pago

# 2. Trabajar sin miedo
git add . && git commit -m "wip: probando integración con Stripe"
git add . && git commit -m "wip: más pruebas"

# 3. Si no funciona, simplemente abandonar la rama
git checkout develop
git branch -D feature/nueva-pasarela-pago  # -D fuerza eliminación

# 4. Si funciona, mergear normalmente
git checkout develop
git merge feature/nueva-pasarela-pago
git push origin develop
```

---

## 🔗 Referencias

- [INSTRUCTIVO_DEPLOY.md](../.github/workflows/INSTRUCTIVO_DEPLOY.md) - Deploy CI/CD
- [GUIA_NUEVO_MUNICIPIO.md](GUIA_NUEVO_MUNICIPIO.md) - Agregar municipio
- [Git Documentation](https://git-scm.com/doc)
