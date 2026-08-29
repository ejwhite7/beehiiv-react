import { defineConfig } from 'tsup';
import { readFile, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string;
};

/**
 * Prepend a "use client" directive to compiled output files.
 *
 * Why this is necessary:
 *   tsup's `banner` option feeds into esbuild, but when `treeshake: true`
 *   is enabled tsup runs Rollup as a second pass that regenerates each
 *   chunk — stripping the esbuild-injected banner in the process.
 *   Prepending the directive via `onSuccess` runs *after* the entire
 *   build pipeline (esbuild + Rollup tree-shaking) and therefore
 *   guarantees the directive appears at the very top of every target file.
 */
function prependUseClientDirective(...files: string[]) {
  return async (): Promise<void> => {
    const directive = '"use client";\n';
    await Promise.all(
      files.map(async (filePath) => {
        const contents = await readFile(filePath, 'utf8');
        if (!contents.startsWith('"use client"')) {
          await writeFile(filePath, directive + contents);
        }
      }),
    );
  };
}

export default defineConfig([
  // Library (CJS + ESM) — client-side React components, hooks, and
  // utilities.  The "use client" directive is injected after tree-shaking
  // via onSuccess because Rollup's tree-shaking pass strips esbuild
  // banners.
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom'],
    treeshake: true,
    onSuccess: prependUseClientDirective(
      join('dist', 'index.js'),
      join('dist', 'index.mjs'),
    ),
  },
  // TanStack Query adapter (CJS + ESM) — also client-side; same
  // onSuccess approach for the "use client" directive.
  {
    entry: { 'query/index': 'src/query/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom', '@tanstack/react-query'],
    treeshake: true,
    onSuccess: prependUseClientDirective(
      join('dist', 'query', 'index.js'),
      join('dist', 'query', 'index.mjs'),
    ),
  },
  // Server utilities (CJS + ESM) — RSC-compatible sub-path export.
  // No "use client" directive; these modules are designed to run in
  // React Server Components and Node.js server contexts.
  {
    entry: { 'server/index': 'src/server/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
    treeshake: true,
  },
  // CLI (CJS, executable) — Node.js CLI tool, not a React entry
  // point.  The shebang banner is required so the compiled script is
  // directly executable via npx / bin link.
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
    external: [],
    platform: 'node',
    define: {
      __PACKAGE_VERSION__: JSON.stringify(pkg.version),
    },
  },
  // Non-interactive scaffold entry used by the generated-project CI gate.
  {
    entry: { 'cli/scaffold': 'src/cli/scaffold.ts' },
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    external: [],
    platform: 'node',
  },
]);
