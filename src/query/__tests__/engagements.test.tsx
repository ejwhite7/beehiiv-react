import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useEngagementsQuery } from '../engagements.js';

function createWrapper(publicationId = 'pub_server') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BeehiivProvider
          apiUrl="/api/beehiiv"
          publicationId={publicationId}
        >
          {children}
        </BeehiivProvider>
      </QueryClientProvider>
    );
  };
}

describe('useEngagementsQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards the supported expansion through the provider-scoped route', async () => {
    renderHook(
      () =>
        useEngagementsQuery({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          expand: ['stats'],
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/engagements?start_date=2024-01-01&end_date=2024-01-31&expand%5B%5D=stats',
    );
  });

  it('does not forward or cache under a caller-controlled publication override', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <BeehiivProvider apiUrl="/api/beehiiv" publicationId="pub_server">
            {children}
          </BeehiivProvider>
        </QueryClientProvider>
      );
    }

    renderHook(
      () =>
        useEngagementsQuery({
          publicationId: 'pub_attacker',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/beehiiv/engagements?start_date=2024-01-01&end_date=2024-01-31',
    );
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .some((query) => JSON.stringify(query.queryKey).includes('pub_attacker')),
    ).toBe(false);
  });
});
