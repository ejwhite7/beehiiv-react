/**
 * Unit tests for the WebhooksEndpoint class.
 * Tests list, get, create, update, delete, and test methods,
 * including dual-signature calling conventions.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksEndpoint } from '../../endpoints/webhooks.js';
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

describe('WebhooksEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: WebhooksEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new WebhooksEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the webhooks endpoint', async () => {
      const responseData = {
        data: [
          {
            id: 'ep_abc',
            url: 'https://example.com/hook',
            created: 1700000000,
            updated: 1700000000,
            event_types: ['subscription.created'],
            description: 'Test webhook',
          },
        ],
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks'
      );
      expect(result).toEqual(responseData);
    });

    it('should return an empty array when no webhooks exist', async () => {
      const responseData = { data: [] };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(result.data).toHaveLength(0);
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new WebhooksEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: [] });

      await endpointWithDefault.list();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/webhooks'
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(endpoint.list()).rejects.toThrow(
        'publicationId is required'
      );
    });
  });

  describe('get', () => {
    it('should GET a specific webhook by ID', async () => {
      const responseData = {
        data: {
          id: 'ep_abc',
          url: 'https://example.com/hook',
          created: 1700000000,
          updated: 1700000000,
          event_types: ['subscription.created'],
          description: 'My webhook',
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'ep_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks/ep_abc'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new WebhooksEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { id: 'ep_abc' } });

      await endpointWithDefault.get('ep_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/webhooks/ep_abc'
      );
    });
  });

  describe('create', () => {
    it('should POST to the webhooks endpoint', async () => {
      const responseData = {
        data: {
          id: 'ep_new',
          url: 'https://example.com/hook',
          created: 1700000000,
          updated: 1700000000,
          event_types: ['post.sent'],
          description: '',
        },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', {
        url: 'https://example.com/hook',
        event_types: ['post.sent'],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks',
        {
          url: 'https://example.com/hook',
          event_types: ['post.sent'],
        }
      );
      expect(result).toEqual(responseData);
    });

    it('should pass all request fields including event_types array', async () => {
      const responseData = { data: { id: 'ep_new', url: 'https://example.com/hook', created: 1700000000, updated: 1700000000, event_types: ['post.sent', 'subscription.created'], description: '' } };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      await endpoint.create('pub_123', {
        url: 'https://example.com/hook',
        event_types: ['post.sent', 'subscription.created'],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks',
        {
          url: 'https://example.com/hook',
          event_types: ['post.sent', 'subscription.created'],
        }
      );
    });

    it('should use default publicationId when data is passed directly', async () => {
      const endpointWithDefault = new WebhooksEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue({ data: { id: 'ep_new' } });

      await endpointWithDefault.create({
        url: 'https://example.com/hook',
        event_types: ['post.sent'],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_default/webhooks',
        {
          url: 'https://example.com/hook',
          event_types: ['post.sent'],
        }
      );
    });
  });

  describe('update', () => {
    it('should PATCH the webhook by ID', async () => {
      const responseData = {
        data: {
          id: 'ep_abc',
          url: 'https://example.com/hook',
          created: 1700000000,
          updated: 1700001000,
          event_types: ['post.sent'],
          description: 'Updated',
        },
      };
      vi.mocked(mockHttp.patch).mockResolvedValue(responseData);

      const result = await endpoint.update('pub_123', 'ep_abc', {
        event_types: ['post.sent'],
      });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks/ep_abc',
        { event_types: ['post.sent'] }
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with id and data', async () => {
      const endpointWithDefault = new WebhooksEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.patch).mockResolvedValue({ data: { id: 'ep_abc' } });

      await endpointWithDefault.update('ep_abc', { event_types: ['post.sent'] });

      expect(mockHttp.patch).toHaveBeenCalledWith(
        '/publications/pub_default/webhooks/ep_abc',
        { event_types: ['post.sent'] }
      );
    });
  });

  describe('delete', () => {
    it('should DELETE the webhook by ID', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpoint.delete('pub_123', 'ep_abc');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks/ep_abc'
      );
    });

    it('should resolve without returning data', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      const result = await endpoint.delete('pub_123', 'ep_abc');
      expect(result).toBeUndefined();
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new WebhooksEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpointWithDefault.delete('ep_abc');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_default/webhooks/ep_abc'
      );
    });
  });

  describe('test', () => {
    it('should POST to the webhook test endpoint', async () => {
      vi.mocked(mockHttp.post).mockResolvedValue(undefined);

      await endpoint.test('pub_123', 'ep_abc');

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/webhooks/ep_abc/test',
        {}
      );
    });

    it('should resolve without returning data', async () => {
      vi.mocked(mockHttp.post).mockResolvedValue(undefined);

      const result = await endpoint.test('pub_123', 'ep_abc');
      expect(result).toBeUndefined();
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new WebhooksEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue(undefined);

      await endpointWithDefault.test('ep_abc');

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_default/webhooks/ep_abc/test',
        {}
      );
    });
  });
});
