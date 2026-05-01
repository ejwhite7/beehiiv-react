/**
 * Unit tests for the TiersEndpoint class.
 * Tests list, get, create, and update methods,
 * including dual-signature calling conventions and cursor-based pagination.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TiersEndpoint } from '../../endpoints/tiers.js';
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

describe('TiersEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: TiersEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new TiersEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the tiers endpoint without params', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/tiers'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and cursor query parameters', async () => {
      const responseData = {
        data: [{ id: 'tier_1', publication_id: 'pub_123', name: 'Free', type: 'free', active: true, created_at: 1700000000 }],
        pagination: { next_cursor: 'cursor_2', has_more: true, total_results: 10 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { limit: 5, cursor: 'cursor_1' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/tiers?');
      expect(calledPath).toContain('limit=5');
      expect(calledPath).toContain('cursor=cursor_1');
    });

    it('should include type and active filters', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { type: 'premium', active: true });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('type=premium');
      expect(calledPath).toContain('active=true');
    });

    it('should use default publicationId when options are passed directly', async () => {
      const endpointWithDefault = new TiersEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      });

      await endpointWithDefault.list({ type: 'free' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_default/tiers');
      expect(calledPath).toContain('type=free');
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new TiersEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      });

      await endpointWithDefault.list();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/tiers'
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(endpoint.list({ type: 'premium' })).rejects.toThrow(
        'publicationId is required'
      );
    });
  });

  describe('get', () => {
    it('should GET a single tier by ID', async () => {
      const responseData = {
        data: {
          id: 'tier_abc',
          publication_id: 'pub_123',
          name: 'Gold',
          description: 'Premium tier',
          type: 'premium' as const,
          price_in_cents: 999,
          currency: 'USD',
          active: true,
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'tier_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/tiers/tier_abc'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new TiersEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { id: 'tier_abc', publication_id: 'pub_default', name: 'Free', type: 'free', active: true, created_at: 1700000000 },
      });

      await endpointWithDefault.get('tier_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/tiers/tier_abc'
      );
    });
  });

  describe('create', () => {
    it('should POST to the tiers endpoint with explicit publicationId', async () => {
      const responseData = {
        data: {
          id: 'tier_new',
          publication_id: 'pub_123',
          name: 'Silver',
          type: 'premium' as const,
          price_in_cents: 499,
          currency: 'USD',
          active: true,
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', {
        name: 'Silver',
        type: 'premium',
        price_in_cents: 499,
        currency: 'USD',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/tiers',
        {
          name: 'Silver',
          type: 'premium',
          price_in_cents: 499,
          currency: 'USD',
        }
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when data is passed directly', async () => {
      const endpointWithDefault = new TiersEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { id: 'tier_new', publication_id: 'pub_default', name: 'Basic', type: 'free', active: true, created_at: 1700000000 },
      });

      await endpointWithDefault.create({ name: 'Basic', type: 'free' });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_default/tiers',
        { name: 'Basic', type: 'free' }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.create({ name: 'Test', type: 'free' })
      ).rejects.toThrow('publicationId is required');
    });
  });

  describe('update', () => {
    it('should PATCH the tier by ID with explicit publicationId', async () => {
      const responseData = {
        data: {
          id: 'tier_abc',
          publication_id: 'pub_123',
          name: 'Platinum',
          type: 'premium' as const,
          active: true,
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.patch).mockResolvedValue(responseData);

      const result = await endpoint.update('pub_123', 'tier_abc', {
        name: 'Platinum',
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_123/tiers/tier_abc',
        { name: 'Platinum' }
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with id and data', async () => {
      const endpointWithDefault = new TiersEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.patch).mockResolvedValue({
        data: { id: 'tier_abc', publication_id: 'pub_default', name: 'Updated', type: 'premium', active: false, created_at: 1700000000 },
      });

      await endpointWithDefault.update('tier_abc', { active: false });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_default/tiers/tier_abc',
        { active: false }
      );
    });
  });
});
