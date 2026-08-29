/**
 * Security regression tests for generated subscriber routes and actions.
 * @module cli/__tests__/generators/subscriber-security
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { generateApiRoutes } from '../../generators/api-routes.js';
import { generateServerActions } from '../../generators/server-actions.js';

/* Redirect source-mode template paths to the repository template directory. */
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

function executeGeneratedModule(
  source: string,
  requireMap: Readonly<Record<string, unknown>>,
): GeneratedModule {
  const compilation = ts.transpileModule(source, {
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
  const requireGeneratedModule = (specifier: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(requireMap, specifier)) {
      throw new Error(`Unexpected generated module import: ${specifier}`);
    }
    return requireMap[specifier];
  };

  runInNewContext(
    compilation.outputText,
    {
      exports: generatedModule.exports,
      module: generatedModule,
      process: {
        env: {
          BEEHIIV_API_KEY: 'test_api_key',
          BEEHIIV_PUBLICATION_ID: 'pub_security',
        },
      },
      require: requireGeneratedModule,
    },
    { filename: 'generated-module.cjs' },
  );

  return generatedModule.exports;
}

function getAsyncExport(
  generatedModule: GeneratedModule,
  exportName: string,
): (...args: unknown[]) => Promise<unknown> {
  const exportedValue = generatedModule[exportName];
  if (typeof exportedValue !== 'function') {
    throw new Error(`Expected generated export ${exportName} to be a function`);
  }
  return exportedValue as (...args: unknown[]) => Promise<unknown>;
}

function createRuntimeMocks() {
  const bulkSubscriptions = {
    create: vi.fn().mockResolvedValue({ data: { id: 'bulk_created' } }),
  };
  const subscriptions = {
    create: vi.fn().mockResolvedValue({ data: { id: 'sub_created' } }),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ data: { id: 'sub_existing' } }),
    list: vi.fn().mockResolvedValue({ data: [] }),
    updateById: vi.fn().mockResolvedValue({
      data: { id: 'sub_existing' },
    }),
  };
  const json = vi.fn(
    (body: unknown, init?: { status?: number }): MockJsonResponse => ({
      body,
      status: init?.status ?? 200,
    }),
  );

  class MockBeehiivClient {
    readonly bulkSubscriptions = bulkSubscriptions;
    readonly subscriptions = subscriptions;
  }

  return {
    requireMap: {
      '@/beehiiv.config': {
        __esModule: true,
        default: { publicationId: 'pub_security' },
      },
      'beehiiv-react/server': { BeehiivClient: MockBeehiivClient },
      'next/server': { NextResponse: { json } },
    },
    bulkSubscriptions,
    subscriptions,
  };
}

function publicSignupRequest(body: unknown, ip = '203.0.113.10') {
  const rawBody = JSON.stringify(body);
  return {
    headers: new Headers({
      'content-length': String(rawBody.length),
      'x-forwarded-for': ip,
    }),
    text: async () => rawBody,
  };
}

