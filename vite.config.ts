import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the production build works when served from any
  // subpath (e.g. GitHub Pages at /human-atlas/).
  base: './',
});
