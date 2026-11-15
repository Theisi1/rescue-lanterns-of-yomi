import { defineConfig } from 'vite';

// base relativa: permite servir la carpeta dist/ desde cualquier ruta (ZIP ejecutable).
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 1600, // Phaser pesa ~1.2 MB minificado
    assetsInlineLimit: 0 // los niveles JSON se cargan con el Loader de Phaser, no como data URI
  }
});
