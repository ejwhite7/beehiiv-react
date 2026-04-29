/**
 * Tests for the usePosts hook expand parameter and load-more content rendering.
 *
 * Validates that:
 * - The expand parameter is forwarded as expand[] query params on all fetches
 * - Load-more (paginated) requests include the expand parameter
 * - Posts from all pages retain their content field after state merge
 *
 * This test file specifically targets the bug where "Load More" would load
 * additional posts but their content (body/HTML) would not render because
 * the expand parameter was missing from paginated requests.
 *
 * @module hooks/__tests__/usePosts-expand.test
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { usePosts } from '../usePosts.js';

/** Create a wrapper with the BeehiivProvider context */
function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

/** Page 1 mock data with post content included (as if expand was sent) */
const MOCK_PAGE_1_WITH_CONTENT = {
  data: [
    {
      id: 'post_001',
      publication_id: 'pub_test',
      title: 'First Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000000,
      content: {
        free: {
          web: '<p>First post content</p>',
          rss: '<p>First post RSS</p>',
        },
      },
    },
    {
      id: 'post_002',
      publication_id: 'pub_test',
      title: 'Second Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000100,
      content: {
        free: {
          web: '<p>Second post content</p>',
          rss: '<p>Second post RSS</p>',
        },
      },
    },
  ],
  pagination: {
    page: 1,
    limit: 2,
    total_results: 4,
    total_pages: 2,
  },
};

/** Page 2 mock data with post content included (as if expand was sent) */
const MOCK_PAGE_2_WITH_CONTENT = {
  data: [
    {
      id: 'post_003',
      publication_id: 'pub_test',
      title: 'Third Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000200,
      content: {
        free: {
          web: '<p>Third post content</p>',
          rss: '<p>Third post RSS</p>',
        },
      },
    },
    {
      id: 'post_004',
      publication_id: 'pub_test',
      title: 'Fourth Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000300,
      content: {
        free: {
          web: '<p>Fourth post content</p>',
          rss: '<p>Fourth post RSS</p>',
        },
      },
    },
  ],
  pagination: {
    page: 2,
    limit: 2,
    total_results: 4,
    total_pages: 2,
  },
};

describe('usePosts expand parameter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes expand[] in the initial fetch URL when expand option is provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_PAGE_1_WITH_CONTENT,
    });

    renderHook(
      () => usePosts({ expand: ['free_web_content'] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('expand%5B%5D=free_web_content');
  });

  it('includes expand[] in load-more (page 2) fetch URL', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PAGE_1_WITH_CONTENT,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PAGE_2_WITH_CONTENT,
      });

    const { result } = renderHook(
      () => usePosts({ expand: ['free_web_content'] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    /* Trigger load-more */
    await act(async () => {
      await result.current.loadMore();
    });

    /* Verify the second fetch (load-more) also includes expand[] */
    const secondCallUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as string;
    expect(secondCallUrl).toContain('page=2');
    expect(secondCallUrl).toContain('expand%5B%5D=free_web_content');
  });

  it('retains content on all posts after load-more merges pages', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PAGE_1_WITH_CONTENT,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PAGE_2_WITH_CONTENT,
      });

    const { result } = renderHook(
      () => usePosts({ expand: ['free_web_content'] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    /* Verify first page posts have content */
    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts[0].content?.free.web).toBe('<p>First post content</p>');
    expect(result.current.posts[1].content?.free.web).toBe('<p>Second post content</p>');

    /* Load more */
    await act(async () => {
      await result.current.loadMore();
    });

    /* Verify ALL posts (pages 1 + 2) have their content intact */
    expect(result.current.posts).toHaveLength(4);
    expect(result.current.posts[0].content?.free.web).toBe('<p>First post content</p>');
    expect(result.current.posts[1].content?.free.web).toBe('<p>Second post content</p>');
    expect(result.current.posts[2].content?.free.web).toBe('<p>Third post content</p>');
    expect(result.current.posts[3].content?.free.web).toBe('<p>Fourth post content</p>');
  });

  it('supports multiple expand fields on all fetches', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PAGE_1_WITH_CONTENT,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_PAGE_2_WITH_CONTENT,
      });

    const { result } = renderHook(
      () => usePosts({ expand: ['free_web_content', 'free_rss_content'] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    /* Verify first fetch includes both expand params */
    const firstCallUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(firstCallUrl).toContain('expand%5B%5D=free_web_content');
    expect(firstCallUrl).toContain('expand%5B%5D=free_rss_content');

    /* Load more */
    await act(async () => {
      await result.current.loadMore();
    });

    /* Verify second fetch also includes both expand params */
    const secondCallUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as string;
    expect(secondCallUrl).toContain('expand%5B%5D=free_web_content');
    expect(secondCallUrl).toContain('expand%5B%5D=free_rss_content');
  });

  it('does not include expand[] when expand option is not provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      }),
    });

    renderHook(
      () => usePosts(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).not.toContain('expand');
  });
});
