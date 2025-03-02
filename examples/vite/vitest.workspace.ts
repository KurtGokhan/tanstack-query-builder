import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // If you want to keep running your existing tests in Node.js, uncomment the next line.
  // 'vite.config.ts',
  {
    extends: 'vite.config.ts',
    test: {
      globals: true,
      includeTaskLocation: true,
      browser: {
        enabled: true,
        provider: 'playwright',
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
  },
]);
