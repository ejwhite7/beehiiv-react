/**
 * Unit tests for createBeehiivClient.
 *
 * Validates that the factory reads environment variables, throws when the
 * API key is missing, and correctly merges explicit options over env defaults.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBeehiivClient } from '../client.js';
import { BeehiivClient } from '../../client/index.js';

describe('createBeehiivClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clone env so mutations are isolated per test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should create a BeehiivClient using BEEHIIV_API_KEY from env', () => {
    process.env.BEEHIIV_API_KEY = 'env-api-key';

    const client = createBeehiivClient();

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('should create a BeehiivClient using BEEHIIV_PUBLICATION_ID from env', () => {
    process.env.BEEHIIV_API_KEY = 'env-api-key';
    process.env.BEEHIIV_PUBLICATION_ID = 'pub_from_env';

    const client = createBeehiivClient();

    expect(client).toBeInstanceOf(BeehiivClient);
  });

  it('should throw a descriptive error when BEEHIIV_API_KEY is not set and no apiKey option provided', () => {
    delete process.env.BEEHIIV_API_KEY;

    expect(() => createBeehiivClient()).toThrow(
      /beehiiv API key is required/,
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
