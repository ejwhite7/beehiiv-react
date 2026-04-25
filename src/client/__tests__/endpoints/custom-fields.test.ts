/**
 * Unit tests for the CustomFieldsEndpoint class.
 * Tests list, get, create, update, and delete operations.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomFieldsEndpoint } from '../../endpoints/custom-fields.js';
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

describe('CustomFieldsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: CustomFieldsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new CustomFieldsEndpoint(mockHttp);
  });

  describe('list', () => {
    it('should GET custom fields without parameters', async () => {
      const responseData = {
        data: [
          { id: 'cf_1', kind: 'string', display: 'Company', created: 1700000000 },
        ],
        pagination: { page: 1, limit: 10, total_results: 1, total_pages: 1 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/custom_fields'
      );
      expect(result).toEqual(responseData);
    });

    it('should include pagination parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: { page: 2, limit: 5, total_results: 12, total_pages: 3 } });

      await endpoint.list('pub_123', { limit: 5, page: 2 });

      const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
      expect(calledPath).toContain('/publications/pub_123/custom_fields?');
      expect(calledPath).toContain('limit=5');
      expect(calledPath).toContain('page=2');
    });

    it('should return paginated response with metadata', async () => {
      const responseData = {
        data: [
          { id: 'cf_1', kind: 'string', display: 'Company', created: 1700000000 },
          { id: 'cf_2', kind: 'integer', display: 'Age', created: 1700000001 },
        ],
        pagination: { page: 1, limit: 10, total_results: 2, total_pages: 1 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.list('pub_123');

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total_results).toBe(2);
    });
  });

  describe('get', () => {
    it('should GET a single custom field by ID', async () => {
      const responseData = {
        data: { id: 'cf_abc', kind: 'string', display: 'Company', created: 1700000000 },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.get('pub_123', 'cf_abc');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/custom_fields/cf_abc'
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('create', () => {
    it('should POST a new custom field', async () => {
      const responseData = {
        data: { id: 'cf_new', kind: 'string', display: 'Job Title', created: 1700000000 },
      };
      vi.mocked(mockHttp.post).mockResolvedValue(responseData);

      const result = await endpoint.create('pub_123', {
        kind: 'string',
        display: 'Job Title',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/custom_fields',
        { kind: 'string', display: 'Job Title' }
      );
      expect(result).toEqual(responseData);
    });

    it('should support all custom field kinds', async () => {
      vi.mocked(mockHttp.post).mockResolvedValue({
        data: { id: 'cf_bool', kind: 'boolean', display: 'Opted In', created: 1700000000 },
      });

      await endpoint.create('pub_123', {
        kind: 'boolean',
        display: 'Opted In',
      });

      expect(mockHttp.post).toHaveBeenCalledWith(
        '/publications/pub_123/custom_fields',
        { kind: 'boolean', display: 'Opted In' }
      );
    });
  });

  describe('update', () => {
    it('should PUT an updated custom field', async () => {
      const responseData = {
        data: { id: 'cf_abc', kind: 'string', display: 'Updated Name', created: 1700000000 },
      };
      vi.mocked(mockHttp.put).mockResolvedValue(responseData);

      const result = await endpoint.update('pub_123', 'cf_abc', {
        display: 'Updated Name',
      });

      expect(mockHttp.put).toHaveBeenCalledWith(
        '/publications/pub_123/custom_fields/cf_abc',
        { display: 'Updated Name' }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('delete', () => {
    it('should DELETE a custom field by ID', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      await endpoint.delete('pub_123', 'cf_abc');

      expect(mockHttp.delete).toHaveBeenCalledWith(
        '/publications/pub_123/custom_fields/cf_abc'
      );
    });

    it('should resolve without returning data', async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue(undefined);

      const result = await endpoint.delete('pub_123', 'cf_xyz');
      expect(result).toBeUndefined();
    });
  });
});
