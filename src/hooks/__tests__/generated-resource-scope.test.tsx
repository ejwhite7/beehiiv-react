import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useAuthor } from '../useAuthor.js';
import { useAuthors } from '../useAuthors.js';
import { useTier } from '../useTier.js';
import { useTiers } from '../useTiers.js';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BeehiivProvider apiUrl="/api/beehiiv" publicationId="pub_server">
      {children}
    </BeehiivProvider>
  );
}

describe('generated author and tier hook scope', () => {
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
      () => useAuthors({ publicationId: 'pub_attacker', limit: 5 }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/authors?limit=5&page=1',
    );
  });

  it('keeps author detail server-scoped', async () => {
    renderHook(
      () => useAuthor({ id: 'author_1', publicationId: 'pub_attacker' }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/authors/author_1');
  });

  it('keeps tier lists server-scoped', async () => {
    renderHook(
      () =>
        useTiers({
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
      () => useTier({ id: 'tier_1', publicationId: 'pub_attacker' }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/beehiiv/tiers/tier_1');
  });
});
