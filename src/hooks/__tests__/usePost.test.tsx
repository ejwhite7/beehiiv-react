/**
 * Tests for the usePost hook.
 *
 * Validates that:
 * - It fetches a single post on mount when enabled (default)
 * - It re-fetches when the id changes
 * - Errors are handled correctly
 * - It skips the fetch when enabled is false
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { usePost } from '../usePost.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_POST = {
  id: 'post_abc123',
  publication_id: 'pub_test',
  title: 'Test Post',
  status: 'confirmed' as const,
  audience: 'all' as const,
  created_at: 1700000000,
};

describe('usePost', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a post by id on mount', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_POST }),
    });

    const { result } = renderHook(
      () => usePost({ id: 'post_abc123' }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.post).toEqual(MOCK_POST);
    expect(result.current.error).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/posts/post_abc123',
    );
  });

  it('re-fetches when the id changes', async () => {
    const secondPost = {
      ...MOCK_POST,
      id: 'post_def456',
      title: 'Second Post',
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: MOCK_POST }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: secondPost }),
      });

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => usePost({ id }),
      {
        wrapper: createWrapper(),
        initialProps: { id: 'post_abc123' },
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.post?.id).toBe('post_abc123');

    rerender({ id: 'post_def456' });

    await waitFor(() => {
      expect(result.current.post?.id).toBe('post_def456');
    });

    expect(result.current.post?.title).toBe('Second Post');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles error response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Post not found' }),
    });

    const { result } = renderHook(
      () => usePost({ id: 'post_missing' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Post not found');
    expect(result.current.post).toBeNull();
  });

  it('skips fetch when enabled is false', () => {
    const { result } = renderHook(
      () => usePost({ id: 'post_abc123', enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.post).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
