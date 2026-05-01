/**
 * Tests for the useEngagements hook.
 *
 * Validates that:
 * - It fetches engagement metrics on mount
 * - It passes start_date, end_date, and expand as query params
 * - It handles loading, data, and error states
 * - It skips the fetch when enabled is false
 * - Refetch re-fetches the engagement data
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useEngagements } from '../useEngagements.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_ENGAGEMENTS = {
  data: [
    {
      date: '2024-01-15',
      sends: 1000,
      opens: 500,
      open_rate: 0.5,
      clicks: 100,
      click_rate: 0.1,
      unsubscribes: 5,
      spam_reports: 0,
    },
    {
      date: '2024-01-16',
      sends: 1200,
      opens: 600,
      open_rate: 0.5,
      clicks: 120,
      click_rate: 0.1,
      unsubscribes: 3,
      spam_reports: 1,
    },
  ],
};

describe('useEngagements', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches engagement metrics on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_ENGAGEMENTS,
    });

    const { result } = renderHook(
      () =>
        useEngagements({
          start_date: '2024-01-15',
          end_date: '2024-01-16',
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.engagements).toHaveLength(2);
    expect(result.current.engagements[0].date).toBe('2024-01-15');
    expect(result.current.error).toBeNull();
  });

  it('passes start_date and end_date as query params', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    renderHook(
      () =>
        useEngagements({
          start_date: '2024-06-01',
          end_date: '2024-06-30',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('start_date=2024-06-01');
    expect(calledUrl).toContain('end_date=2024-06-30');
  });

  it('passes expand as query params', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    renderHook(
      () =>
        useEngagements({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          expand: ['stats'],
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('expand%5B%5D=stats');
  });

  it('handles error response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });

    const { result } = renderHook(
      () =>
        useEngagements({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Server error');
    expect(result.current.engagements).toHaveLength(0);
  });

  it('skips fetch when enabled is false', () => {
    const { result } = renderHook(
      () =>
        useEngagements({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.engagements).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refetch re-fetches the engagement data', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_ENGAGEMENTS,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-17',
              sends: 800,
              opens: 400,
              open_rate: 0.5,
              clicks: 80,
              click_rate: 0.1,
              unsubscribes: 1,
              spam_reports: 0,
            },
          ],
        }),
      });

    const { result } = renderHook(
      () =>
        useEngagements({
          start_date: '2024-01-15',
          end_date: '2024-01-17',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.engagements).toHaveLength(2);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.engagements).toHaveLength(1);
    });

    expect(result.current.engagements[0].date).toBe('2024-01-17');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('forwards publicationId as query param when provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    renderHook(
      () =>
        useEngagements({
          publicationId: 'pub_override',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('publicationId=pub_override');
  });
});
