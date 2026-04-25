/**
 * Tests for the useCustomFields hook.
 *
 * Validates that:
 * - It fetches custom fields on mount
 * - Error state is set when the fetch fails
 * - The refetch function re-triggers the fetch
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useCustomFields } from '../useCustomFields.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_FIELDS = [
  { id: 'cf_1', kind: 'string' as const, display: 'Company', created: 1700000000 },
  { id: 'cf_2', kind: 'boolean' as const, display: 'Opted In', created: 1700000001 },
];

describe('useCustomFields', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches custom fields on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_FIELDS }),
    });

    const { result } = renderHook(() => useCustomFields(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fields).toEqual(MOCK_FIELDS);
    expect(result.current.error).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/custom-fields');
  });

  it('sets error state on fetch failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    const { result } = renderHook(() => useCustomFields(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Internal server error');
    expect(result.current.fields).toEqual([]);
  });

  it('handles network error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network failure'),
    );

    const { result } = renderHook(() => useCustomFields(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.fields).toEqual([]);
  });

  it('refetch re-triggers the fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: MOCK_FIELDS }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            ...MOCK_FIELDS,
            { id: 'cf_3', kind: 'integer' as const, display: 'Age', created: 1700000002 },
          ],
        }),
      });

    const { result } = renderHook(() => useCustomFields(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fields).toHaveLength(2);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.fields).toHaveLength(3);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
