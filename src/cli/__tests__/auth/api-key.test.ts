/**
 * Tests for the API key authentication module.
 * Mocks fetch and inquirer to test successful validation,
 * re-prompting on 401 errors, and failure after 3 attempts.
 * @module cli/__tests__/auth/api-key
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Mock publication data returned by the API */
const mockPublications = [
  {
    id: 'pub_test001',
    name: 'Test Publication',
    created: 1700000000,
    timezone: 'America/New_York',
  },
];

const mockPrompt = vi.fn();

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: (...args: unknown[]) => mockPrompt(...args),
  },
}));

// Mock chalk (passthrough)
vi.mock('chalk', () => {
  const handler: ProxyHandler<object> = {
    get(_target, _prop) {
      return new Proxy((...args: string[]) => args.join(' '), handler);
    },
    apply(_target, _thisArg, args: string[]) {
      return args.join(' ');
    },
  };
  return {
    default: new Proxy((() => '') as unknown as object, handler),
  };
});

// Mock ora - return a fresh spinner each time the factory is called
vi.mock('ora', () => ({
  default: () => {
    const spinner = {
      start: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn(),
    };
    spinner.start.mockReturnValue(spinner);
    spinner.succeed.mockReturnValue(spinner);
    spinner.fail.mockReturnValue(spinner);
    spinner.stop.mockReturnValue(spinner);
    return spinner;
  },
}));

describe('promptForApiKey', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    mockPrompt.mockReset();
  });

  it('should return API key and publications on successful validation', async () => {
    mockPrompt.mockResolvedValueOnce({ apiKey: 'valid-api-key-123' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockPublications }),
    });

    const { promptForApiKey } = await import('../../auth/api-key.js');
    const result = await promptForApiKey();

    expect(result.apiKey).toBe('valid-api-key-123');
    expect(result.publications).toEqual(mockPublications);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.beehiiv.com/v2/publications',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-api-key-123',
        }),
      }),
    );
  });

  it('should re-prompt on 401 and succeed on second attempt', async () => {
    mockPrompt
      .mockResolvedValueOnce({ apiKey: 'bad-key' })
      .mockResolvedValueOnce({ apiKey: 'good-key' });

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockPublications }),
      });

    const { promptForApiKey } = await import('../../auth/api-key.js');
    const result = await promptForApiKey();

    expect(result.apiKey).toBe('good-key');
    expect(result.publications).toEqual(mockPublications);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should fail after 3 invalid attempts', async () => {
    mockPrompt
      .mockResolvedValueOnce({ apiKey: 'bad-key-1' })
      .mockResolvedValueOnce({ apiKey: 'bad-key-2' })
      .mockResolvedValueOnce({ apiKey: 'bad-key-3' });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    const { promptForApiKey } = await import('../../auth/api-key.js');
    await expect(promptForApiKey()).rejects.toThrow(
      /Failed to validate API key after 3 attempts/,
    );

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should re-prompt on 403 forbidden', async () => {
    mockPrompt
      .mockResolvedValueOnce({ apiKey: 'forbidden-key' })
      .mockResolvedValueOnce({ apiKey: 'good-key' });

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockPublications }),
      });

    const { promptForApiKey } = await import('../../auth/api-key.js');
    const result = await promptForApiKey();

    expect(result.apiKey).toBe('good-key');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should trim whitespace from API key input', async () => {
    mockPrompt.mockResolvedValueOnce({ apiKey: '  spaced-key  ' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockPublications }),
    });

    const { promptForApiKey } = await import('../../auth/api-key.js');
    const result = await promptForApiKey();

    expect(result.apiKey).toBe('spaced-key');
  });
});
