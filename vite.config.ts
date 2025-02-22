import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [viteReact({})],
  test: {
    globals: true,
    typecheck: {
      enabled: true,
    },
  },
});
