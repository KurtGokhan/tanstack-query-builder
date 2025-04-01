/// <reference types="vitest" />

import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const isStackblitz = process.env.SHELL === '/bin/jsh';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ target: 'react', autoCodeSplitting: true }), react()],
  optimizeDeps: { exclude: ['tanstack-query-builder'] },
  server: { port: 3000 },
  resolve: {
    alias: {
      src: path.resolve(import.meta.dirname, 'src'),
    },
    conditions: [...(isStackblitz ? ['stackblitz', 'node'] : ['browser']), 'tanstack-query-builder@dev'],
  },
  test: {
    globals: true,
    includeTaskLocation: true,
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: !!process.env.CI || process.argv.includes('--run'),
      viewport: { width: 1024, height: 768 },
      // https://vitest.dev/guide/browser/playwright
      instances: [
        {
          browser: 'chromium',
          globals: true,
          includeTaskLocation: true,
        },
      ],
    },
  },
});
