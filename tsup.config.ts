import { defineConfig, type Options } from 'tsup';
import { readFileSync, writeFileSync } from 'fs';

const USE_CLIENT_BANNER = '"use client";\n';

function addUseClientBanner(): NonNullable<Options['plugins']>[number] {
  return {
    name: 'use-client-banner',
    buildEnd({ writtenFiles }) {
      for (const file of writtenFiles) {
        if (/\.(js|mjs|cjs)$/.test(file.name)) {
          const content = readFileSync(file.name, 'utf-8');
          if (!content.startsWith('"use client"')) {
            writeFileSync(file.name, USE_CLIENT_BANNER + content);
          }
        }
      }
    },
  };
}

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
    plugins: [addUseClientBanner()],
  },
  // TanStack Query adapter (CJS + ESM)
  {
    entry: { 'query/index': 'src/query/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom', '@tanstack/react-query'],
    treeshake: true,
    plugins: [addUseClientBanner()],
  },
  // Server utilities (CJS + ESM) — RSC-compatible sub-path export
  {
    entry: { 'server/index': 'src/server/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
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
