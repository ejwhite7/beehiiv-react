/**
 * TanStack Query hooks for beehiiv Author resources.
 *
 * Each hook wraps a standard `fetch()` call inside `useQuery` from
 * `@tanstack/react-query`, using the key factory from `./keys.ts`
 * for cache keys. Context values (`apiUrl`, `publicationId`) are read
 * from the nearest `<BeehiivProvider>` via the exported context object,
 * keeping this module free of imports from `src/hooks/`.
 *
 * @module query/authors
 */

import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type { Author } from '../types/author.js';
import { beehiivKeys } from './keys.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read the beehiiv context, throwing if the provider is missing.
 *
 * This mirrors the behaviour of `useBeehiiv()` in `src/hooks/` without
 * importing from that module — avoids potential circular dependencies.
 *
 * @returns The current {@link BeehiivContextValue}
 * @throws {Error} If called outside a `<BeehiivProvider>`
 */
function useBeehiivContext(): BeehiivContextValue {
  const context = useContext(BeehiivContext);

  if (context === null) {
    throw new Error(
      'beehiiv-react/query hooks must be used within a <BeehiivProvider>. ' +
        'Wrap your component tree with <BeehiivProvider publicationId="...">.',
    );
  }

  return context;
}

/**
 * Execute a GET request and return parsed JSON, or throw on failure.
 *
 * @param url - Fully-qualified URL to fetch
 * @returns The parsed JSON body
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const message =
      typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Authors list
// ---------------------------------------------------------------------------

/**
 * Filter / pagination options for {@link useAuthorsQuery}.
 */
export interface UseAuthorsQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;

  /** Maximum number of results to return per page */
  limit?: number;

  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;

  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/**
 * Response shape returned by the authors list endpoint.
 */
interface AuthorsListResponse {
  /** Array of author records for the current page */
  data: Author[];

  /** Page-based pagination metadata */
  pagination: {
    page: number;
    limit: number;
    total_results: number;
    total_pages: number;
  };
}

/**
 * Fetch a paginated list of authors via TanStack Query.
 *
 * Uses the `{apiUrl}/authors` endpoint exposed by the beehiiv API proxy
 * and caches results under {@link beehiivKeys.authors.list}.
 *
 * @param options - Optional filter, pagination, and query configuration
 * @returns A standard `UseQueryResult` containing the authors list response
 *
 * @example
 * ```tsx
 * function AuthorDirectory() {
 *   const { data, isLoading } = useAuthorsQuery({ limit: 20 });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(a => <li key={a.id}>{a.name}</li>)}</ul>;
 * }
 * ```
 */
export function useAuthorsQuery(
  options: UseAuthorsQueryOptions = {},
): UseQueryResult<AuthorsListResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const {
    publicationId,
    limit,
    staleTime = 60_000,
    enabled = true,
  } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  const keyOptions = {
    publicationId: resolvedPublicationId,
    ...(limit !== undefined ? { limit } : {}),
  };

  return useQuery<AuthorsListResponse>({
    queryKey: beehiivKeys.authors.list(keyOptions),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      if (limit !== undefined) params.set('limit', String(limit));
      const query = params.toString();
      return fetchJson<AuthorsListResponse>(
        `${apiUrl}/authors${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Single author
// ---------------------------------------------------------------------------

/**
 * Options for {@link useAuthorQuery}.
 */
export interface UseAuthorQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;

  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;

  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/**
 * Response shape returned by the single-author endpoint.
 */
interface AuthorDetailResponse {
  /** The author record */
  data: Author;
}

/**
 * Fetch a single author by their ID via TanStack Query.
 *
 * Uses the `{apiUrl}/authors/{id}` endpoint and caches results under
 * {@link beehiivKeys.authors.detail}.
 *
 * @param id - The author identifier (starts with "author_")
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the single-author response
 *
 * @example
 * ```tsx
 * function AuthorProfile({ authorId }: { authorId: string }) {
 *   const { data, isLoading } = useAuthorQuery(authorId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <h1>{data?.data.name}</h1>;
 * }
 * ```
 */
export function useAuthorQuery(
  id: string,
  options: UseAuthorQueryOptions = {},
): UseQueryResult<AuthorDetailResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  return useQuery<AuthorDetailResponse>({
    queryKey: beehiivKeys.authors.detail(id, {
      publicationId: resolvedPublicationId,
    }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<AuthorDetailResponse>(
        `${apiUrl}/authors/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!id,
  });
}
