/**
 * Unit tests for the AuthorsEndpoint class.
 * Tests list and get methods, including dual-signature calling conventions
 * and page-based pagination parameters.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthorsEndpoint } from '../../endpoints/authors.js';
import type { BeehiivHttpClient } from '../../index.js';

/** Creates a mock BeehiivHttpClient with all methods stubbed */
function createMockHttpClient(): BeehiivHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

describe('AuthorsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: AuthorsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new AuthorsEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the authors endpoint without params', async () => {
      const responseData = {
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/authors'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and page query parameters', async () => {
      const responseData = {
        data: [{ id: 'author_1', name: 'Alice', bio: '', profile_picture: null, created_at: 1700000000, updated_at: 1700000000 }],
        pagination: { page: 2, limit: 20, total_results: 50, total_pages: 3 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { limit: 20, page: 2 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/authors?');
      expect(calledPath).toContain('limit=20');
      expect(calledPath).toContain('page=2');
    });

    it('should use default publicationId when options are passed directly', async () => {
      const endpointWithDefault = new AuthorsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      });

      await endpointWithDefault.list({ limit: 5 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_default/authors');
      expect(calledPath).toContain('limit=5');
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new AuthorsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      });

      await endpointWithDefault.list();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/authors'
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(endpoint.list({ limit: 5 })).rejects.toThrow(
        'publicationId is required'
      );
    });
  });

  describe('get', () => {
    it('should GET a single author by ID', async () => {
      const responseData = {
        data: {
          id: 'author_abc',
          name: 'Alice',
          bio: 'A writer',
          profile_picture: 'https://example.com/pic.jpg',
          created_at: 1700000000,
          updated_at: 1700000100,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'author_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/authors/author_abc'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new AuthorsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { id: 'author_abc', name: 'Alice', bio: '', profile_picture: null, created_at: 1700000000, updated_at: 1700000000 },
      });

      await endpointWithDefault.get('author_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/authors/author_abc'
      );
    });

    it('should throw when no publicationId is available for get', async () => {
      // With no default and only one arg, the first arg is treated as authorId
      // and _resolvePublicationId should throw
      const endpointNoDefault = new AuthorsEndpoint(mockHttp);
      await expect(endpointNoDefault.get('author_abc')).rejects.toThrow(
        'publicationId is required'
      );
    });
  });
});
