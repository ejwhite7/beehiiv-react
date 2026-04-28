/**
 * Tests for the usePublications hook.
 *
 * Validates that:
 * - It fetches publications on mount when enabled (default)
 * - It returns loading state during the fetch
 * - It returns data on successful fetch
 * - It returns an error on failure
 * - The refetch function re-triggers the fetch
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { usePublications } from '../usePublications.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_PUBLICATIONS = [
  {
    id: 'pub_001',
    name: 'Tech Newsletter',
    created: 1700000000,
    timezone: 'America/New_York',
  },
  {
    id: 'pub_002',
    name: 'Design Weekly',
    created: 1700000100,
    timezone: 'Europe/London',
  },
];

describe('usePublications', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches publications on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_PUBLICATIONS }),
    });

    const { result } = renderHook(() => usePublications(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.publications).toHaveLength(2);
    expect(result.current.publications[0].id).toBe('pub_001');
    expect(result.current.error).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/publications');
  });

  it('returns loading state during fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_PUBLICATIONS }),
    });

    const { result } = renderHook(() => usePublications(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.publications).toHaveLength(0);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns data on successful fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_PUBLICATIONS }),
    });

    const { result } = renderHook(() => usePublications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.publications).toEqual(MOCK_PUBLICATIONS);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(() => usePublications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Internal server error');
    expect(result.current.publications).toEqual([]);
  });

  it('passes expand query parameter', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_PUBLICATIONS }),
    });

    renderHook(() => usePublications({ expand: 'stats' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('expand=stats');
  });

  it('refetch re-triggers the fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: MOCK_PUBLICATIONS }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            ...MOCK_PUBLICATIONS,
            {
              id: 'pub_003',
              name: 'New Publication',
              created: 1700000200,
              timezone: 'Asia/Tokyo',
            },
          ],
        }),
      });

    const { result } = renderHook(() => usePublications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.publications).toHaveLength(2);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.publications).toHaveLength(3);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('skips fetch when enabled is false', () => {
    const { result } = renderHook(
      () => usePublications({ enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.publications).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
