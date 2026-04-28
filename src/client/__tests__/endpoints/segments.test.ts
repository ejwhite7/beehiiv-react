/**
 * Unit tests for the SegmentsEndpoint class.
 * Tests list, get, delete, recalculate, and listMembers methods.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SegmentsEndpoint } from '../../endpoints/segments.js';
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

describe('SegmentsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: SegmentsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new SegmentsEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the segments endpoint without params', async () => {
      const responseData = {
        data: [],
        limit: 10,
        page: 1,
        total_results: 0,
        total_pages: 0,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/segments'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and page query parameters', async () => {
      const responseData = {
        data: [{ id: 'seg_1', name: 'Test', type: 'dynamic', total_results: 10, status: 'completed', active: true }],
        limit: 20,
        page: 2,
        total_results: 50,
        total_pages: 3,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { limit: 20, page: 2 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/segments?');
      expect(calledPath).toContain('limit=20');
      expect(calledPath).toContain('page=2');
    });

    it('should include type and status filters', async () => {
      const responseData = {
        data: [],
        limit: 10,
        page: 1,
        total_results: 0,
        total_pages: 0,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { type: 'dynamic', status: 'completed' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('type=dynamic');
      expect(calledPath).toContain('status=completed');
    });

    it('should include orderBy, direction, and expand parameters', async () => {
      const responseData = {
        data: [],
        limit: 10,
        page: 1,
        total_results: 0,
        total_pages: 0,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', {
        orderBy: 'last_calculated',
        direction: 'desc',
        expand: ['stats'],
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('order_by=last_calculated');
      expect(calledPath).toContain('direction=desc');
      expect(calledPath).toContain('expand%5B%5D=stats');
    });
  });

  describe('get', () => {
    it('should GET a specific segment by ID', async () => {
      const responseData = {
        data: {
          id: 'seg_abc',
          name: 'Active Readers',
          type: 'dynamic',
          last_calculated: 1700000000,
          total_results: 150,
          status: 'completed',
          active: true,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'seg_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/segments/seg_abc'
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('delete', () => {
    it('should DELETE the segment by ID', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpoint.delete('pub_123', 'seg_abc');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_123/segments/seg_abc'
      );
    });

    it('should resolve without returning data', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      const result = await endpoint.delete('pub_123', 'seg_abc');
      expect(result).toBeUndefined();
    });
  });

  describe('recalculate', () => {
    it('should PUT to the recalculate endpoint', async () => {
      const responseData = { message: 'Segment recalculation started' };
      vi.mocked(mockHttp.put).mockResolvedValue(responseData);

      const result = await endpoint.recalculate('pub_123', 'seg_abc');

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_123/segments/seg_abc/recalculate',
        {}
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('listMembers', () => {
    it('should GET the members endpoint without params', async () => {
      const responseData = {
        data: [],
        limit: 10,
        page: 1,
        total_results: 0,
        total_pages: 0,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.listMembers('pub_123', 'seg_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/segments/seg_abc/members'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and page query parameters', async () => {
      const responseData = {
        data: [{ id: 'sub_1', email: 'user@example.com', status: 'active' }],
        limit: 25,
        page: 3,
        total_results: 100,
        total_pages: 4,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.listMembers('pub_123', 'seg_abc', { limit: 25, page: 3 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/segments/seg_abc/members?');
      expect(calledPath).toContain('limit=25');
      expect(calledPath).toContain('page=3');
    });

    it('should include expand parameters', async () => {
      const responseData = {
        data: [],
        limit: 10,
        page: 1,
        total_results: 0,
        total_pages: 0,
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.listMembers('pub_123', 'seg_abc', {
        expand: ['stats', 'custom_fields'],
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('expand%5B%5D=stats');
      expect(calledPath).toContain('expand%5B%5D=custom_fields');
    });
  });
});
