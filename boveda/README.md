# Bóveda de Archivos

Herramienta web para cifrar fotos y archivos con contraseña directamente en el navegador. Ningún archivo se envía a un servidor.

**Usar:** https://cadafiq-eng.github.io/mis_colecciones/boveda/

## Cómo funciona

- Cifrado AES-256-GCM con la Web Crypto API del navegador.
- Clave derivada de la contraseña con PBKDF2-SHA-256 (600 000 iteraciones) y sal aleatoria de 128 bits.
- El resultado es un archivo `nombre.cifrado.txt` (Base64). Sin la contraseña es ilegible y no hay forma de recuperarla.
- Varios archivos se cifran juntos en un solo paquete.

## Instalar en iPhone

Abra la dirección en Safari → Compartir → **Agregar a inicio**. Funciona sin conexión.

## Recomendaciones

Después de cifrar, borre el original (y vacíe “Eliminados recientemente” en Fotos). Guarde el `.cifrado.txt` donde prefiera: iCloud Drive, Google Drive o una USB.
