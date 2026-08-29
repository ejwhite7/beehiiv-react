/** OAuth-mode end-to-end scaffold smoke test. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runInit } from '../../commands/init.js';

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

vi.mock('../../auth/oauth.js', () => ({
  runOAuthFlow: vi.fn().mockResolvedValue({ accessToken: 'oauth_stored_token' }),
}));

vi.mock('../../prompts/index.js', () => ({
  confirmOverwrite: vi.fn().mockResolvedValue(true),
  resolveBlogConfig: vi.fn().mockResolvedValue({
    routePrefix: 'blog',
    blogTitle: 'OAuth Publication',
    blogDescription: 'OAuth smoke test',
  }),
  selectFeatures: vi.fn().mockResolvedValue({
    apiRoutes: true,
    serverActions: true,
  }),
  selectPublication: vi.fn().mockResolvedValue({
    id: 'pub_oauth',
    name: 'OAuth Publication',
    created: 1,
    timezone: 'UTC',
  }),
}));

function collectGeneratedServerFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectGeneratedServerFiles(absolute));
    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

describe('OAuth scaffold', () => {
  let outputDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beehiiv-oauth-'));
    process.env = {
      ...originalEnv,
      BEEHIIV_OAUTH_CLIENT_ID: 'oauth_client',
    };
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 'pub_oauth' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        }),
    );
  });

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stores the access token and generates only shared-factory clients', async () => {
    await runInit({
      oauth: true,
      outputDir,
      blog: true,
      blogRoute: 'blog',
      blogTitle: 'OAuth Publication',
      blogDescription: 'OAuth smoke test',
    });

    expect(fs.readFileSync(path.join(outputDir, '.env.local'), 'utf8')).toBe(
      'BEEHIIV_ACCESS_TOKEN=oauth_stored_token\n',
    );

    const generatedFiles = collectGeneratedServerFiles(outputDir);
    const serverFiles = generatedFiles.filter((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return source.includes("from 'beehiiv-react/server'");
    });

    expect(serverFiles.length).toBeGreaterThan(10);
    for (const file of serverFiles) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source, file).not.toContain('BEEHIIV_API_KEY');
      if (source.includes('client.')) {
        expect(source, file).toContain('createBeehiivClient');
      }
    }
  });
});