describe('generated subscriber operation security', () => {
  let outputDir: string;

  beforeEach(() => {
    outputDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'beehiiv-subscriber-security-'),
    );
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('generates email lookup that denies enumeration before any API call', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });

    const route = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscription',
        'route.ts',
      ),
      'utf-8',
    );
    const authorization = route.indexOf(
      'if (!(await isSubscriberLookupAuthorized(req, email)))',
    );

    expect(route).toMatch(
      /async function isSubscriberLookupAuthorized[\s\S]*?return false;/,
    );
    expect(route).toContain("{ error: 'Unauthorized' }, { status: 401 }");
    expect(authorization).toBeGreaterThan(-1);
    expect(route.indexOf('if (!email)')).toBeGreaterThan(authorization);
    expect(
      route.indexOf('client.subscriptions.list({ email })'),
    ).toBeGreaterThan(authorization);
  });

  it('generates ID lookup and deletion that deny anonymous requests', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });

    const route = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscription',
        '[id]',
        'route.ts',
      ),
      'utf-8',
    );
    const lookupAuthorization = route.indexOf(
      "isSubscriberOperationAuthorized(_req, id, 'lookup')",
    );
    const deleteAuthorization = route.indexOf(
      "isSubscriberOperationAuthorized(_req, id, 'delete')",
    );

    expect(route).toMatch(
      /async function isSubscriberOperationAuthorized[\s\S]*?return false;/,
    );
    expect(lookupAuthorization).toBeGreaterThan(-1);
    expect(deleteAuthorization).toBeGreaterThan(-1);
    expect(route.indexOf('client.subscriptions.get(id)')).toBeGreaterThan(
      lookupAuthorization,
    );
    expect(route.indexOf('client.subscriptions.delete(id)')).toBeGreaterThan(
      deleteAuthorization,
    );
    expect(route.match(/status: 401/g)).toHaveLength(2);
  });

  it('generates update and deletion actions that throw before API calls', async () => {
    await generateServerActions({
      outputDir,
      publicationId: 'pub_security',
    });

    const actions = fs.readFileSync(
      path.join(outputDir, 'lib', 'beehiiv', 'actions.ts'),
      'utf-8',
    );
    const updateAuthorization = actions.indexOf(
      "await assertSubscriberMutationAuthorized(id, 'update')",
    );
    const deleteAuthorization = actions.indexOf(
      "await assertSubscriberMutationAuthorized(id, 'delete')",
    );

    expect(actions).toMatch(
      /async function assertSubscriberMutationAuthorized[\s\S]*?throw new Error\('Unauthorized subscriber operation'\);/,
    );
    expect(updateAuthorization).toBeGreaterThan(-1);
    expect(deleteAuthorization).toBeGreaterThan(-1);
    expect(
      actions.indexOf('client.subscriptions.updateById(id'),
    ).toBeGreaterThan(updateAuthorization);
    expect(actions.indexOf('client.subscriptions.delete(id)')).toBeGreaterThan(
      deleteAuthorization,
    );
  });

  it('executes separate lookup and signup routes with matching contracts', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });

    const lookupRoute = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscription',
        'route.ts',
      ),
      'utf-8',
    );
    const signupRoute = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscribe',
        'route.ts',
      ),
      'utf-8',
    );
    const { requireMap, subscriptions } = createRuntimeMocks();
    const generatedLookupRoute = executeGeneratedModule(lookupRoute, requireMap);
    const generatedSignupRoute = executeGeneratedModule(signupRoute, requireMap);
    const request = {
      nextUrl: new URL(
        'https://example.test/api/beehiiv/subscription?email=victim%40example.com',
      ),
    };

    const lookupResponse = (await getAsyncExport(generatedLookupRoute, 'GET')(
      request,
    )) as MockJsonResponse;

    expect(lookupResponse).toEqual({
      body: { error: 'Unauthorized' },
      status: 401,
    });
    expect(subscriptions.list).not.toHaveBeenCalled();

    const subscribeResponse = (await getAsyncExport(generatedSignupRoute, 'POST')(
      publicSignupRequest({ email: 'reader@example.com' }),
    )) as MockJsonResponse;

    expect(subscribeResponse.status).toBe(200);
    expect(subscriptions.create).toHaveBeenCalledOnce();
    expect(subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'reader@example.com',
        reactivate_existing: false,
        send_welcome_email: true,
      }),
    );
  });

  it('normalizes authorized email and ID lookups to one-record envelopes', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });
    const emailRoute = fs
      .readFileSync(
        path.join(
          outputDir,
          'app',
          'api',
          'beehiiv',
          'subscription',
          'route.ts',
        ),
        'utf-8',
      )
      .replace('return false;', 'return true;');
    const idRoute = fs
      .readFileSync(
        path.join(
          outputDir,
          'app',
          'api',
          'beehiiv',
          'subscription',
          '[id]',
          'route.ts',
        ),
        'utf-8',
      )
      .replace('return false;', 'return true;');
    const { requireMap, subscriptions } = createRuntimeMocks();
    subscriptions.list.mockResolvedValueOnce({
      data: [{ id: 'sub_by_email', email: 'reader@example.com' }],
    });

    const emailResponse = (await getAsyncExport(
      executeGeneratedModule(emailRoute, requireMap),
      'GET',
    )({
      nextUrl: new URL(
        'https://example.test/api/beehiiv/subscription?email=reader%40example.com',
      ),
    })) as MockJsonResponse;
    const idResponse = (await getAsyncExport(
      executeGeneratedModule(idRoute, requireMap),
      'GET',
    )({}, { params: Promise.resolve({ id: 'sub_existing' }) })) as MockJsonResponse;

    expect(emailResponse.body).toMatchObject({
      data: { id: 'sub_by_email', email: 'reader@example.com' },
    });
    expect(idResponse.body).toMatchObject({ data: { id: 'sub_existing' } });
  });

  it('bounds public signup bodies and rate limits repeated attempts', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });
    const route = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscribe',
        'route.ts',
      ),
      'utf-8',
    );
    const { requireMap, subscriptions } = createRuntimeMocks();
    const generatedRoute = executeGeneratedModule(route, requireMap);
    const post = getAsyncExport(generatedRoute, 'POST');

    const oversizedResponse = (await post({
      headers: new Headers({ 'content-length': '16385' }),
      text: async () => {
        throw new Error('oversized request body must not be read');
      },
    })) as MockJsonResponse;
    expect(oversizedResponse.status).toBe(413);
    expect(subscriptions.create).not.toHaveBeenCalled();

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = (await post(
        publicSignupRequest(
          { email: `reader-${attempt}@example.com` },
          '203.0.113.20',
        ),
      )) as MockJsonResponse;
      expect(response.status).toBe(200);
    }
    const limitedResponse = (await post(
      publicSignupRequest(
        { email: 'reader-limited@example.com' },
        '203.0.113.20',
      ),
    )) as MockJsonResponse;
    expect(limitedResponse.status).toBe(429);
    expect(subscriptions.create).toHaveBeenCalledTimes(5);
  });

  it('denies anonymous bulk creation before reading or forwarding input', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });
    const route = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'bulk-subscriptions',
        'route.ts',
      ),
      'utf-8',
    );
    const { bulkSubscriptions, requireMap } = createRuntimeMocks();
    const generatedRoute = executeGeneratedModule(route, requireMap);
    const json = vi.fn().mockRejectedValue(
      new Error('unauthorized request body must not be read'),
    );

    const response = (await getAsyncExport(generatedRoute, 'POST')({ json })) as
      MockJsonResponse;

    expect(route).toMatch(
      /async function isBulkSubscriptionCreationAuthorized[\s\S]*?return false;/,
    );
    expect(route.indexOf('isBulkSubscriptionCreationAuthorized(req)')).toBeLessThan(
      route.indexOf('await req.json()'),
    );
    expect(route).toContain('body.subscriptions.length > 100');
    expect(response.status).toBe(401);
    expect(json).not.toHaveBeenCalled();
    expect(bulkSubscriptions.create).not.toHaveBeenCalled();
  });

  it('executes the subscription ID route and denies anonymous lookup and deletion before API calls', async () => {
    await generateApiRoutes({ outputDir, publicationId: 'pub_security' });

    const route = fs.readFileSync(
      path.join(
        outputDir,
        'app',
        'api',
        'beehiiv',
        'subscription',
        '[id]',
        'route.ts',
      ),
      'utf-8',
    );
    const { requireMap, subscriptions } = createRuntimeMocks();
    const generatedRoute = executeGeneratedModule(route, requireMap);
    const routeContext = {
      params: Promise.resolve({ id: 'sub_victim' }),
    };

    const getResponse = (await getAsyncExport(generatedRoute, 'GET')(
      {},
      routeContext,
    )) as MockJsonResponse;
    const deleteResponse = (await getAsyncExport(generatedRoute, 'DELETE')(
      {},
      routeContext,
    )) as MockJsonResponse;

    expect(getResponse).toEqual({
      body: { error: 'Unauthorized' },
      status: 401,
    });
    expect(deleteResponse).toEqual({
      body: { error: 'Unauthorized' },
      status: 401,
    });
    expect(subscriptions.get).not.toHaveBeenCalled();
    expect(subscriptions.delete).not.toHaveBeenCalled();
  });

  it('executes Server Actions and rejects anonymous update and deletion before API calls', async () => {
    await generateServerActions({
      outputDir,
      publicationId: 'pub_security',
    });

    const actions = fs.readFileSync(
      path.join(outputDir, 'lib', 'beehiiv', 'actions.ts'),
      'utf-8',
    );
    const { requireMap, subscriptions } = createRuntimeMocks();
    const generatedActions = executeGeneratedModule(actions, requireMap);

    await expect(
      getAsyncExport(generatedActions, 'enrichSubscriptionAction')(
        'sub_victim',
        { company: 'Attacker supplied' },
      ),
    ).rejects.toMatchObject({ message: 'Unauthorized subscriber operation' });
    await expect(
      getAsyncExport(generatedActions, 'unsubscribeAction')('sub_victim'),
    ).rejects.toMatchObject({ message: 'Unauthorized subscriber operation' });

    expect(subscriptions.updateById).not.toHaveBeenCalled();
    expect(subscriptions.delete).not.toHaveBeenCalled();
  });
});
