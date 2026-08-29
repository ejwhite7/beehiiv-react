/**
 * Tests for the useSubscribe hook.
 *
 * Validates that:
 * - A successful subscription POSTs to the correct endpoint and updates state
 * - Error responses are handled and set the error state
 * - Loading state transitions correctly during the request lifecycle
 * - The reset() function restores initial state
 * - onSuccess and onError callbacks are invoked appropriately
 */

import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useSubscribe } from '../useSubscribe.js';

/** Wrapper that provides the BeehiivProvider context */
function createWrapper(apiUrl = '/api/beehiiv', publicationId = 'pub_test') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId={publicationId}>
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

describe('useSubscribe', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn() as ReturnType<typeof vi.fn>,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useSubscribe(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('keeps a stable subscribe identity across re-renders with inline options', () => {
    const { result, rerender } = renderHook(
      // A fresh options object every render, as callers typically write it
      () => useSubscribe({ onSuccess: () => undefined }),
      { wrapper: createWrapper() },
    );

    const firstSubscribe = result.current.subscribe;
    rerender();
    expect(result.current.subscribe).toBe(firstSubscribe);
  });

  it('invokes the latest onSuccess callback passed on a later render', async () => {
    const firstOnSuccess = vi.fn();
    const secondOnSuccess = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { result, rerender } = renderHook(
      ({ onSuccess }: { onSuccess: (s: unknown) => void }) =>
        useSubscribe({ onSuccess }),
      {
        wrapper: createWrapper(),
        initialProps: { onSuccess: firstOnSuccess },
      },
    );

    rerender({ onSuccess: secondOnSuccess });

    await act(async () => {
      await result.current.subscribe({ email: 'user@example.com' });
    });

    expect(firstOnSuccess).not.toHaveBeenCalled();
    expect(secondOnSuccess).toHaveBeenCalledWith(MOCK_SUBSCRIPTION);
  });

  it('successfully subscribes and calls onSuccess', async () => {
    const onSuccess = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { result } = renderHook(
      () => useSubscribe({ onSuccess }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.subscribe({ email: 'user@example.com' });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(MOCK_SUBSCRIPTION);

    // Verify fetch was called with correct URL and body
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

  it('handles error response and calls onError', async () => {
    const onError = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid email address' }),
    });

    const { result } = renderHook(
      () => useSubscribe({ onError }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.subscribe({ email: 'bad-email' });
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid email address');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles network error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network failure'),
    );

    const { result } = renderHook(() => useSubscribe(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.subscribe({ email: 'user@example.com' });
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('sends custom fields, UTM params, and reactivate flag', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { result } = renderHook(() => useSubscribe(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.subscribe({
        email: 'user@example.com',
        customFields: { company: 'Acme' },
        reactivateExisting: true,
        sendWelcomeEmail: false,
        utmSource: 'website',
        utmMedium: 'cta',
        utmChannel: 'web',
        utmCampaign: 'launch',
        utmTerm: 'newsletter',
        utmContent: 'hero',
        referringSite: 'https://example.com',
      });
    });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.customFields).toEqual({ company: 'Acme' });
    expect(body.reactivateExisting).toBe(true);
    expect(body.sendWelcomeEmail).toBe(false);
    expect(body.utmSource).toBe('website');
    expect(body.utmMedium).toBe('cta');
    expect(body.utmChannel).toBe('web');
    expect(body.utmCampaign).toBe('launch');
    expect(body.utmTerm).toBe('newsletter');
    expect(body.utmContent).toBe('hero');
    expect(body.referringSite).toBe('https://example.com');
  });

  it('resets state back to initial values', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_SUBSCRIPTION }),
    });

    const { result } = renderHook(() => useSubscribe(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.subscribe({ email: 'user@example.com' });
    });

    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
