/**
 * Unit tests for the BeehiivClient class.
 * Tests that requests are made with correct URLs, headers, and auth.
 * Tests error handling for various HTTP status codes (400, 404, 429, 500).
 * Uses globally mocked fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BeehiivClient, BeehiivApiError } from '../index.js';

/** Helper to create a mock Response object */
function mockResponse(
  body: unknown,
  options: { status?: number; statusText?: string; contentLength?: string } = {}
): Response {
  const { status = 200, statusText = 'OK', contentLength } = options;

  const headers = new Headers();
  if (contentLength !== undefined) {
    headers.set('content-length', contentLength);
  }

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('BeehiivClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request configuration', () => {
    it('should send requests to the correct base URL', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(mockResponse({ data: [] }));

      await client.publications.list();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.beehiiv.com/v2/publications');
    });

    it('should use a custom base URL when provided', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
        baseUrl: 'https://custom.api.com/v2',
      });

      fetchMock.mockResolvedValue(mockResponse({ data: [] }));

      await client.publications.list();

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://custom.api.com/v2/publications');
    });

    it('should set the Authorization header with Bearer token', async () => {
      const client = new BeehiivClient({
        apiKey: 'my-secret-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(mockResponse({ data: [] }));

      await client.publications.list();

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer my-secret-key');
    });

    it('should set Content-Type to application/json', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(mockResponse({ data: [] }));

      await client.publications.list();

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should use GET method for list endpoints', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(mockResponse({ data: [] }));

      await client.publications.list();

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe('GET');
    });

    it('should use POST method for create endpoints', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse({
          data: { id: 'sub_1', email: 'test@test.com', status: 'active', tier: 'free', publication_id: 'pub_123', created_at: 123 },
        })
      );

      await client.subscriptions.create('pub_123', { email: 'test@test.com' });

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe('POST');
    });

    it('should serialize request body as JSON for POST requests', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse({
          data: { id: 'sub_1', email: 'new@test.com', status: 'active', tier: 'free', publication_id: 'pub_123', created_at: 123 },
        })
      );

      await client.subscriptions.create('pub_123', {
        email: 'new@test.com',
        utm_source: 'website',
      });

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.body).toBe(
        JSON.stringify({ email: 'new@test.com', utm_source: 'website' })
      );
    });

    it('should include AbortSignal for timeout handling', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
        timeout: 5000,
      });

      fetchMock.mockResolvedValue(mockResponse({ data: [] }));

      await client.publications.list();

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('should build correct URLs for nested resource endpoints', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_abc',
      });

      fetchMock.mockResolvedValue(
        mockResponse({
          data: { id: 'sub_1', email: 'test@test.com', status: 'active', tier: 'free', publication_id: 'pub_abc', created_at: 123 },
        })
      );

      await client.subscriptions.getById('pub_abc', 'sub_xyz');

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        'https://api.beehiiv.com/v2/publications/pub_abc/subscriptions/sub_xyz'
      );
    });

    it('should build correct URL for getByEmail endpoint', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_abc',
      });

      fetchMock.mockResolvedValue(
        mockResponse({
          data: { id: 'sub_1', email: 'user@example.com', status: 'active', tier: 'free', publication_id: 'pub_abc', created_at: 123 },
        })
      );

      await client.subscriptions.getByEmail('pub_abc', 'user@example.com');

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        'https://api.beehiiv.com/v2/publications/pub_abc/subscriptions/by_email/user%40example.com'
      );
    });
  });

  describe('error handling', () => {
    it('should throw BeehiivApiError on 400 Bad Request', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(
          { message: 'Invalid email address', errors: [{ message: 'email is invalid', field: 'email' }] },
          { status: 400, statusText: 'Bad Request' }
        )
      );

      await expect(
        client.subscriptions.create('pub_123', { email: 'bad-email' })
      ).rejects.toThrow(BeehiivApiError);

      try {
        await client.subscriptions.create('pub_123', { email: 'bad-email' });
      } catch (err) {
        const apiError = err as BeehiivApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.message).toBe('Invalid email address');
        expect(apiError.errors).toEqual([{ message: 'email is invalid', field: 'email' }]);
      }
    });

    it('should throw BeehiivApiError on 404 Not Found', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(
          { message: 'Subscription not found' },
          { status: 404, statusText: 'Not Found' }
        )
      );

      await expect(
        client.subscriptions.getById('pub_123', 'sub_nonexistent')
      ).rejects.toThrow(BeehiivApiError);

      try {
        await client.subscriptions.getById('pub_123', 'sub_nonexistent');
      } catch (err) {
        const apiError = err as BeehiivApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.message).toBe('Subscription not found');
      }
    });

    it('should throw BeehiivApiError on 429 Too Many Requests', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(
          { message: 'Rate limit exceeded' },
          { status: 429, statusText: 'Too Many Requests' }
        )
      );

      await expect(client.publications.list()).rejects.toThrow(BeehiivApiError);

      try {
        await client.publications.list();
      } catch (err) {
        const apiError = err as BeehiivApiError;
        expect(apiError.status).toBe(429);
        expect(apiError.message).toBe('Rate limit exceeded');
      }
    });

    it('should throw BeehiivApiError on 500 Internal Server Error', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(
          { message: 'Internal server error' },
          { status: 500, statusText: 'Internal Server Error' }
        )
      );

      await expect(client.publications.list()).rejects.toThrow(BeehiivApiError);

      try {
        await client.publications.list();
      } catch (err) {
        const apiError = err as BeehiivApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.message).toBe('Internal server error');
      }
    });

    it('should handle non-JSON error responses gracefully', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      const badResponse = {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers(),
        json: vi.fn().mockRejectedValue(new Error('not JSON')),
        text: vi.fn().mockResolvedValue('Bad Gateway'),
      } as unknown as Response;

      fetchMock.mockResolvedValue(badResponse);

      try {
        await client.publications.list();
      } catch (err) {
        const apiError = err as BeehiivApiError;
        expect(apiError.status).toBe(502);
        expect(apiError.message).toContain('502');
      }
    });

    it('should set the error name to BeehiivApiError', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(
          { message: 'Forbidden' },
          { status: 403, statusText: 'Forbidden' }
        )
      );

      try {
        await client.publications.list();
      } catch (err) {
        const apiError = err as BeehiivApiError;
        expect(apiError.name).toBe('BeehiivApiError');
        expect(apiError).toBeInstanceOf(Error);
      }
    });
  });

  describe('DELETE requests', () => {
    it('should handle 204 No Content responses', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(null, { status: 204, statusText: 'No Content', contentLength: '0' })
      );

      // Should not throw
      await expect(
        client.subscriptions.delete('pub_123', 'sub_xyz')
      ).resolves.toBeUndefined();
    });

    it('should use DELETE method', async () => {
      const client = new BeehiivClient({
        apiKey: 'test-key',
        publicationId: 'pub_123',
      });

      fetchMock.mockResolvedValue(
        mockResponse(null, { status: 204, statusText: 'No Content', contentLength: '0' })
      );

      await client.subscriptions.delete('pub_123', 'sub_xyz');

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe('DELETE');
    });
  });
});
