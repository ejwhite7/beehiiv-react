/**
 * Unit tests for bulk subscription endpoints and subscription tags.
 * Tests BulkSubscriptionsEndpoint.create, BulkSubscriptionUpdatesEndpoint
 * (list, get, bulkUpdateFields, bulkUpdateStatus), and SubscriptionsEndpoint.addTags.
 * Uses a mocked BeehiivHttpClient.
 *
 * Bulk update HTTP verbs verified against beehiiv API docs:
 * - bulkUpdateFields: PUT /v2/publications/{pubId}/subscriptions/bulk_actions
 * - bulkUpdateStatus: PUT /v2/publications/{pubId}/subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkSubscriptionsEndpoint } from '../../endpoints/bulkSubscriptions.js';
import { BulkSubscriptionUpdatesEndpoint } from '../../endpoints/bulkSubscriptionUpdates.js';
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

// ---------------------------------------------------------------------------
// BulkSubscriptionsEndpoint
// ---------------------------------------------------------------------------

describe('BulkSubscriptionsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: BulkSubscriptionsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new BulkSubscriptionsEndpoint(mockHttp);
  });

  describe('create', () => {
    it('should POST to the bulk_subscriptions endpoint', async () => {
      const responseData = {
        job_id: 'job_001',
        status: 'pending',
        total: 2,
        created: 0,
        updated: 0,
        failed: 0,
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const body = {
        subscriptions: [
          { email: 'user1@example.com' },
          { email: 'user2@example.com', utm_source: 'campaign' },
        ],
      };

      const result = await endpoint.create('pub_123', body);

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/bulk_subscriptions',
        body
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when body is passed directly', async () => {
      const endpointWithDefault = new BulkSubscriptionsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue({
        job_id: 'job_002',
        status: 'pending',
        total: 1,
        created: 0,
        updated: 0,
        failed: 0,
      });

      await endpointWithDefault.create({
        subscriptions: [{ email: 'user3@example.com' }],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_default/bulk_subscriptions',
        { subscriptions: [{ email: 'user3@example.com' }] }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.create({ subscriptions: [{ email: 'a@b.com' }] })
      ).rejects.toThrow('publicationId is required');
    });
  });
});

// ---------------------------------------------------------------------------
// BulkSubscriptionUpdatesEndpoint
// ---------------------------------------------------------------------------

describe('BulkSubscriptionUpdatesEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: BulkSubscriptionUpdatesEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new BulkSubscriptionUpdatesEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the bulk_subscription_updates endpoint without params', async () => {
      const responseData = {
        data: [
          { id: 'job_1', status: 'completed', total: 10, created: 5, updated: 5, failed: 0, created_at: '2024-01-01T00:00:00Z', completed_at: '2024-01-01T00:01:00Z' },
        ],
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/bulk_subscription_updates'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and page query parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({ data: [] });

      await endpoint.list('pub_123', { limit: 5, page: 2 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/bulk_subscription_updates?');
      expect(calledPath).toContain('limit=5');
      expect(calledPath).toContain('page=2');
    });

    it('should use default publicationId when options are passed directly', async () => {
      const endpointWithDefault = new BulkSubscriptionUpdatesEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: [] });

      await endpointWithDefault.list({ limit: 10 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_default/bulk_subscription_updates');
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new BulkSubscriptionUpdatesEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: [] });

      await endpointWithDefault.list();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/bulk_subscription_updates'
      );
    });
  });

  describe('get', () => {
    it('should GET a single bulk update job by ID', async () => {
      const responseData = {
        data: {
          id: 'job_abc',
          status: 'completed',
          total: 50,
          created: 20,
          updated: 30,
          failed: 0,
          created_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:05:00Z',
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'job_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/bulk_subscription_updates/job_abc'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new BulkSubscriptionUpdatesEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { id: 'job_abc', status: 'pending', total: 0, created: 0, updated: 0, failed: 0, created_at: '2024-01-01T00:00:00Z', completed_at: null },
      });

      await endpointWithDefault.get('job_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/bulk_subscription_updates/job_abc'
      );
    });
  });

  describe('bulkUpdateFields', () => {
    it('should PUT to the bulk_actions endpoint (verified against beehiiv docs)', async () => {
      const responseData = {
        job_id: 'job_fields_001',
        status: 'pending',
      };
      vi.mocked(mockHttp.put).mockResolvedValue(responseData);

      const body = {
        subscription_ids: ['sub_1', 'sub_2'],
        fields: { tier: 'premium' },
      };

      const result = await endpoint.bulkUpdateFields('pub_123', body);

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions/bulk_actions',
        body
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when body is passed directly', async () => {
      const endpointWithDefault = new BulkSubscriptionUpdatesEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.put).mockResolvedValue({ job_id: 'job_f2', status: 'pending' });

      await endpointWithDefault.bulkUpdateFields({
        subscription_ids: ['sub_3'],
        fields: { company: 'Acme' },
      });

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_default/subscriptions/bulk_actions',
        { subscription_ids: ['sub_3'], fields: { company: 'Acme' } }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.bulkUpdateFields({
          subscription_ids: ['sub_1'],
          fields: { tier: 'free' },
        })
      ).rejects.toThrow('publicationId is required');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should PUT to the subscriptions endpoint (verified against beehiiv docs)', async () => {
      const responseData = {
        job_id: 'job_status_001',
        status: 'pending',
      };
      vi.mocked(mockHttp.put).mockResolvedValue(responseData);

      const body = {
        subscription_ids: ['sub_1', 'sub_2'],
        status: 'active' as const,
      };

      const result = await endpoint.bulkUpdateStatus('pub_123', body);

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions',
        body
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when body is passed directly', async () => {
      const endpointWithDefault = new BulkSubscriptionUpdatesEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.put).mockResolvedValue({ job_id: 'job_s2', status: 'pending' });

      await endpointWithDefault.bulkUpdateStatus({
        subscription_ids: ['sub_4'],
        status: 'inactive',
      });

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_default/subscriptions',
        { subscription_ids: ['sub_4'], status: 'inactive' }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.bulkUpdateStatus({
          subscription_ids: ['sub_1'],
          status: 'active',
        })
      ).rejects.toThrow('publicationId is required');
    });
  });
});

// ---------------------------------------------------------------------------
// SubscriptionsEndpoint.addTags
// ---------------------------------------------------------------------------

describe('SubscriptionsEndpoint.addTags', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: SubscriptionsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new SubscriptionsEndpoint(mockHttp);
  });

  it('should POST to the tags endpoint with the correct URL and body', async () => {
    const responseData = { tags: ['vip', 'early-adopter'] };
    vi.mocked(mockHttp.post).mockResolvedValue(responseData);

    const result = await endpoint.addTags('pub_123', 'sub_xyz', ['vip', 'early-adopter']);

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/publications/pub_123/subscriptions/sub_xyz/tags',
      { tags: ['vip', 'early-adopter'] }
    );
    expect(result).toEqual(responseData);
  });

  it('should handle a single tag', async () => {
    vi.mocked(mockHttp.post).mockResolvedValue({ tags: ['newsletter'] });

    await endpoint.addTags('pub_123', 'sub_abc', ['newsletter']);

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/publications/pub_123/subscriptions/sub_abc/tags',
      { tags: ['newsletter'] }
    );
  });

  it('should work regardless of default publicationId (explicit-only method)', async () => {
    const endpointWithDefault = new SubscriptionsEndpoint(mockHttp, 'pub_default');
    vi.mocked(mockHttp.post).mockResolvedValue({ tags: ['premium'] });

    // addTags always requires explicit publicationId (3-arg signature)
    await endpointWithDefault.addTags('pub_other', 'sub_xyz', ['premium']);

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/publications/pub_other/subscriptions/sub_xyz/tags',
      { tags: ['premium'] }
    );
  });
});
