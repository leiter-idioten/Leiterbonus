import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' damit die App auch in einem Unterordner (z. B. GitHub Pages) läuft
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true },
});
