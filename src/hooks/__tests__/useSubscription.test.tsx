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

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function successfulResponse(data: typeof MOCK_SUBSCRIPTION) {
  return {
    ok: true,
    json: async () => ({ data }),
  };
}

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

  it('ignores a deferred response after fetching is disabled', async () => {
    const pending = deferred<ReturnType<typeof successfulResponse>>();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      pending.promise,
    );

    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useSubscription({ email: 'user@example.com', enabled }),
      {
        initialProps: { enabled: true },
        wrapper: createWrapper(),
      },
    );

    rerender({ enabled: false });
    await act(async () => {
      pending.resolve(successfulResponse(MOCK_SUBSCRIPTION));
      await pending.promise;
    });

    expect(result.current.subscription).toBeNull();
  });

  it('ignores a deferred response after the identifier is removed', async () => {
    const pending = deferred<ReturnType<typeof successfulResponse>>();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      pending.promise,
    );

    const { result, rerender } = renderHook(
      ({ email }) => useSubscription({ email }),
      {
        initialProps: { email: 'user@example.com' as string | undefined },
        wrapper: createWrapper(),
      },
    );

    rerender({ email: undefined });
    await act(async () => {
      pending.resolve(successfulResponse(MOCK_SUBSCRIPTION));
      await pending.promise;
    });

    expect(result.current.subscription).toBeNull();
  });

  it('keeps the newest result when identifiers change rapidly', async () => {
    const first = deferred<ReturnType<typeof successfulResponse>>();
    const second = deferred<ReturnType<typeof successfulResponse>>();
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ email }) => useSubscription({ email }),
      {
        initialProps: { email: 'first@example.com' },
        wrapper: createWrapper(),
      },
    );

    rerender({ email: 'second@example.com' });
    await act(async () => {
      second.resolve(
        successfulResponse({ ...MOCK_SUBSCRIPTION, email: 'second@example.com' }),
      );
      await second.promise;
    });
    expect(result.current.subscription?.email).toBe('second@example.com');

    await act(async () => {
      first.resolve(
        successfulResponse({ ...MOCK_SUBSCRIPTION, email: 'first@example.com' }),
      );
      await first.promise;
    });
    expect(result.current.subscription?.email).toBe('second@example.com');
  });

  it('invalidates a deferred response on unmount', async () => {
    const pending = deferred<ReturnType<typeof successfulResponse>>();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      pending.promise,
    );
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { unmount } = renderHook(
      () => useSubscription({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    unmount();
    await act(async () => {
      pending.resolve(successfulResponse(MOCK_SUBSCRIPTION));
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});
