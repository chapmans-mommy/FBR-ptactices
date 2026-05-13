import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-report.html',
      open: false,        // ← измените false, чтобы не открывался автоматически
      gzipSize: true,
      template: 'treemap', // ← добавьте шаблон
    }),
  ],
});