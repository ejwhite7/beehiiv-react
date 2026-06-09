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
      // Real API shape: { message, import_id } (per the OpenAPI spec)
      const responseData = {
        message: 'Bulk Subscription Create Request Sent.',
        import_id: '00000000-0000-0000-0000-000000000001',
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
        message: 'Bulk Subscription Create Request Sent.',
        import_id: '00000000-0000-0000-0000-000000000002',
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
          {
            id: 'job_1',
            type: 'bulk',
            status: 'complete',
            publication_id: 'pub_123',
            created: 1704067200,
            updated: 1704067260,
            completed: 1704067260,
          },
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
          type: 'bulk',
          status: 'complete',
          publication_id: 'pub_123',
          created: 1704067200,
          updated: 1704067500,
          completed: 1704067500,
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
        data: {
          id: 'job_abc',
          type: 'status',
          status: 'pending',
          publication_id: 'pub_default',
          created: 1704067200,
          updated: null,
          completed: null,
        },
      });

      await endpointWithDefault.get('job_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/bulk_subscription_updates/job_abc'
      );
    });
  });

  describe('bulkUpdateFields', () => {
    it('should PUT to the bulk_actions endpoint (verified against beehiiv docs)', async () => {
      // Real API shape: { data: { subscription_update_id } } (per the OpenAPI spec)
      const responseData = {
        data: { subscription_update_id: 'su_001' },
      };
      vi.mocked(mockHttp.put).mockResolvedValue(responseData);

      const body = {
        subscriptions: [
          { subscription_id: 'sub_1', tier: 'premium' },
          { subscription_id: 'sub_2', tier: 'premium' },
        ],
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
      vi.mocked(mockHttp.put).mockResolvedValue({
        data: { subscription_update_id: 'su_002' },
      });

      await endpointWithDefault.bulkUpdateFields({
        subscriptions: [
          {
            subscription_id: 'sub_3',
            custom_fields: [{ name: 'Company', value: 'Acme' }],
          },
        ],
      });

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_default/subscriptions/bulk_actions',
        {
          subscriptions: [
            {
              subscription_id: 'sub_3',
              custom_fields: [{ name: 'Company', value: 'Acme' }],
            },
          ],
        }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.bulkUpdateFields({
          subscriptions: [{ subscription_id: 'sub_1', tier: 'free' }],
        })
      ).rejects.toThrow('publicationId is required');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should PUT to the subscriptions endpoint and resolve void on 204 (verified against beehiiv docs)', async () => {
      // The API returns 204 No Content; the HTTP client resolves undefined
      vi.mocked(mockHttp.put).mockResolvedValue(undefined);

      const body = {
        subscription_ids: ['sub_1', 'sub_2'],
        new_status: 'active' as const,
      };

      const result = await endpoint.bulkUpdateStatus('pub_123', body);

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_123/subscriptions',
        body
      );
      expect(result).toBeUndefined();
    });

    it('should use default publicationId when body is passed directly', async () => {
      const endpointWithDefault = new BulkSubscriptionUpdatesEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.put).mockResolvedValue(undefined);

      await endpointWithDefault.bulkUpdateStatus({
        subscription_ids: ['sub_4'],
        new_status: 'inactive',
      });

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_default/subscriptions',
        { subscription_ids: ['sub_4'], new_status: 'inactive' }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.bulkUpdateStatus({
          subscription_ids: ['sub_1'],
          new_status: 'active',
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
