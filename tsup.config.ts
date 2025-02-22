import { defineConfig } from 'tsup';

export default defineConfig({
  tsconfig: 'tsconfig.lib.json',
  entry: ['src/index.ts', 'src/react/index.ts', 'src/react/jsx-runtime.ts', 'src/react/jsx-dev-runtime.ts'],
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
});
