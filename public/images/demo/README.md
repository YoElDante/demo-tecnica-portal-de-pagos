# Demo - Imágenes del Municipio

Esta carpeta contiene las imágenes específicas del entorno de demostración.

## Estándar de nombres

Todas las imágenes deben seguir el formato: `{municipio}-{tipo}.{ext}`

| Archivo | Uso |
|---------|-----|
| `demo-logo-web.webp` | Logo principal para la web |
| `demo-logo-ticket.webp` | Logo para el PDF de deuda (opcional) |
| `demo-favicon.ico` | Favicon del navegador |

## Estado actual

Actualmente el municipio demo utiliza las imágenes de `../common/`:
- `alcaldiaLogo.webp` - Logo por defecto de Alcald+IA
- `default-favicon.svg` - Favicon por defecto

## Para personalizar

1. Crear los archivos con el estándar de nombres:
   - `demo-logo-web.webp` (200x80 px)
   - `demo-favicon.ico` (32x32 px)
   - `demo-logo-ticket.webp` (opcional, 150x60 px)

2. Actualizar las rutas en `config/municipalidad.config.demo.js`
