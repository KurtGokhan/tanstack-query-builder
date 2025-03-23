/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const isStackblitz = process.env.SHELL === '/bin/jsh';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['tanstack-query-builder'] },
  server: { port: 3000 },
  resolve: {
    conditions: [...(isStackblitz ? ['stackblitz', 'node'] : []), 'tanstack-query-builder@dev'],
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
