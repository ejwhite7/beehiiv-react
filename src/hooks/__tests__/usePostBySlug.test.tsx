import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { usePostBySlug } from '../usePostBySlug.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_server">
        {children}
      </BeehiivProvider>
    );
  };
}

const MOCK_POST = {
  id: 'post_slug',
  publication_id: 'pub_server',
  title: 'Slug post',
  status: 'confirmed' as const,
  audience: 'all' as const,
  created_at: 1700000000,
};

describe('usePostBySlug', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a post through the provider-scoped slug route', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_POST }),
    });

    const { result } = renderHook(
      () => usePostBySlug({ slug: 'welcome post' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.post).toEqual(MOCK_POST);
    expect(result.current.notFound).toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/posts?slug=welcome+post',
    );
  });

  it('does not forward a caller-controlled publication override', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: MOCK_POST }),
    });

    renderHook(
      () =>
        usePostBySlug({
          slug: 'welcome',
          publicationId: 'pub_attacker',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/posts?slug=welcome',
    );
  });
});
