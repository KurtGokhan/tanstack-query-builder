import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [viteReact({})],
  test: {
    exclude: ['node_modules', 'dist', 'build', 'examples', 'packages', 'website'],
    globals: true,
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
    },
  },
});
