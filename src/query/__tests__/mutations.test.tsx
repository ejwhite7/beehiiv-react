/**
 * Tests for the TanStack Query mutation hooks.
 *
 * Validates that `useSubscribeMutation`:
 * - POSTs to the correct URL with the expected body
 * - Invalidates subscriber queries on success
 * - Invokes `onSuccess` / `onError` callbacks appropriately
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscribeMutation } from '../mutations.js';

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function createWrapper(apiUrl = '/api/beehiiv') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return { Wrapper, queryClient };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
          {children}
        </BeehiivProvider>
      </QueryClientProvider>
    );
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SUBSCRIPTION = {
  id: 'sub_abc123',
  publication_id: 'pub_test',
  email: 'user@example.com',
  status: 'active' as const,
  tier: 'free' as const,
  created_at: 1700000000,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSubscribeMutation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to {apiUrl}/subscribe with the correct body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscribeMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({ email: 'user@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/subscribe',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.email).toBe('user@example.com');
    expect(body.publicationId).toBe('pub_test');
  });

  it('calls onSuccess with the subscription data', async () => {
    const onSuccess = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSubscribeMutation({ onSuccess }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.mutate({ email: 'user@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledWith(MOCK_SUBSCRIPTION);
  });

  it('calls onError when the request fails', async () => {
    const onError = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid email address' }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSubscribeMutation({ onError }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.mutate({ email: 'bad' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.error?.message).toBe('Invalid email address');
  });

  it('invalidates subscriber queries on success', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSubscribeMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({ email: 'user@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['beehiiv', 'subscribers'],
      }),
    );
  });

  it('sends UTM params and custom fields in the body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscribeMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.mutate({
        email: 'user@example.com',
        customFields: { company: 'Acme' },
        utmSource: 'website',
        utmMedium: 'cta',
        utmChannel: 'web',
        utmCampaign: 'launch',
        utmTerm: 'newsletter',
        utmContent: 'hero',
        referringSite: 'https://example.com',
        reactivateExisting: true,
        sendWelcomeEmail: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.customFields).toEqual({ company: 'Acme' });
    expect(body.utmSource).toBe('website');
    expect(body.utmMedium).toBe('cta');
    expect(body.utmChannel).toBe('web');
    expect(body.utmCampaign).toBe('launch');
    expect(body.utmTerm).toBe('newsletter');
    expect(body.utmContent).toBe('hero');
    expect(body.referringSite).toBe('https://example.com');
    expect(body.reactivateExisting).toBe(true);
    expect(body.sendWelcomeEmail).toBe(false);
  });
});
