/**
 * Executable security regressions for the generated public posts route.
 * @module components/__tests__/posts-route-security
 */

import { describe, expect, it, vi } from 'vitest';
import Handlebars from 'handlebars';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { canViewContent } from '../../utils/access.js';

interface MockJsonResponse {
  body: unknown;
  status: number;
}

type GeneratedModule = Record<string, unknown>;

function renderRoute(templateName = 'posts-route.ts.hbs'): string {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', '..', 'templates', templateName),
    'utf-8',
  );
  return Handlebars.compile(source)({ publicationId: 'pub_configured' });
}

function executeRoute(templateName?: string) {
  const list = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'post_public',
        status: 'confirmed',
        audience: 'free',
        enforce_gated_content: false,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total_results: 1,
      total_pages: 1,
    },
  });
  const getPost = vi.fn().mockResolvedValue({
    data: {
      id: 'post_public',
      status: 'confirmed',
      audience: 'free',
      enforce_gated_content: false,
    },
  });
  const fetchPostBySlug = vi.fn().mockResolvedValue({
    id: 'post_public',
    status: 'confirmed',
    audience: 'free',
    enforce_gated_content: false,
  });
  const json = vi.fn(
    (body: unknown, init?: { status?: number }): MockJsonResponse => ({
      body,
      status: init?.status ?? 200,
    }),
  );

  class MockBeehiivClient {
    readonly posts = { get: getPost, list };
  }

  const compilation = ts.transpileModule(renderRoute(templateName), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });
  const diagnostics = compilation.diagnostics ?? [];
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        )
        .join('\n'),
    );
  }

  const generatedModule = { exports: {} as GeneratedModule };
  const modules: Readonly<Record<string, unknown>> = {
    'beehiiv-react/server': {
      createBeehiivClient: () => new MockBeehiivClient(),
      canViewContent,
      fetchPostBySlug,
    },
    'next/server': { NextResponse: { json } },
  };

  runInNewContext(compilation.outputText, {
    exports: generatedModule.exports,
    module: generatedModule,
    process: {
      env: {
        BEEHIIV_API_KEY: 'test_api_key',
        BEEHIIV_PUBLICATION_ID: 'pub_configured',
      },
    },
    require: (specifier: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(modules, specifier)) {
        throw new Error(`Unexpected generated module import: ${specifier}`);
      }
      return modules[specifier];
    },
  });

  const get = generatedModule.exports.GET;
  if (typeof get !== 'function') {
    throw new Error('Expected generated GET export');
  }

  return {
    fetchPostBySlug,
    get: get as (...args: unknown[]) => Promise<MockJsonResponse>,
    getPost,
    list,
  };
}

function request(query = ''): unknown {
  return { nextUrl: new URL(`https://example.test/api/beehiiv/posts${query}`) };
}

describe('generated public posts route security', () => {
  it.each([
    ['draft status', '?status=draft'],
    ['premium audience', '?audience=premium'],
    ['premium expansion', '?expand%5B%5D=premium_web_content'],
    ['arbitrary expansion', '?expand%5B%5D=stats'],
    ['publication override', '?publicationId=pub_attacker'],
    ['snake-case publication override', '?publication_id=pub_attacker'],
  ])('rejects %s before any Beehiiv call', async (_label, query) => {
    const { fetchPostBySlug, get, list } = executeRoute();

    const response = await get(request(query));

    expect(response.status).toBe(400);
    expect(list).not.toHaveBeenCalled();
    expect(fetchPostBySlug).not.toHaveBeenCalled();
  });

  it('lists only confirmed publicly viewable posts without expansions', async () => {
    const { get, list } = executeRoute();

    const response = await get(request('?page=2&limit=5'));

    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledOnce();
    expect(list).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      status: 'confirmed',
      orderBy: 'publish_date',
      direction: 'desc',
    });
    expect(response.body).toMatchObject({
      pagination: {
        page: 1,
        limit: 10,
        total_results: 1,
        total_pages: 1,
      },
    });
  });

  it('filters unexpected non-public posts from the Beehiiv response', async () => {
    const { get, list } = executeRoute();
    list.mockResolvedValueOnce({
      data: [
        {
          id: 'post_public',
          status: 'confirmed',
          audience: 'both',
          enforce_gated_content: false,
        },
        {
          id: 'post_draft',
          status: 'draft',
          audience: 'free',
          enforce_gated_content: false,
        },
        {
          id: 'post_gated',
          status: 'confirmed',
          audience: 'free',
          enforce_gated_content: true,
        },
        { id: 'post_premium', status: 'confirmed', audience: 'premium' },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total_results: 3,
        total_pages: 1,
      },
    });

    const response = await get(request());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [{ id: 'post_public' }],
    });
  });

  it('resolves slugs only in the configured confirmed public publication', async () => {
    const { fetchPostBySlug, get, list } = executeRoute();

    const response = await get(request('?slug=public-post'));

    expect(response.status).toBe(200);
    expect(list).not.toHaveBeenCalled();
    expect(fetchPostBySlug).toHaveBeenCalledOnce();
    const call = fetchPostBySlug.mock.calls[0];
    expect(call?.[0]).toBeDefined();
    expect(call?.[1]).toBe('pub_configured');
    expect(call?.[2]).toBe('public-post');
    expect(call?.[3]).toMatchObject({
      status: 'confirmed',
    });
  });

  it.each([
    [
      'draft',
      {
        id: 'post_draft',
        status: 'draft',
        audience: 'free',
        enforce_gated_content: false,
      },
    ],
    [
      'gated free',
      {
        id: 'post_gated',
        status: 'confirmed',
        audience: 'free',
        enforce_gated_content: true,
      },
    ],
    [
      'premium',
      { id: 'post_premium', status: 'confirmed', audience: 'premium' },
    ],
  ])('does not return an unexpected %s slug result', async (_label, post) => {
    const { fetchPostBySlug, get } = executeRoute();
    fetchPostBySlug.mockResolvedValueOnce(post);

    const response = await get(request('?slug=restricted-post'));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ data: null });
  });

  it('serves the generated ID route for a configured public post', async () => {
    const { get, getPost } = executeRoute('post-route.ts.hbs');

    const response = await get(
      request(),
      { params: Promise.resolve({ id: 'post_public' }) },
    );

    expect(response.status).toBe(200);
    expect(getPost).toHaveBeenCalledWith('post_public', {
      expand: ['free_web_content', 'tags'],
    });
  });

  it('denies restricted ID results and publication override probes', async () => {
    const restricted = executeRoute('post-route.ts.hbs');
    restricted.getPost.mockResolvedValueOnce({
      data: {
        id: 'post_premium',
        status: 'confirmed',
        audience: 'premium',
      },
    });
    const restrictedResponse = await restricted.get(
      request(),
      { params: Promise.resolve({ id: 'post_premium' }) },
    );
    expect(restrictedResponse.status).toBe(401);

    const override = executeRoute('post-route.ts.hbs');
    const overrideResponse = await override.get(
      request('?publicationId=pub_attacker'),
      { params: Promise.resolve({ id: 'post_public' }) },
    );
    expect(overrideResponse.status).toBe(400);
    expect(override.getPost).not.toHaveBeenCalled();
  });
});
