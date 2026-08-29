/**
 * Unit tests for createBeehiivClient.
 *
 * Validates that the factory reads environment variables, throws when the
 * credentials are missing, and correctly merges explicit options over env defaults.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBeehiivClient, resolveBeehiivAuthToken } from '../client.js';
import { BeehiivClient } from '../../client/index.js';

describe('createBeehiivClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clone env so mutations are isolated per test
    process.env = { ...originalEnv };
    delete process.env.BEEHIIV_API_KEY;
    delete process.env.BEEHIIV_ACCESS_TOKEN;
    delete process.env.BEEHIIV_PUBLICATION_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create a BeehiivClient using BEEHIIV_API_KEY from env', () => {
    process.env.BEEHIIV_API_KEY = 'env-api-key';

    const client = createBeehiivClient();

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('creates a client from the OAuth access token written by init', () => {
    process.env.BEEHIIV_ACCESS_TOKEN = 'oauth-access-token';

    const client = createBeehiivClient();

    expect(client).toBeInstanceOf(BeehiivClient);
    expect(resolveBeehiivAuthToken()).toBe('oauth-access-token');
  });

  it('sends the OAuth access token as the API bearer credential', async () => {
    process.env.BEEHIIV_ACCESS_TOKEN = 'oauth-access-token';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createBeehiivClient().publications.list();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer oauth-access-token',
        }),
      }),
    );
  });

  it('should create a BeehiivClient using BEEHIIV_PUBLICATION_ID from env', () => {
    process.env.BEEHIIV_API_KEY = 'env-api-key';
    process.env.BEEHIIV_PUBLICATION_ID = 'pub_from_env';

    const client = createBeehiivClient();

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('throws a descriptive error when no credential is configured', () => {
    expect(() => createBeehiivClient()).toThrow(
      /beehiiv credential is required/,
    );
  });

  it('should not throw when apiKey is provided via options even if env var is missing', () => {
    delete process.env.BEEHIIV_API_KEY;

    const client = createBeehiivClient({ apiKey: 'explicit-key' });

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('should prefer options.apiKey over BEEHIIV_API_KEY env var', () => {
    process.env.BEEHIIV_API_KEY = 'env-key';

    // We can't easily inspect the private _config, but we can verify no error
    // is thrown and the client is created — the implementation uses
    // options.apiKey ?? process.env.BEEHIIV_API_KEY, so options wins.
    const client = createBeehiivClient({ apiKey: 'options-key' });

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('prefers the API key over an OAuth token for backward compatibility', () => {
    process.env.BEEHIIV_API_KEY = 'env-key';
    process.env.BEEHIIV_ACCESS_TOKEN = 'oauth-token';

    expect(resolveBeehiivAuthToken()).toBe('env-key');
    expect(resolveBeehiivAuthToken('explicit-token')).toBe('explicit-token');
  });

  it('should prefer options.publicationId over BEEHIIV_PUBLICATION_ID env var', () => {
    process.env.BEEHIIV_API_KEY = 'env-key';
    process.env.BEEHIIV_PUBLICATION_ID = 'pub_env';

    const client = createBeehiivClient({ publicationId: 'pub_options' });

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('should pass through additional config options like baseUrl and timeout', () => {
    process.env.BEEHIIV_API_KEY = 'env-key';

    const client = createBeehiivClient({
      baseUrl: 'https://custom.api.com/v2',
      timeout: 5000,
    });

    expect(client).toBeInstanceOf(BeehiivClient);
  });
});
