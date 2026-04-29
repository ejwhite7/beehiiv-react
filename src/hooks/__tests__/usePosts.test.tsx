/**
 * Tests for the usePosts hook.
 *
 * Validates that:
 * - It fetches posts on mount when enabled (default)
 * - It passes audience and status as query params
 * - Page-based pagination works via loadMore
 * - Errors are handled correctly
 * - It skips the fetch when enabled is false
 * - The refetch function re-fetches from the first page
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { usePosts } from '../usePosts.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_POSTS_PAGE_1 = {
  data: [
    {
      id: 'post_001',
      publication_id: 'pub_test',
      title: 'First Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000000,
    },
    {
      id: 'post_002',
      publication_id: 'pub_test',
      title: 'Second Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000100,
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total_results: 4,
    total_pages: 2,
  },
};

const MOCK_POSTS_PAGE_2 = {
  data: [
    {
      id: 'post_003',
      publication_id: 'pub_test',
      title: 'Third Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000200,
    },
    {
      id: 'post_004',
      publication_id: 'pub_test',
      title: 'Fourth Post',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000300,
    },
  ],
  pagination: {
    page: 2,
    limit: 10,
    total_results: 4,
    total_pages: 2,
  },
};

describe('usePosts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches posts on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_POSTS_PAGE_1,
    });

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts[0].id).toBe('post_001');
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();

    // Verify page=1 is passed in the URL
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('page=1');
  });

  it('passes audience and status as query params', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_POSTS_PAGE_1,
    });

    renderHook(
      () => usePosts({ status: 'confirmed', audience: 'premium' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('status=confirmed');
    expect(calledUrl).toContain('audience=premium');
  });

  it('supports page-based pagination via loadMore', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_POSTS_PAGE_1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_POSTS_PAGE_2,
      });

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.posts).toHaveLength(4);
    expect(result.current.posts[2].id).toBe('post_003');
    expect(result.current.hasMore).toBe(false);

    // Verify page=2 is passed in the second call URL (not cursor)
    const secondCallUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as string;
    expect(secondCallUrl).toContain('page=2');
    expect(secondCallUrl).not.toContain('cursor');
  });

  it('handles error response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Internal server error');
    expect(result.current.posts).toHaveLength(0);
  });

  it('skips fetch when enabled is false', () => {
    const { result } = renderHook(() => usePosts({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.posts).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refetch re-fetches from the first page', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_POSTS_PAGE_1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'post_005',
              publication_id: 'pub_test',
              title: 'New First Post',
              status: 'confirmed' as const,
              audience: 'all' as const,
              created_at: 1700000400,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total_results: 1,
            total_pages: 1,
          },
        }),
      });

    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(2);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].id).toBe('post_005');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    // Verify refetch calls page=1
    const refetchUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as string;
    expect(refetchUrl).toContain('page=1');
  });
});
