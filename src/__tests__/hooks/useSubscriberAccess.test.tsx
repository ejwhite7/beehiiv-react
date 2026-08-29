/**
 * Tests for the useSubscriberAccess hook.
 *
 * Validates that:
 * - canView=true when subscriber is active and audience matches tier
 * - canView=false when subscriber is inactive
 * - canView=true when audience='all' regardless of subscriber state
 * - isLoading=true initially, false after resolution
 * - error is propagated from useSubscription
 *
 * @module __tests__/hooks/useSubscriberAccess
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscriberAccess } from '../../hooks/useSubscriberAccess.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_ACTIVE_FREE = {
  id: 'sub_abc123',
  publication_id: 'pub_test',
  email: 'user@example.com',
  status: 'active' as const,
  tier: 'free' as const,
  created_at: 1700000000,
};

const MOCK_ACTIVE_PREMIUM = {
  ...MOCK_ACTIVE_FREE,
  tier: 'premium' as const,
};

const MOCK_INACTIVE = {
  ...MOCK_ACTIVE_FREE,
  status: 'inactive' as const,
};

describe('useSubscriberAccess', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns canView=true when subscriber is active free and audience is "free"', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_FREE }),
    });

    const { result } = renderHook(
      () => useSubscriberAccess({ email: 'user@example.com', audience: 'free' }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canView).toBe(true);
    expect(result.current.tier).toBe('free');
    expect(result.current.status).toBe('active');
    expect(result.current.isActive).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns canView=true when subscriber is active premium and audience is "premium"', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_PREMIUM }),
    });

    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          email: 'user@example.com',
          audience: 'premium',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canView).toBe(true);
    expect(result.current.tier).toBe('premium');
  });

  it('returns canView=false when subscriber is active free and audience is "premium"', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_FREE }),
    });

    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          email: 'user@example.com',
          audience: 'premium',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canView).toBe(false);
    expect(result.current.tier).toBe('free');
  });

  it('returns canView=false when subscriber is inactive', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_INACTIVE }),
    });

    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          email: 'user@example.com',
          audience: 'free',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canView).toBe(false);
    expect(result.current.isActive).toBe(false);
  });

  it('returns canView=true when audience is "all" regardless of subscriber state', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_INACTIVE }),
    });

    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          email: 'user@example.com',
          audience: 'all',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canView).toBe(true);
  });

  it('returns canView=true for "all" audience even with no subscriber (null tier/status)', async () => {
    // No email/id provided, so useSubscription won't fetch
    const { result } = renderHook(
      () => useSubscriberAccess({ audience: 'all' }),
      { wrapper: createWrapper() },
    );

    // Should resolve immediately since there's no fetch
    expect(result.current.isLoading).toBe(false);
    expect(result.current.canView).toBe(true);
    expect(result.current.tier).toBeNull();
    expect(result.current.status).toBeNull();
  });

  it('allows ungated free-reader content without a subscriber', () => {
    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          audience: 'free',
          enforceGatedContent: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.canView).toBe(true);
  });

  it('fails closed for free-reader content when gate metadata is omitted', () => {
    const { result } = renderHook(
      () => useSubscriberAccess({ audience: 'free' }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.canView).toBe(false);
  });

  it('isLoading=true initially, false after resolution', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_FREE }),
    });

    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          email: 'user@example.com',
          audience: 'free',
        }),
      { wrapper: createWrapper() },
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.canView).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canView).toBe(true);
  });

  it('propagates error from useSubscription', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(
      () =>
        useSubscriberAccess({
          email: 'user@example.com',
          audience: 'free',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.canView).toBe(false);
  });
});
