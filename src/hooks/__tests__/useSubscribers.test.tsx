/**
 * Tests for the useSubscribers hook.
 *
 * Validates that:
 * - It fetches subscribers on mount when enabled (default)
 * - It returns loading state during the fetch
 * - It returns data on successful fetch
 * - It returns an error on failure
 * - Cursor-based pagination works via fetchMore
 * - It skips the fetch when enabled is false
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscribers } from '../useSubscribers.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_SUBSCRIBERS_PAGE_1 = {
  data: [
    {
      id: 'sub_001',
      publication_id: 'pub_test',
      email: 'alice@example.com',
      status: 'active' as const,
      tier: 'premium' as const,
      created_at: 1700000000,
    },
    {
      id: 'sub_002',
      publication_id: 'pub_test',
      email: 'bob@example.com',
      status: 'active' as const,
      tier: 'free' as const,
      created_at: 1700000100,
    },
  ],
  pagination: {
    next_cursor: 'cursor_page2',
    has_more: true,
    total_results: 4,
  },
};

const MOCK_SUBSCRIBERS_PAGE_2 = {
  data: [
    {
      id: 'sub_003',
      publication_id: 'pub_test',
      email: 'charlie@example.com',
      status: 'active' as const,
      tier: 'free' as const,
      created_at: 1700000200,
    },
    {
      id: 'sub_004',
      publication_id: 'pub_test',
      email: 'diana@example.com',
      status: 'active' as const,
      tier: 'premium' as const,
      created_at: 1700000300,
    },
  ],
  pagination: {
    next_cursor: null,
    has_more: false,
    total_results: 4,
  },
};

describe('useSubscribers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches subscribers on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SUBSCRIBERS_PAGE_1,
    });

    const { result } = renderHook(() => useSubscribers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscribers).toHaveLength(2);
    expect(result.current.subscribers[0].id).toBe('sub_001');
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns loading state during fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SUBSCRIBERS_PAGE_1,
    });

    const { result } = renderHook(() => useSubscribers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.subscribers).toHaveLength(0);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns data on successful fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SUBSCRIBERS_PAGE_1,
    });

    const { result } = renderHook(
      () => useSubscribers({ status: 'active', tier: 'premium' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscribers).toHaveLength(2);
    expect(result.current.subscribers[0].email).toBe('alice@example.com');
    expect(result.current.error).toBeNull();

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('status=active');
    expect(calledUrl).toContain('tier=premium');
  });

  it('returns error on failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(() => useSubscribers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Internal server error');
    expect(result.current.subscribers).toHaveLength(0);
  });

  it('fetchMore appends results', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_SUBSCRIBERS_PAGE_1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_SUBSCRIBERS_PAGE_2,
      });

    const { result } = renderHook(() => useSubscribers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscribers).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.fetchMore();
    });

    await waitFor(() => {
      expect(result.current.subscribers).toHaveLength(4);
    });

    expect(result.current.subscribers[2].id).toBe('sub_003');
    expect(result.current.hasMore).toBe(false);

    const secondCallUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as string;
    expect(secondCallUrl).toContain('cursor=cursor_page2');
  });

  it('respects enabled=false', () => {
    const { result } = renderHook(() => useSubscribers({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.subscribers).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
