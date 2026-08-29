/**
 * Tests for the TanStack Query hooks.
 *
 * Each test verifies that the hook:
 * - Uses the correct query key from `beehiivKeys`
 * - Builds the expected fetch URL from the provider context
 * - Returns data through the standard `UseQueryResult` interface
 *
 * `@tanstack/react-query` is used directly (not mocked) — we mock
 * `globalThis.fetch` to control HTTP responses.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import {
  usePostsQuery,
  usePostQuery,
  useSubscribersQuery,
  useSubscriptionQuery,
  useCustomFieldsQuery,
  usePublicationsQuery,
} from '../hooks.js';
import { beehiivKeys } from '../keys.js';

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function createWrapper(apiUrl = '/api/beehiiv') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
          {children}
        </BeehiivProvider>
      </QueryClientProvider>
    );
  };
}

function createSharedWrapper(
  queryClient: QueryClient,
  publicationId: string,
) {
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_POSTS = {
  data: [
    {
      id: 'post_001',
      publication_id: 'pub_test',
      title: 'Hello world',
      status: 'confirmed' as const,
      audience: 'all' as const,
      created_at: 1700000000,
    },
  ],
  pagination: { next_cursor: null, has_more: false },
};

const MOCK_POST_DETAIL = {
  data: {
    id: 'post_001',
    publication_id: 'pub_test',
    title: 'Hello world',
    status: 'confirmed' as const,
    audience: 'all' as const,
    created_at: 1700000000,
  },
};

const MOCK_SUBSCRIBERS = {
  data: [
    {
      id: 'sub_001',
      publication_id: 'pub_test',
      email: 'a@b.com',
      status: 'active' as const,
      tier: 'free' as const,
      created_at: 1700000000,
    },
  ],
  pagination: { next_cursor: null, has_more: false },
};

const MOCK_SUBSCRIPTION = {
  data: {
    id: 'sub_001',
    publication_id: 'pub_test',
    email: 'a@b.com',
    status: 'active' as const,
    tier: 'free' as const,
    created_at: 1700000000,
  },
};

const MOCK_CUSTOM_FIELDS = {
  data: [
    { id: 'cf_1', kind: 'string' as const, display: 'Company', created: 1700000000 },
  ],
};

const MOCK_PUBLICATIONS = {
  data: [
    { id: 'pub_test', name: 'My Newsletter', created: 1700000000, timezone: 'UTC' },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePostsQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches posts and returns data', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_POSTS,
    });

    const { result } = renderHook(() => usePostsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].id).toBe('post_001');
  });

  it('passes filter params as query string', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_POSTS,
    });

    renderHook(
      () => usePostsQuery({ status: 'confirmed', audience: 'premium', limit: 5 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/api/beehiiv/posts');
    expect(url).toContain('status=confirmed');
    expect(url).toContain('audience=premium');
    expect(url).toContain('limit=5');
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => usePostsQuery({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Wait a tick to ensure no fetch happened
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.fetchStatus).toBe('idle');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('usePostQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a single post by ID', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_POST_DETAIL,
    });

    const { result } = renderHook(() => usePostQuery('post_001'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.id).toBe('post_001');

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('/api/beehiiv/posts/post_001');
  });

  it('does not reuse cached post data across provider publications', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { ...MOCK_POST_DETAIL.data, publication_id: 'pub_a' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { ...MOCK_POST_DETAIL.data, publication_id: 'pub_b' },
        }),
      });

    const first = renderHook(() => usePostQuery('post_001'), {
      wrapper: createSharedWrapper(queryClient, 'pub_a'),
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(first.result.current.data?.data.publication_id).toBe('pub_a');
    first.unmount();

    const second = renderHook(() => usePostQuery('post_001'), {
      wrapper: createSharedWrapper(queryClient, 'pub_b'),
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(second.result.current.data?.data.publication_id).toBe('pub_b');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(
      queryClient.getQueryData(
        beehiivKeys.posts.detail('post_001', { publicationId: 'pub_a' }),
      ),
    ).toMatchObject({ data: { publication_id: 'pub_a' } });
    expect(
      queryClient.getQueryData(
        beehiivKeys.posts.detail('post_001', { publicationId: 'pub_b' }),
      ),
    ).toMatchObject({ data: { publication_id: 'pub_b' } });
  });
});

describe('useSubscribersQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches subscribers', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SUBSCRIBERS,
    });

    const { result } = renderHook(() => useSubscribersQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].email).toBe('a@b.com');

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('/api/beehiiv/subscribers');
  });
});

describe('useSubscriptionQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches by email (query param)', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SUBSCRIPTION,
    });

    const { result } = renderHook(
      () => useSubscriptionQuery('a@b.com'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/api/beehiiv/subscription?email=');
  });

  it('fetches by ID (path param)', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SUBSCRIPTION,
    });

    const { result } = renderHook(
      () => useSubscriptionQuery('sub_001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('/api/beehiiv/subscription/sub_001');
  });
});

describe('useCustomFieldsQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches custom fields', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_CUSTOM_FIELDS,
    });

    const { result } = renderHook(() => useCustomFieldsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].display).toBe('Company');

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('/api/beehiiv/custom-fields');
  });
});

describe('usePublicationsQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches publications', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_PUBLICATIONS,
    });

    const { result } = renderHook(() => usePublicationsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].name).toBe('My Newsletter');

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('/api/beehiiv/publications');
  });
});
