import { defineConfig } from 'tsup';

export default defineConfig([
  // Library (CJS + ESM)
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom'],
    treeshake: true,
  },
  // CLI (CJS, executable)
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
    external: [],
    platform: 'node',
  },
]);
