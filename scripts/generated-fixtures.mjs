/**
 * Generate every supported transport combination, install the packed package,
 * and verify each fixture with strict TypeScript plus a production Next build.
 */

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const require = createRequire(import.meta.url);
const workDir = mkdtempSync(join(tmpdir(), 'beehiiv-generated-fixtures-'));
const fixtureRoot = join(workDir, 'fixtures');
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, 'package.json'), 'utf8'),
);
const fixtureEnv = {
  ...process.env,
  BEEHIIV_API_KEY: 'fixture_server_only_key',
  NEXT_TELEMETRY_DISABLED: '1',
};

const combinations = [
  { name: 'api-routes', apiRoutes: true, serverActions: false },
  { name: 'server-actions', apiRoutes: false, serverActions: true },
  { name: 'both-transports', apiRoutes: true, serverActions: true },
  { name: 'neither-transport', apiRoutes: false, serverActions: false },
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: workDir,
    env: fixtureEnv,
    encoding: 'utf8',
    stdio: 'inherit',
    ...options,
  });
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFixtureShell(fixtureDir, combination, tarball) {
  writeJson(join(fixtureDir, 'package.json'), {
    name: `beehiiv-fixture-${combination.name}`,
    private: true,
    version: '0.0.0',
    scripts: {
      typecheck: 'tsc --noEmit',
      build: 'next build',
    },
    dependencies: {
      'beehiiv-react': `file:${tarball}`,
      next: '15.5.24',
      react: '18.3.1',
      'react-dom': '18.3.1',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      typescript: '^5.0.0',
    },
  });
  writeJson(join(fixtureDir, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2020',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: false,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  });
  writeFileSync(join(fixtureDir, 'next-env.d.ts'), '/// <reference types="next" />\n');
  mkdirSync(join(fixtureDir, 'app'), { recursive: true });
  writeFileSync(
    join(fixtureDir, 'app', 'layout.tsx'),
    `export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}\n`,
  );
  const componentUsage =
    combination.apiRoutes || combination.serverActions
      ? `import { SubscribeWrapper } from '@/components/beehiiv/SubscribeWrapper';

export default function Page() {
  return <main><SubscribeWrapper /></main>;
}\n`
      : `export default function Page() {
  return <main>Generated fixture</main>;
}\n`;
  writeFileSync(join(fixtureDir, 'app', 'page.tsx'), componentUsage);
}

try {
  mkdirSync(fixtureRoot, { recursive: true });
  const packOutput = execFileSync(
    'npm',
    ['pack', '--json', '--pack-destination', workDir],
    { cwd: packageRoot, encoding: 'utf8' },
  );
  const [{ filename }] = JSON.parse(packOutput);
  const tarball = join(workDir, filename);

  const scaffoldModule = require(
    join(packageRoot, 'dist', 'cli', 'scaffold.js'),
  );

  for (const combination of combinations) {
    const fixtureDir = join(fixtureRoot, combination.name);
    mkdirSync(fixtureDir, { recursive: true });
    writeFixtureShell(fixtureDir, combination, tarball);
    await scaffoldModule.scaffoldIntegration({
      outputDir: fixtureDir,
      publicationId: 'pub_generated_fixture',
      publicationName: 'Generated Fixture',
      customFields: [],
      features: {
        apiRoutes: combination.apiRoutes,
        serverActions: combination.serverActions,
      },
    });
  }

  writeJson(join(workDir, 'package.json'), {
    name: 'beehiiv-generated-fixture-workspace',
    private: true,
    version: '0.0.0',
    workspaces: ['fixtures/*'],
  });

  console.log('Installing the packed package into generated Next fixtures...');
  run('npm', ['install', '--no-audit', '--no-fund', '--package-lock=false']);

  const cjsCheck = `
    const main = require('beehiiv-react');
    const server = require('beehiiv-react/server');
    if (typeof main.useSubscribe !== 'function') throw new Error('CJS main export missing');
    if (typeof server.createBeehiivClient !== 'function') throw new Error('CJS server export missing');
  `;
  const esmCheck = `
    const main = await import('beehiiv-react');
    const server = await import('beehiiv-react/server');
    if (typeof main.useSubscribe !== 'function') throw new Error('ESM main export missing');
    if (typeof server.createBeehiivClient !== 'function') throw new Error('ESM server export missing');
  `;
  run('node', ['-e', cjsCheck]);
  run('node', ['--input-type=module', '-e', esmCheck]);

  for (const combination of combinations) {
    console.log(`Typechecking ${combination.name}...`);
    run('npm', ['run', 'typecheck', '--workspace', `beehiiv-fixture-${combination.name}`]);
    console.log(`Building ${combination.name}...`);
    run('npm', ['run', 'build', '--workspace', `beehiiv-fixture-${combination.name}`]);
  }

  console.log(
    `Generated fixture gate passed for beehiiv-react ${packageJson.version}.`,
  );
} finally {
  if (process.env.KEEP_GENERATED_FIXTURES === '1') {
    console.log(`Preserved generated fixtures at ${workDir}`);
  } else {
    rmSync(workDir, { recursive: true, force: true });
  }
}
