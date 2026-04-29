/**
 * Unit tests for the AutomationJourneysEndpoint class.
 * Tests create and get methods, including dual-signature calling conventions.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutomationJourneysEndpoint } from '../../endpoints/automation-journeys.js';
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

describe('AutomationJourneysEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: AutomationJourneysEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new AutomationJourneysEndpoint(mockHttp);
  });

  describe('create', () => {
    it('should POST to the automation_journeys endpoint with explicit publicationId', async () => {
      const responseData = {
        data: {
          id: 'aj_new',
          automation_id: 'aut_123',
          subscriber_id: 'sub_456',
          status: 'active',
          started_at: 1700000000,
          completed_at: null,
        },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', {
        automationId: 'aut_123',
        subscriptionId: 'sub_456',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/automation_journeys',
        {
          automationId: 'aut_123',
          subscriptionId: 'sub_456',
        }
      );
      expect(result).toEqual(responseData);
    });

    it('should pass optional doubleOptOverride in the request body', async () => {
      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { id: 'aj_new', automation_id: 'aut_123', subscriber_id: 'sub_456', status: 'active', started_at: 1700000000, completed_at: null },
      });

      await endpoint.create('pub_123', {
        automationId: 'aut_123',
        subscriptionId: 'sub_456',
        doubleOptOverride: 'off',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/automation_journeys',
        {
          automationId: 'aut_123',
          subscriptionId: 'sub_456',
          doubleOptOverride: 'off',
        }
      );
    });

    it('should use default publicationId when data is passed directly', async () => {
      const endpointWithDefault = new AutomationJourneysEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { id: 'aj_new' },
      });

      await endpointWithDefault.create({
        automationId: 'aut_123',
        subscriptionId: 'sub_456',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_default/automation_journeys',
        {
          automationId: 'aut_123',
          subscriptionId: 'sub_456',
        }
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.create({
          automationId: 'aut_123',
          subscriptionId: 'sub_456',
        })
      ).rejects.toThrow('publicationId is required');
    });

    it('should override default publicationId when called with explicit one', async () => {
      const endpointWithDefault = new AutomationJourneysEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { id: 'aj_new' },
      });

      await endpointWithDefault.create('pub_override', {
        automationId: 'aut_123',
        subscriptionId: 'sub_456',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_override/automation_journeys',
        {
          automationId: 'aut_123',
          subscriptionId: 'sub_456',
        }
      );
    });
  });

  describe('get', () => {
    it('should GET a specific automation journey by ID with explicit publicationId', async () => {
      const responseData = {
        data: {
          id: 'aj_abc',
          automation_id: 'aut_123',
          subscriber_id: 'sub_456',
          status: 'completed',
          started_at: 1700000000,
          completed_at: 1700010000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'aj_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/automation_journeys/aj_abc'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new AutomationJourneysEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { id: 'aj_abc' },
      });

      await endpointWithDefault.get('aj_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/automation_journeys/aj_abc'
      );
    });

    it('should throw when no publicationId is available and called with one arg', async () => {
      await expect(endpoint.get('aj_abc')).rejects.toThrow(
        'publicationId is required'
      );
    });

    it('should override default publicationId when called with explicit one', async () => {
      const endpointWithDefault = new AutomationJourneysEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: { id: 'aj_abc' },
      });

      await endpointWithDefault.get('pub_override', 'aj_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_override/automation_journeys/aj_abc'
      );
    });
  });
});
