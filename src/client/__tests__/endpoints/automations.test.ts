/**
 * Unit tests for the AutomationsEndpoint class.
 * Tests list, get, create, and listJourneys methods.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutomationsEndpoint } from '../../endpoints/automations.js';
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

describe('AutomationsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: AutomationsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new AutomationsEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET the automations endpoint without params', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/automations'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit and cursor query parameters', async () => {
      const responseData = {
        data: [{ id: 'aut_1' }],
        pagination: { next_cursor: 'cursor_2', has_more: true, total_results: 50 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { limit: 10, cursor: 'cursor_1' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/automations?');
      expect(calledPath).toContain('limit=10');
      expect(calledPath).toContain('cursor=cursor_1');
    });

    it('should include status filter', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.list('pub_123', { status: 'active' });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('status=active');
    });
  });

  describe('get', () => {
    it('should GET a single automation by ID', async () => {
      const responseData = {
        data: {
          id: 'aut_abc',
          publication_id: 'pub_123',
          name: 'Welcome Series',
          status: 'active',
          trigger: { type: 'subscriber_created', config: {} },
          steps: [],
          subscriber_count: 100,
          created_at: 1700000000,
          updated_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'aut_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/automations/aut_abc'
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('create', () => {
    it('should POST to the automations endpoint', async () => {
      const responseData = {
        data: {
          id: 'aut_new',
          publication_id: 'pub_123',
          name: 'Welcome',
          status: 'draft',
          trigger: { type: 'subscriber_created', config: {} },
          steps: [],
          subscriber_count: 0,
          created_at: 1700000000,
          updated_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', {
        name: 'Welcome',
        trigger: { type: 'subscriber_created', config: {} },
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/automations',
        {
          name: 'Welcome',
          trigger: { type: 'subscriber_created', config: {} },
        }
      );
      expect(result).toEqual(responseData);
    });

    it('should pass optional steps in the request body', async () => {
      const responseData = {
        data: {
          id: 'aut_new',
          publication_id: 'pub_123',
          name: 'Onboarding',
          status: 'draft',
          trigger: { type: 'subscriber_created', config: {} },
          steps: [{ id: 'step_1', type: 'send_email', config: {}, position: 0 }],
          subscriber_count: 0,
          created_at: 1700000000,
          updated_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      await endpoint.create('pub_123', {
        name: 'Onboarding',
        trigger: { type: 'subscriber_created', config: {} },
        steps: [{ type: 'send_email', config: { template_id: 'tpl_1' }, position: 0 }],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/automations',
        {
          name: 'Onboarding',
          trigger: { type: 'subscriber_created', config: {} },
          steps: [{ type: 'send_email', config: { template_id: 'tpl_1' }, position: 0 }],
        }
      );
    });
  });

  describe('listJourneys', () => {
    it('should GET the journeys endpoint without params', async () => {
      const responseData = {
        data: [],
        pagination: { next_cursor: null, has_more: false, total_results: 0 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.listJourneys('pub_123', 'aut_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/automations/aut_abc/journeys'
      );
      expect(result).toEqual(responseData);
    });

    it('should include limit, cursor, and status query parameters', async () => {
      const responseData = {
        data: [{ id: 'journey_1' }],
        pagination: { next_cursor: 'cursor_2', has_more: true, total_results: 20 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      await endpoint.listJourneys('pub_123', 'aut_abc', {
        limit: 5,
        cursor: 'cursor_1',
        status: 'active',
      });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/automations/aut_abc/journeys?');
      expect(calledPath).toContain('limit=5');
      expect(calledPath).toContain('cursor=cursor_1');
      expect(calledPath).toContain('status=active');
    });

    it('should support cursor-based pagination across pages', async () => {
      // Page 1
      vi.mocked(mockHttp.get).mockResolvedValueOnce({
        data: [{ id: 'journey_1' }, { id: 'journey_2' }],
        pagination: { next_cursor: 'page2_cursor', has_more: true, total_results: 4 },
      });

      // Page 2
      vi.mocked(mockHttp.get).mockResolvedValueOnce({
        data: [{ id: 'journey_3' }, { id: 'journey_4' }],
        pagination: { next_cursor: null, has_more: false, total_results: 4 },
      });

      const page1 = await endpoint.listJourneys('pub_123', 'aut_abc', { limit: 2 });
      expect(page1.pagination.has_more).toBe(true);
      expect(page1.pagination.next_cursor).toBe('page2_cursor');

      const page2 = await endpoint.listJourneys('pub_123', 'aut_abc', {
        limit: 2,
        cursor: page1.pagination.next_cursor!,
      });
      expect(page2.pagination.has_more).toBe(false);
      expect(page2.data).toHaveLength(2);
    });
  });
});
