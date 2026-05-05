import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // In production build, assets are served from Django's /static/ prefix.
  // In dev mode, Vite dev server serves everything from /.
  base: command === 'build' ? '/static/' : '/',
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
}));
