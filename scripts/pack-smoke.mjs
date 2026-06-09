/**
 * Packaging smoke test.
 *
 * Packs the built package into a tarball, installs it into a throwaway
 * project, and verifies that all three entry points resolve and expose
 * their key exports under BOTH module systems:
 *
 *   - CommonJS:  require('beehiiv-react'), require('beehiiv-react/query'),
 *                require('beehiiv-react/server')
 *   - ESM:       import('beehiiv-react'), import('beehiiv-react/query'),
 *                import('beehiiv-react/server')
 *
 * This catches `exports`-map / build-output mismatches (e.g. a `require`
 * condition pointing at a file tsup does not emit) that typecheck, lint,
 * unit tests, and the build itself all miss. Run via `npm run test:pack`
 * after `npm run build`.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const workDir = mkdtempSync(join(tmpdir(), 'beehiiv-pack-smoke-'));

/** Run a command, inheriting stderr so failures are visible in CI logs. */
function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf-8', ...opts });
}

try {
  console.log('Packing beehiiv-react...');
  const packOutput = run('npm', ['pack', '--pack-destination', workDir], { cwd: packageRoot });
  const tarball = join(workDir, packOutput.trim().split('\n').pop());

  console.log('Installing tarball into a throwaway project...');
  writeFileSync(
    join(workDir, 'package.json'),
    JSON.stringify({ name: 'pack-smoke', private: true, version: '0.0.0' }),
  );
  run(
    'npm',
    [
      'install',
      '--no-save',
      '--no-audit',
      '--no-fund',
      tarball,
      'react',
      'react-dom',
      '@tanstack/react-query',
    ],
    { cwd: workDir },
  );

  const cjsCheck = `
    const main = require('beehiiv-react');
    const query = require('beehiiv-react/query');
    const server = require('beehiiv-react/server');
    if (typeof main.useSubscribe !== 'function') throw new Error('main: useSubscribe missing');
    if (typeof query.beehiivKeys !== 'object') throw new Error('query: beehiivKeys missing');
    if (typeof server.createBeehiivClient !== 'function') throw new Error('server: createBeehiivClient missing');
    console.log('CJS OK');
  `;
  const esmCheck = `
    const main = await import('beehiiv-react');
    const query = await import('beehiiv-react/query');
    const server = await import('beehiiv-react/server');
    if (typeof main.useSubscribe !== 'function') throw new Error('main: useSubscribe missing');
    if (typeof query.beehiivKeys !== 'object') throw new Error('query: beehiivKeys missing');
    if (typeof server.createBeehiivClient !== 'function') throw new Error('server: createBeehiivClient missing');
    console.log('ESM OK');
  `;

  console.log(run('node', ['-e', cjsCheck], { cwd: workDir }).trim());
  console.log(run('node', ['--input-type=module', '-e', esmCheck], { cwd: workDir }).trim());
  console.log('Packaging smoke test passed.');
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
