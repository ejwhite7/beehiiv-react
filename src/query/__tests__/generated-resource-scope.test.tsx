import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useAuthorQuery, useAuthorsQuery } from '../authors.js';
import { useTierQuery, useTiersQuery } from '../tiers.js';

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <BeehiivProvider apiUrl="/api/beehiiv" publicationId="pub_server">
        {children}
      </BeehiivProvider>
    </QueryClientProvider>
  );
}

describe('generated author and tier Query scope', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps author lists server-scoped', async () => {
    renderHook(
      () => useAuthorsQuery({ publicationId: 'pub_attacker', limit: 5 }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/authors?limit=5');
  });

  it('keeps author detail server-scoped', async () => {
    renderHook(
      () => useAuthorQuery('author_1', { publicationId: 'pub_attacker' }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/authors/author_1');
  });

  it('keeps tier lists server-scoped', async () => {
    renderHook(
      () =>
        useTiersQuery({
          publicationId: 'pub_attacker',
          type: 'premium',
          active: true,
          limit: 5,
        }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/tiers?type=premium&active=true&limit=5',
    );
  });

  it('keeps tier detail server-scoped', async () => {
    renderHook(
      () => useTierQuery('tier_1', { publicationId: 'pub_attacker' }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/tiers/tier_1');
  });
});
