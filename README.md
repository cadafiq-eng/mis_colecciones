# MisColecciones PWA

Aplicación web progresiva (PWA) para guardar y organizar enlaces y notas
en colecciones. Funciona en cualquier navegador, sin extensiones.

## Archivos
```
index.html      ← App completa (todo en un solo archivo)
manifest.json   ← Configuración PWA
sw.js           ← Service worker (modo offline)
icons/          ← Íconos para pantalla de inicio
```

## Cómo usar (sin servidor)

Abre `index.html` directamente en cualquier navegador.
Los datos se guardan en localStorage del navegador.

## Cómo publicar en GitHub Pages (recomendado)

1. Crea un repositorio en GitHub (puede ser privado)
2. Sube todos los archivos a la rama `main`
3. Ve a Settings → Pages → Source: `main / root`
4. Tu app estará en: `https://TU-USUARIO.github.io/REPO/`

Con GitHub Pages activo, podrás instalar la app desde cualquier
dispositivo móvil usando "Agregar a pantalla de inicio".

## Cómo instalar en móvil (iOS Safari)

1. Abre la URL de tu GitHub Pages en Safari
2. Toca el botón Compartir (📤)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo! Funciona como app nativa

## Cómo instalar en Android (Chrome)

1. Abre la URL en Chrome
2. Aparece un banner "Instalar" automáticamente, o bien
3. Menú (⋮) → "Agregar a pantalla de inicio"

## Compatibilidad con la extensión de Chrome

El formato de exportación/importación (.json) es 100% compatible
con la extensión MisColecciones v2. Puedes mover colecciones
entre la PWA y la extensión sin pérdida de datos.

## Sincronización entre dispositivos

Sin servidor: usa Exportar (⬇) e Importar (⬆) manualmente,
o guarda el JSON en Google Drive y ábrelo desde ahí.
