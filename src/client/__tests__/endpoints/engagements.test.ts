/**
 * Unit tests for the EngagementsEndpoint class.
 * Tests the get method with required start_date and end_date parameters,
 * including dual-signature calling conventions and the expand parameter.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EngagementsEndpoint } from '../../endpoints/engagements.js';
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

describe('EngagementsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: EngagementsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new EngagementsEndpoint(mockHttp);
  });

  describe('get', () => {
    it('should GET the engagements endpoint with required date params', async () => {
      const responseData = {
        data: [
          {
            date: '2024-01-15',
            sends: 1000,
            opens: 500,
            open_rate: 0.5,
            clicks: 100,
            click_rate: 0.1,
            unsubscribes: 5,
            spam_reports: 0,
          },
        ],
        publication_id: 'pub_123',
        date_range: { start_date: '2024-01-01', end_date: '2024-01-31' },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/engagements');
      expect(calledPath).toContain('start_date=2024-01-01');
      expect(calledPath).toContain('end_date=2024-01-31');
      expect(result).toEqual(responseData);
    });

    it('should include expand parameters when provided', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        publication_id: 'pub_123',
        date_range: { start_date: '2024-01-01', end_date: '2024-01-31' },
      });

      await endpoint.get('pub_123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        expand: ['stats'],
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('expand%5B%5D=stats');
    });

    it('should use default publicationId when params are passed directly', async () => {
      const endpointWithDefault = new EngagementsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({
        data: [],
        publication_id: 'pub_default',
        date_range: { start_date: '2024-06-01', end_date: '2024-06-30' },
      });

      await endpointWithDefault.get({
        start_date: '2024-06-01',
        end_date: '2024-06-30',
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_default/engagements');
      expect(calledPath).toContain('start_date=2024-06-01');
      expect(calledPath).toContain('end_date=2024-06-30');
    });

    it('should throw when no publicationId is available', async () => {
      await expect(
        endpoint.get({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
      ).rejects.toThrow('publicationId is required');
    });

    it('should return multiple daily engagement records', async () => {
      const responseData = {
        data: [
          { date: '2024-01-01', sends: 500, opens: 250, open_rate: 0.5, clicks: 50, click_rate: 0.1, unsubscribes: 2, spam_reports: 0 },
          { date: '2024-01-02', sends: 600, opens: 300, open_rate: 0.5, clicks: 60, click_rate: 0.1, unsubscribes: 1, spam_reports: 0 },
        ],
        publication_id: 'pub_123',
        date_range: { start_date: '2024-01-01', end_date: '2024-01-02' },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', {
        start_date: '2024-01-01',
        end_date: '2024-01-02',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].date).toBe('2024-01-01');
      expect(result.data[1].date).toBe('2024-01-02');
    });
  });
});
