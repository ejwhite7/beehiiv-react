/**
 * Tests for the useSubscription hook.
 *
 * Validates that:
 * - It fetches subscription data on mount when enabled (default)
 * - It skips the fetch when enabled is false
 * - It fetches by id or email depending on which option is provided
 * - The refetch function re-triggers the fetch
 * - Errors are handled correctly
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscription } from '../useSubscription.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_SUBSCRIPTION = {
  id: 'sub_abc123',
  publication_id: 'pub_test',
  email: 'user@example.com',
  status: 'active' as const,
  tier: 'free' as const,
  created_at: 1700000000,
};

describe('useSubscription', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches subscription by email on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { result } = renderHook(
      () => useSubscription({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toEqual(MOCK_SUBSCRIPTION);
    expect(result.current.error).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/subscription?email=user%40example.com',
    );
  });

  it('fetches subscription by id on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { result } = renderHook(
      () => useSubscription({ id: 'sub_abc123' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toEqual(MOCK_SUBSCRIPTION);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/subscription/sub_abc123',
    );
  });

  it('accepts the normalized null envelope when email has no match', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    const { result } = renderHook(
      () => useSubscription({ email: 'missing@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('skips fetch when enabled is false', () => {
    const { result } = renderHook(
      () => useSubscription({ email: 'user@example.com', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('handles error response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Subscription not found' }),
    });

    const { result } = renderHook(
      () => useSubscription({ email: 'missing@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Subscription not found');
    expect(result.current.subscription).toBeNull();
  });

  it('refetch re-triggers the fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: MOCK_SUBSCRIPTION }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { ...MOCK_SUBSCRIPTION, status: 'inactive' },
        }),
      });

    const { result } = renderHook(
      () => useSubscription({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription?.status).toBe('active');

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.subscription?.status).toBe('inactive');
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
