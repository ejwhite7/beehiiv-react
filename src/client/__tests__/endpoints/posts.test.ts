/**
 * Unit tests for the PostsEndpoint class.
 * Tests list, get, create, update, delete, and aggregateStats methods,
 * including dual-signature calling conventions.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostsEndpoint } from '../../endpoints/posts.js';
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

describe('PostsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: PostsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new PostsEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the posts endpoint without params', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/posts'
      );
      expect(result).toEqual(responseData);
    });

    it('should include filtering and pagination parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      });

      await endpoint.list('pub_123', {
        limit: 10,
        cursor: 'abc',
        status: 'confirmed',
        audience: 'all',
        orderBy: 'publish_date',
        direction: 'desc',
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('limit=10');
      expect(calledPath).toContain('cursor=abc');
      expect(calledPath).toContain('status=confirmed');
      expect(calledPath).toContain('audience=all');
      expect(calledPath).toContain('order_by=publish_date');
      expect(calledPath).toContain('direction=desc');
    });

    it('should use default publicationId when options are passed directly', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      });

      await endpointWithDefault.list({ status: 'confirmed' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_default/posts');
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      });

      await endpointWithDefault.list();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/posts'
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(endpoint.list({ status: 'draft' })).rejects.toThrow(
        'publicationId is required'
      );
    });
  });

  describe('get', () => {
    it('should GET a single post by ID', async () => {
      const responseData = {
        data: { id: 'post_abc', title: 'Test Post', status: 'confirmed' },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'post_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/posts/post_abc'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { id: 'post_abc' } });

      await endpointWithDefault.get('post_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/posts/post_abc'
      );
    });
  });

  describe('create', () => {
    it('should POST to the posts endpoint', async () => {
      const responseData = {
        data: { id: 'post_new', title: 'New Post', status: 'draft' },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', { title: 'New Post' });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/posts',
        { title: 'New Post' }
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when data is passed directly', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue({ data: { id: 'post_new' } });

      await endpointWithDefault.create({ title: 'New Post' });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_default/posts',
        { title: 'New Post' }
      );
    });
  });

  describe('update', () => {
    it('should PATCH the post by ID', async () => {
      const responseData = {
        data: { id: 'post_abc', title: 'Updated', status: 'draft' },
      };
      vi.mocked(mockHttp.patch).mockResolvedValue(responseData);

      const result = await endpoint.update('pub_123', 'post_abc', {
        title: 'Updated',
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_123/posts/post_abc',
        { title: 'Updated' }
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with id and data', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.patch).mockResolvedValue({ data: { id: 'post_abc' } });

      await endpointWithDefault.update('post_abc', { title: 'Updated' });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_default/posts/post_abc',
        { title: 'Updated' }
      );
    });
  });

  describe('delete', () => {
    it('should DELETE the post by ID', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpoint.delete('pub_123', 'post_abc');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_123/posts/post_abc'
      );
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpointWithDefault.delete('post_abc');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_default/posts/post_abc'
      );
    });
  });

  describe('aggregateStats', () => {
    it('should GET aggregate stats without params', async () => {
      const responseData = {
        data: {
          total_posts: 50,
          total_recipients: 10000,
          total_opens: 5000,
          total_unique_opens: 3000,
          total_clicks: 1000,
          total_unique_clicks: 800,
          average_open_rate: 0.5,
          average_click_rate: 0.1,
          total_unsubscribes: 20,
          total_spam_reports: 1,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.aggregateStats('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/posts/aggregate_stats'
      );
      expect(result).toEqual(responseData);
    });

    it('should include status and audience filters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { total_posts: 10 } });

      await endpoint.aggregateStats('pub_123', {
        status: 'confirmed',
        audience: 'premium',
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('status=confirmed');
      expect(calledPath).toContain('audience=premium');
    });

    it('should use default publicationId when options are passed directly', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { total_posts: 10 } });

      await endpointWithDefault.aggregateStats({ status: 'confirmed' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_default/posts/aggregate_stats');
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { total_posts: 10 } });

      await endpointWithDefault.aggregateStats();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/posts/aggregate_stats'
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(endpoint.aggregateStats({ status: 'draft' })).rejects.toThrow(
        'publicationId is required'
      );
    });
  });
});
