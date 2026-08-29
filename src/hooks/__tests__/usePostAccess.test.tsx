/** Fail-closed regressions for usePostAccess. */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { usePostAccess } from '../usePostAccess.js';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BeehiivProvider apiUrl="/api/beehiiv" publicationId="pub_test">
      {children}
    </BeehiivProvider>
  );
}

function post(id: string) {
  return {
    id,
    publication_id: 'pub_test',
    title: 'Public post',
    status: 'confirmed' as const,
    audience: 'all' as const,
    created: 1,
  };
}

function success(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data }),
  };
}

describe('usePostAccess fail-closed resolution', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('grants access only after the requested post resolves', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(success(post('post_1')) as Response);

    const { result } = renderHook(
      () => usePostAccess({ postId: 'post_1' }),
      { wrapper },
    );

    expect(result.current.canView).toBe(false);
    await waitFor(() => expect(result.current.post?.id).toBe('post_1'));
    expect(result.current.canView).toBe(true);
  });

  it('does not grant access for an empty post response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(success(null) as Response);

    const { result } = renderHook(
      () => usePostAccess({ postId: 'post_missing' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.post).toBeNull();
    expect(result.current.canView).toBe(false);
  });

  it('clears a prior grant immediately when the next post fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(success(post('post_1')) as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Post lookup failed' }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ postId }) => usePostAccess({ postId }),
      { initialProps: { postId: 'post_1' }, wrapper },
    );
    await waitFor(() => expect(result.current.canView).toBe(true));

    rerender({ postId: 'post_2' });
    expect(result.current.canView).toBe(false);
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.post).toBeNull();
    expect(result.current.canView).toBe(false);
  });

  it('revokes a prior grant when disabled or given an empty post ID', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(success(post('post_1')) as Response);

    const { result, rerender } = renderHook(
      ({ postId, enabled }) => usePostAccess({ postId, enabled }),
      { initialProps: { postId: 'post_1', enabled: true }, wrapper },
    );
    await waitFor(() => expect(result.current.canView).toBe(true));

    rerender({ postId: 'post_1', enabled: false });
    expect(result.current.canView).toBe(false);
    await waitFor(() => expect(result.current.post).toBeNull());

    rerender({ postId: '', enabled: true });
    expect(result.current.canView).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale success after a newer post has resolved', async () => {
    let resolveOld: ((value: Response) => void) | undefined;
    const oldRequest = new Promise<Response>((resolve) => {
      resolveOld = resolve;
    });
    vi.mocked(fetch)
      .mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce(success(null) as Response);

    const { result, rerender } = renderHook(
      ({ postId }) => usePostAccess({ postId }),
      { initialProps: { postId: 'post_old' }, wrapper },
    );
    rerender({ postId: 'post_new' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      resolveOld?.(success(post('post_old')) as Response);
      await oldRequest;
    });

    expect(result.current.post).toBeNull();
    expect(result.current.canView).toBe(false);
  });
});
