/**
 * Unit tests for the SubscriptionsEndpoint class.
 * Tests create, list with cursor pagination, getByEmail, getById, and delete.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionsEndpoint } from '../../endpoints/subscriptions.js';
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

describe('SubscriptionsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: SubscriptionsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new SubscriptionsEndpoint(mockHttp);
  });

  describe('create', () => {
    it('should POST to the subscriptions endpoint', async () => {
      const responseData = {
        data: {
          id: 'sub_abc',
          email: 'user@example.com',
          status: 'active',
          tier: 'free',
          publication_id: 'pub_123',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', {
        email: 'user@example.com',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions',
        { email: 'user@example.com' }
      );
      expect(result).toEqual(responseData);
    });

    it('should pass all optional fields in the request body', async () => {
      const responseData = { data: { id: 'sub_abc', email: 'user@example.com', status: 'active', tier: 'free', publication_id: 'pub_123', created_at: 1700000000 } };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      await endpoint.create('pub_123', {
        email: 'user@example.com',
        reactivate_existing: true,
        send_welcome_email: false,
        utm_source: 'landing-page',
        custom_fields: [{ name: 'Company', value: 'Acme' }],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions',
        {
          email: 'user@example.com',
          reactivate_existing: true,
          send_welcome_email: false,
          utm_source: 'landing-page',
          custom_fields: [{ name: 'Company', value: 'Acme' }],
        }
      );
    });
  });

  describe('list', () => {
    it('should GET the subscriptions endpoint without params', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and cursor query parameters', async () => {
      const responseData = {
        data: [{ id: 'sub_1' }],
        pagination: { next_cursor: 'cursor_2', has_more: true, total_results: 50 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { limit: 10, cursor: 'cursor_1' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/subscriptions?');
      expect(calledPath).toContain('limit=10');
      expect(calledPath).toContain('cursor=cursor_1');
    });

    it('should include status and tier filters', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { status: 'active', tier: 'premium' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('status=active');
      expect(calledPath).toContain('tier=premium');
    });

    it('should support cursor-based pagination across pages', async () => {
      // Page 1
      vi.mocked(mockHttp.get).mockResolvedValueOnce({
        data: [{ id: 'sub_1' }, { id: 'sub_2' }],
        pagination: { next_cursor: 'page2_cursor', has_more: true, total_results: 4 },
      });

      // Page 2
      vi.mocked(mockHttp.get).mockResolvedValueOnce({
        data: [{ id: 'sub_3' }, { id: 'sub_4' }],
        pagination: { next_cursor: null, has_more: false, total_results: 4 },
      });

      const page1 = await endpoint.list('pub_123', { limit: 2 });
      expect(page1.pagination.has_more).toBe(true);
      expect(page1.pagination.next_cursor).toBe('page2_cursor');

      const page2 = await endpoint.list('pub_123', {
        limit: 2,
        cursor: page1.pagination.next_cursor!,
      });
      expect(page2.pagination.has_more).toBe(false);
      expect(page2.data).toHaveLength(2);
    });
  });

  describe('getByEmail', () => {
    it('should GET the by_email endpoint with encoded email', async () => {
      const responseData = {
        data: {
          id: 'sub_abc',
          email: 'user@example.com',
          status: 'active',
          tier: 'free',
          publication_id: 'pub_123',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.getByEmail('pub_123', 'user@example.com');

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toBe(
        '/publications/pub_123/subscriptions/by_email/user%40example.com'
      );
      expect(result).toEqual(responseData);
    });

    it('should include expand parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { id: 'sub_1' } });

      await endpoint.getByEmail('pub_123', 'user@example.com', {
        expand: ['stats', 'custom_fields'],
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('expand%5B%5D=stats');
      expect(calledPath).toContain('expand%5B%5D=custom_fields');
    });
  });

  describe('getById', () => {
    it('should GET the subscription by ID', async () => {
      const responseData = {
        data: {
          id: 'sub_xyz',
          email: 'test@test.com',
          status: 'active',
          tier: 'free',
          publication_id: 'pub_123',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.getById('pub_123', 'sub_xyz');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions/sub_xyz'
      );
      expect(result).toEqual(responseData);
    });

    it('should include expand parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { id: 'sub_1' } });

      await endpoint.getById('pub_123', 'sub_xyz', {
        expand: ['stats'],
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('expand%5B%5D=stats');
    });
  });

  describe('updateById', () => {
    it('should PATCH the subscription by ID', async () => {
      const responseData = {
        data: {
          id: 'sub_xyz',
          email: 'updated@test.com',
          status: 'active',
          tier: 'free',
          publication_id: 'pub_123',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.patch).mockResolvedValue(responseData);

      const result = await endpoint.updateById('pub_123', 'sub_xyz', {
        email: 'updated@test.com',
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions/sub_xyz',
        { email: 'updated@test.com' }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('updateByEmail', () => {
    it('should PATCH the subscription by email', async () => {
      const responseData = {
        data: {
          id: 'sub_xyz',
          email: 'user@example.com',
          status: 'active',
          tier: 'free',
          publication_id: 'pub_123',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.patch).mockResolvedValue(responseData);

      const result = await endpoint.updateByEmail('pub_123', 'user@example.com', {
        unsubscribe: true,
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions/by_email/user%40example.com',
        { unsubscribe: true }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('delete', () => {
    it('should DELETE the subscription by ID', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpoint.delete('pub_123', 'sub_xyz');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions/sub_xyz'
      );
    });

    it('should resolve without returning data', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      const result = await endpoint.delete('pub_123', 'sub_abc');
      expect(result).toBeUndefined();
    });
  });
});

describe('SubscriptionsEndpoint (dual-signature)', () => {
  let mockHttp: BeehiivHttpClient;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
  });

  it('should use default publicationId for create when data is passed directly', async () => {
    const endpoint = new SubscriptionsEndpoint(mockHttp, 'pub_default');
    vi.mocked(mockHttp.post).mockResolvedValue({
      data: { id: 'sub_abc', email: 'user@example.com', status: 'active', tier: 'free', publication_id: 'pub_default', created_at: 1700000000 },
    });

    await endpoint.create({ email: 'user@example.com' });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/publications/pub_default/subscriptions',
      { email: 'user@example.com' }
    );
  });

  it('should use default publicationId for list when called with no args', async () => {
    const endpoint = new SubscriptionsEndpoint(mockHttp, 'pub_default');
    vi.mocked(mockHttp.get).mockResolvedValue({
      data: [],
      pagination: { next_cursor: null, has_more: false, total_results: 0 },
    });

    await endpoint.list();

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/publications/pub_default/subscriptions'
    );
  });

  it('should throw when no publicationId is available for list', async () => {
    const endpoint = new SubscriptionsEndpoint(mockHttp);

    await expect(endpoint.list({ status: 'active' })).rejects.toThrow(
      'publicationId is required'
    );
  });
});
