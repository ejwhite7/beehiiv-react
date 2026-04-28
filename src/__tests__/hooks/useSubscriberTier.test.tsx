/**
 * Tests for the useSubscriberTier hook.
 *
 * Validates that:
 * - Returns same tier/isPremium/isActive values as useSubscriberProfile
 * - Does NOT return a subscription property
 *
 * @module __tests__/hooks/useSubscriberTier
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscriberTier } from '../../hooks/useSubscriberTier.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_ACTIVE_PREMIUM = {
  id: 'sub_abc123',
  publication_id: 'pub_test',
  email: 'user@example.com',
  status: 'active' as const,
  tier: 'premium' as const,
  created_at: 1700000000,
};

describe('useSubscriberTier', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns same tier/isPremium/isActive values as useSubscriberProfile', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_PREMIUM }),
    });

    const { result } = renderHook(
      () => useSubscriberTier({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tier).toBe('premium');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isActive).toBe(true);
    expect(result.current.status).toBe('active');
    expect(result.current.error).toBeNull();
  });

  it('does NOT return a subscription property', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_ACTIVE_PREMIUM }),
    });

    const { result } = renderHook(
      () => useSubscriberTier({ email: 'user@example.com' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current as Record<string, unknown>)['subscription']).toBeUndefined();
  });
});
