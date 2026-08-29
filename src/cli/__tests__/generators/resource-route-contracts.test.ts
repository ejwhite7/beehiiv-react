/**
 * Behavioral contract tests for generated author and tier routes.
 * @module cli/__tests__/generators/resource-route-contracts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { generateApiRoutes } from '../../generators/api-routes.js';

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

type GeneratedModule = Record<string, unknown>;

interface MockJsonResponse {
  body: unknown;
  status: number;
}

function executeGeneratedRoute(
  source: string,
  beehiivClient: new () => unknown,
): GeneratedModule {
  const compilation = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });

  if ((compilation.diagnostics ?? []).length > 0) {
    throw new Error(
      (compilation.diagnostics ?? [])
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        )
        .join('\n'),
    );
  }

  const generatedModule = { exports: {} as GeneratedModule };
  const json = (body: unknown, init?: { status?: number }): MockJsonResponse => ({
    body,
    status: init?.status ?? 200,
  });

  runInNewContext(compilation.outputText, {
    exports: generatedModule.exports,
    module: generatedModule,
    process: { env: { BEEHIIV_API_KEY: 'test', BEEHIIV_PUBLICATION_ID: 'pub_test' } },
    require: (specifier: string) => {
      if (specifier === 'next/server') return { NextResponse: { json } };
      if (specifier === 'beehiiv-react/server') {
        return { BeehiivClient: beehiivClient };
      }
      throw new Error(`Unexpected generated module import: ${specifier}`);
    },
  });

  return generatedModule.exports;
}

function getHandler(route: GeneratedModule) {
  const handler = route.GET;
  if (typeof handler !== 'function') throw new Error('Generated GET is missing');
  return handler as (...args: unknown[]) => Promise<MockJsonResponse>;
}

describe('generated resource route contracts', () => {
  let outputDir: string;

  beforeEach(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beehiiv-routes-'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('generates dynamic author and tier detail routes used by the hooks', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_test' });
    const authors = {
      get: vi.fn().mockResolvedValue({ data: { id: 'author_1' } }),
      list: vi.fn(),
    };
    const tiers = {
      get: vi.fn().mockResolvedValue({ data: { id: 'tier_1' } }),
      list: vi.fn(),
    };
    class MockBeehiivClient {
      readonly authors = authors;
      readonly tiers = tiers;
    }

    const authorSource = fs.readFileSync(
      path.join(outputDir, 'app/api/beehiiv/authors/[id]/route.ts'),
      'utf8',
    );
    const tierSource = fs.readFileSync(
      path.join(outputDir, 'app/api/beehiiv/tiers/[id]/route.ts'),
      'utf8',
    );
    const authorResponse = await getHandler(
      executeGeneratedRoute(authorSource, MockBeehiivClient),
    )({}, { params: Promise.resolve({ id: 'author_1' }) });
    const tierResponse = await getHandler(
      executeGeneratedRoute(tierSource, MockBeehiivClient),
    )({}, { params: Promise.resolve({ id: 'tier_1' }) });

    expect(authorResponse).toEqual({ body: { data: { id: 'author_1' } }, status: 200 });
    expect(tierResponse).toEqual({ body: { data: { id: 'tier_1' } }, status: 200 });
    expect(authors.get).toHaveBeenCalledWith('author_1');
    expect(tiers.get).toHaveBeenCalledWith('tier_1');
  });

  it('preserves nested offset and cursor pagination metadata', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_test' });
    const authorPagination = {
      page: 2,
      limit: 20,
      total_results: 45,
      total_pages: 3,
    };
    const tierPagination = {
      next_cursor: 'cursor_next',
      has_more: true,
      total_results: 12,
    };
    const authors = {
      get: vi.fn(),
      list: vi.fn().mockResolvedValue({ data: [{ id: 'author_1' }], pagination: authorPagination }),
    };
    const tiers = {
      get: vi.fn(),
      list: vi.fn().mockResolvedValue({ data: [{ id: 'tier_1' }], pagination: tierPagination }),
    };
    class MockBeehiivClient {
      readonly authors = authors;
      readonly tiers = tiers;
    }

    const authorSource = fs.readFileSync(
      path.join(outputDir, 'app/api/beehiiv/authors/route.ts'),
      'utf8',
    );
    const tierSource = fs.readFileSync(
      path.join(outputDir, 'app/api/beehiiv/tiers/route.ts'),
      'utf8',
    );
    const authorResponse = await getHandler(
      executeGeneratedRoute(authorSource, MockBeehiivClient),
    )({ nextUrl: new URL('https://example.test/authors?page=2&limit=20') });
    const tierResponse = await getHandler(
      executeGeneratedRoute(tierSource, MockBeehiivClient),
    )({
      nextUrl: new URL(
        'https://example.test/tiers?cursor=cursor_1&limit=10&type=premium&active=false',
      ),
    });

    expect(authorResponse.body).toEqual({
      data: [{ id: 'author_1' }],
      pagination: authorPagination,
    });
    expect(tierResponse.body).toEqual({
      data: [{ id: 'tier_1' }],
      pagination: tierPagination,
    });
    expect(authors.list).toHaveBeenCalledWith({ page: 2, limit: 20 });
    expect(tiers.list).toHaveBeenCalledWith({
      cursor: 'cursor_1',
      limit: 10,
      type: 'premium',
      active: false,
    });
  });
});
