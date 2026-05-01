/**
 * Unit tests for the SegmentsEndpoint.listIds() method.
 * Tests the lightweight subscriber-ID-only query that returns
 * paginated string arrays from the /segments/{segmentId}/results endpoint.
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

describe('SegmentsEndpoint.listIds', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: SegmentsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new SegmentsEndpoint(mockHttp);
  });

  it('should GET the results endpoint without params', async () => {
    const responseData = {
      data: ['sub_001', 'sub_002', 'sub_003'],
      limit: 10,
      page: 1,
      total_results: 3,
      total_pages: 1,
    };
    vi.mocked(mockHttp.get).mockResolvedValue(responseData);

    const result = await endpoint.listIds('pub_123', 'seg_abc');

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/publications/pub_123/segments/seg_abc/results'
    );
    expect(result).toEqual(responseData);
    expect(result.data).toEqual(['sub_001', 'sub_002', 'sub_003']);
  });

  it('should include limit and page query parameters', async () => {
    const responseData = {
      data: ['sub_004', 'sub_005'],
      limit: 2,
      page: 2,
      total_results: 5,
      total_pages: 3,
    };
    vi.mocked(mockHttp.get).mockResolvedValue(responseData);

    await endpoint.listIds('pub_123', 'seg_abc', { limit: 2, page: 2 });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('/publications/pub_123/segments/seg_abc/results?');
    expect(calledPath).toContain('limit=2');
    expect(calledPath).toContain('page=2');
  });

  it('should use default publicationId when called with segment ID and options', async () => {
    const endpointWithDefault = new SegmentsEndpoint(mockHttp, 'pub_default');
    vi.mocked(mockHttp.get).mockResolvedValue({
      data: ['sub_001'],
      limit: 10,
      page: 1,
      total_results: 1,
      total_pages: 1,
    });

    await endpointWithDefault.listIds('seg_abc', { limit: 10 });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('/publications/pub_default/segments/seg_abc/results');
    expect(calledPath).toContain('limit=10');
  });

  it('should use default publicationId when called with segment ID only', async () => {
    const endpointWithDefault = new SegmentsEndpoint(mockHttp, 'pub_default');
    vi.mocked(mockHttp.get).mockResolvedValue({
      data: [],
      limit: 10,
      page: 1,
      total_results: 0,
      total_pages: 0,
    });

    await endpointWithDefault.listIds('seg_abc');

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/publications/pub_default/segments/seg_abc/results'
    );
  });

  it('should return an empty array for a segment with no results', async () => {
    vi.mocked(mockHttp.get).mockResolvedValue({
      data: [],
      limit: 10,
      page: 1,
      total_results: 0,
      total_pages: 0,
    });

    const result = await endpoint.listIds('pub_123', 'seg_empty');

    expect(result.data).toEqual([]);
    expect(result.total_results).toBe(0);
  });
});
