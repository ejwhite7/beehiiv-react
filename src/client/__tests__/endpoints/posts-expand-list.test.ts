/**
 * Tests for the expand parameter on PostsEndpoint.list().
 *
 * Validates that the `expand` option is correctly forwarded as
 * `expand[]` query parameters on list requests, ensuring post
 * content is included in paginated list responses.
 *
 * @module client/__tests__/endpoints/posts-expand-list.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostsEndpoint } from '../../endpoints/posts.js';
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

describe('PostsEndpoint.list expand parameter', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: PostsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new PostsEndpoint(mockHttp);
  });

  it('should include expand[] params when expand option is provided', async () => {
    vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: {} });

    await endpoint.list('pub_123', {
      expand: ['free_web_content'],
    });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('expand%5B%5D=free_web_content');
  });

  it('should include multiple expand[] params', async () => {
    vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: {} });

    await endpoint.list('pub_123', {
      expand: ['free_web_content', 'free_rss_content'],
    });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('expand%5B%5D=free_web_content');
    expect(calledPath).toContain('expand%5B%5D=free_rss_content');
  });

  it('should not include expand[] params when expand is not provided', async () => {
    vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: {} });

    await endpoint.list('pub_123', { status: 'confirmed' });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).not.toContain('expand');
  });

  it('should support expand with default publicationId', async () => {
    const endpointWithDefault = new PostsEndpoint(mockHttp, 'pub_default');
    vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: {} });

    await endpointWithDefault.list({
      expand: ['free_web_content'],
    });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('/publications/pub_default/posts');
    expect(calledPath).toContain('expand%5B%5D=free_web_content');
  });

  it('should include tags in expand params when requested', async () => {
    vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: {} });

    await endpoint.list('pub_123', {
      expand: ['free_web_content', 'tags'],
    });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('expand%5B%5D=free_web_content');
    expect(calledPath).toContain('expand%5B%5D=tags');
  });

  it('should include expand alongside pagination and filter params', async () => {
    vi.mocked(mockHttp.get).mockResolvedValue({ data: [], pagination: {} });

    await endpoint.list('pub_123', {
      page: 2,
      limit: 10,
      status: 'confirmed',
      expand: ['free_web_content'],
    });

    const calledPath = vi.mocked(mockHttp.get).mock.calls[0][0];
    expect(calledPath).toContain('page=2');
    expect(calledPath).toContain('limit=10');
    expect(calledPath).toContain('status=confirmed');
    expect(calledPath).toContain('expand%5B%5D=free_web_content');
  });
});
