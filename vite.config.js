import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// App multipágina: cada HTML es una entrada independiente.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    target: 'es2022', // permite top-level await en los módulos de página
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        propiedad: resolve(import.meta.dirname, 'propiedad.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        portal: resolve(import.meta.dirname, 'portal.html'),
        crm: resolve(import.meta.dirname, 'crm.html'),
      },
    },
  },
});
