/** CLI feature-selection contract tests. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import ts from 'typescript';
import { runInit } from '../../commands/init.js';
import { promptForApiKey } from '../../auth/api-key.js';
import { selectFeatures, selectPublication } from '../../prompts/index.js';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const originalReadFileSync = actual.readFileSync;

  return {
    ...actual,
    readFileSync: (...args: Parameters<typeof actual.readFileSync>) => {
      if (typeof args[0] === 'string') {
        args[0] = args[0].replace(/\/src\/templates\//, '/templates/');
      }
      return originalReadFileSync(...(args as [never, ...never[]]));
    },
  };
});

vi.mock('../../auth/api-key.js', () => ({
  promptForApiKey: vi.fn().mockResolvedValue({
    apiKey: 'test_api_key',
    publications: [
      { id: 'pub_features', name: 'Features', created: 1, timezone: 'UTC' },
    ],
  }),
}));

vi.mock('../../prompts/index.js', () => ({
  confirmOverwrite: vi.fn().mockResolvedValue(true),
  resolveBlogConfig: vi.fn(),
  selectFeatures: vi.fn(),
  selectPublication: vi.fn().mockResolvedValue({
    id: 'pub_features',
    name: 'Features',
    created: 1,
    timezone: 'UTC',
  }),
}));

function collectSourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(absolute));
    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

function expectSourcesToCompile(files: string[]): void {
  for (const file of files) {
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: file,
      reportDiagnostics: true,
    });
    expect(result.diagnostics ?? [], file).toEqual([]);
  }
}

describe('CLI feature combinations', () => {
  let outputDir: string;

  beforeEach(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beehiiv-features-'));
    vi.mocked(promptForApiKey).mockResolvedValue({
      apiKey: 'test_api_key',
      publications: [
        { id: 'pub_features', name: 'Features', created: 1, timezone: 'UTC' },
      ],
    });
    vi.mocked(selectPublication).mockResolvedValue({
      id: 'pub_features',
      name: 'Features',
      created: 1,
      timezone: 'UTC',
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      }),
    );
  });

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    { label: 'API routes only', apiRoutes: true, serverActions: false },
    { label: 'Server Actions only', apiRoutes: false, serverActions: true },
    { label: 'both transports', apiRoutes: true, serverActions: true },
    { label: 'neither transport', apiRoutes: false, serverActions: false },
  ])('generates a self-contained $label scaffold', async (features) => {
    vi.mocked(selectFeatures).mockResolvedValueOnce(features);

    await runInit({ outputDir });

    const apiRoute = path.join(
      outputDir,
      'app/api/beehiiv/subscribe/route.ts',
    );
    const actions = path.join(outputDir, 'lib/beehiiv/actions.ts');
    const cta = path.join(outputDir, 'components/beehiiv/SubscribeCTA.tsx');
    const stepTwo = path.join(
      outputDir,
      'components/beehiiv/SubscribeStepTwo.tsx',
    );

    expect(fs.existsSync(apiRoute)).toBe(features.apiRoutes);
    expect(fs.existsSync(actions)).toBe(features.serverActions);
    expect(fs.existsSync(cta)).toBe(
      features.apiRoutes || features.serverActions,
    );
    expect(fs.existsSync(stepTwo)).toBe(features.serverActions);

    const sources = collectSourceFiles(outputDir);
    expectSourcesToCompile(sources);
    const combined = sources
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    if (!features.serverActions) {
      expect(combined).not.toContain("from '@/lib/beehiiv/actions'");
    }
    if (!features.apiRoutes) {
      expect(combined).not.toContain("fetch('/api/beehiiv/subscribe'");
    }
  });
});
