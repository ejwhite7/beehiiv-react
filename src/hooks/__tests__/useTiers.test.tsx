/**
 * Tests for the useTiers hook.
 *
 * Validates that:
 * - It fetches tiers on mount with correct query params
 * - It handles loading, data, and error states
 * - Cursor-based pagination works via loadMore
 * - It skips the fetch when enabled is false
 * - Refetch re-fetches from the first page
 * - Type and active filters are forwarded as query params
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useTiers } from '../useTiers.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_TIERS_PAGE_1 = {
  data: [
    {
      id: 'tier_001',
      publication_id: 'pub_test',
      name: 'Free',
      type: 'free' as const,
      active: true,
      created_at: 1700000000,
    },
    {
      id: 'tier_002',
      publication_id: 'pub_test',
      name: 'Gold',
      type: 'premium' as const,
      price_in_cents: 999,
      currency: 'USD',
      active: true,
      created_at: 1700000100,
    },
  ],
  pagination: {
    next_cursor: 'cursor_page2',
    has_more: true,
    total_results: 4,
  },
};

const MOCK_TIERS_PAGE_2 = {
  data: [
    {
      id: 'tier_003',
      publication_id: 'pub_test',
      name: 'Platinum',
      type: 'premium' as const,
      price_in_cents: 1999,
      currency: 'USD',
      active: true,
      created_at: 1700000200,
    },
  ],
  pagination: {
    next_cursor: null,
    has_more: false,
    total_results: 4,
  },
};

describe('useTiers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches tiers on mount and transitions from loading to loaded', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TIERS_PAGE_1,
    });

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tiers).toHaveLength(2);
    expect(result.current.tiers[0].id).toBe('tier_001');
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('passes type and active as query params', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], pagination: { next_cursor: null, has_more: false, total_results: 0 } }),
    });

    renderHook(() => useTiers({ type: 'premium', active: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('type=premium');
    expect(calledUrl).toContain('active=true');
  });

  it('handles error response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Internal server error');
    expect(result.current.tiers).toHaveLength(0);
  });

  it('skips fetch when enabled is false', () => {
    const { result } = renderHook(() => useTiers({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.tiers).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('supports cursor-based pagination via loadMore', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_TIERS_PAGE_1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_TIERS_PAGE_2,
      });

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tiers).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.tiers).toHaveLength(3);
    expect(result.current.tiers[2].id).toBe('tier_003');
    expect(result.current.hasMore).toBe(false);

    // Verify cursor param was passed in the second call
    const secondCallUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as string;
    expect(secondCallUrl).toContain('cursor=cursor_page2');
  });

  it('refetch re-fetches from the first page', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_TIERS_PAGE_1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'tier_new',
              publication_id: 'pub_test',
              name: 'New Tier',
              type: 'free' as const,
              active: true,
              created_at: 1700000500,
            },
          ],
          pagination: { next_cursor: null, has_more: false, total_results: 1 },
        }),
      });

    const { result } = renderHook(() => useTiers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tiers).toHaveLength(2);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.tiers).toHaveLength(1);
    expect(result.current.tiers[0].id).toBe('tier_new');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
