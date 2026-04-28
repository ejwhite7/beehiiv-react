/**
 * Tests for the useSubscriberProfile hook.
 *
 * Validates that:
 * - Returns isPremium=true for active premium subscriber
 * - Returns isPremium=false for active free subscriber
 * - Returns isActive=false for inactive subscriber
 * - Returns isActive=false, isPremium=false when subscription is null
 * - isLoading=true initially, false after resolution
 * - error propagated from useSubscription
 * - enabled=false skips fetch
 * - refetch triggers a new fetch
 *
 * @module __tests__/hooks/useSubscriberProfile
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscriberProfile } from '../../hooks/useSubscriberProfile.js';

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

describe('useSubscriberProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns isPremium=true for active premium subscriber', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_PREMIUM }),
    });

    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(true);
    expect(result.current.isActive).toBe(true);
    expect(result.current.tier).toBe('premium');
    expect(result.current.status).toBe('active');
    expect(result.current.subscription).toEqual(MOCK_ACTIVE_PREMIUM);
    expect(result.current.error).toBeNull();
  });

  it('returns isPremium=false for active free subscriber', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_FREE }),
    });

    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.isActive).toBe(true);
    expect(result.current.tier).toBe('free');
    expect(result.current.status).toBe('active');
  });

  it('returns isActive=false for inactive subscriber', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_INACTIVE }),
    });

    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.status).toBe('inactive');
  });

  it('returns isActive=false, isPremium=false when subscription is null (not found)', () => {
    // No email/id provided, so useSubscription won't fetch
    const { result } = renderHook(
      () => useSubscriberProfile({}),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isActive).toBe(false);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(result.current.tier).toBeNull();
    expect(result.current.status).toBeNull();
  });

  it('isLoading=true initially, false after resolution', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_FREE }),
    });

    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('propagates error from useSubscription', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Internal server error');
  });

  it('enabled=false skips fetch', () => {
    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.subscription).toBeNull();
  });

  it('refetch triggers a new fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: MOCK_ACTIVE_FREE }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: MOCK_ACTIVE_PREMIUM }),
      });

    const { result } = renderHook(
      () => useSubscriberProfile({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tier).toBe('free');

    // Trigger refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.tier).toBe('premium');
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
