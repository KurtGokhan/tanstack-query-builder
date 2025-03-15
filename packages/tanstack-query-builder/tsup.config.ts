import { defineConfig } from 'tsup';

export default defineConfig({
  tsconfig: 'tsconfig.lib.json',
  entry: ['src/index.ts', 'src/http/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2024',
  bundle: true,
  dts: {
    compilerOptions: {
      composite: false,
    },
  },
  clean: true,
  minify: false,
  sourcemap: true,
});
