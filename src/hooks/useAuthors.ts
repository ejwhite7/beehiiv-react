/**
 * Hook for fetching a paginated list of authors from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * supports page-based pagination via the `loadMore` callback.
 * Exposes a `refetch` function for manual re-triggering that resets
 * the list to the first page.
 *
 * The beehiiv Authors API uses page-based (offset) pagination with a
 * 1-indexed `page` query parameter — not cursor-based pagination.
 *
 * @module hooks/useAuthors
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Author } from '../types/author.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useAuthors} hook.
 */
export interface UseAuthorsOptions {
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  /** @deprecated Configure publication scope in the server-side proxy. */
  publicationId?: string;

  /** Maximum number of results to return per page */
  limit?: number;

  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useAuthors} hook.
 */
export interface UseAuthorsReturn {
  /** The accumulated list of fetched authors */
  authors: Author[];

  /** Whether a fetch is currently in progress */
  isLoading: boolean;

  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;

  /** Whether there are more pages available to load */
  hasMore: boolean;

  /** Load the next page of results, appending to the existing list */
  loadMore: () => Promise<void>;

  /** Re-fetch from the first page, replacing the current list */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a paginated list of authors from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/authors` with optional query parameters for
 * page-based pagination.
 *
 * @param options - Pagination and fetch configuration
 * @returns Author list data, loading state, error, pagination controls
 *
 * @example
 * ```tsx
 * function AuthorList() {
 *   const { authors, isLoading, error, hasMore, loadMore } = useAuthors({
 *     limit: 10,
 *   });
 *
 *   if (isLoading && authors.length === 0) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <>
 *       <ul>
 *         {authors.map((a) => <li key={a.id}>{a.name}</li>)}
 *       </ul>
 *       {hasMore && <button onClick={loadMore}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useAuthors(options: UseAuthorsOptions = {}): UseAuthorsReturn {
  const { apiUrl } = useBeehiiv();
  const { limit, enabled = true } = options;

  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  /** Current page number (1-indexed, matching the beehiiv API) */
  const pageRef = useRef<number>(1);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL with query parameters.
   *
   * @param page - The 1-indexed page number to fetch
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback(
    (page: number): string => {
      const params = new URLSearchParams();
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }
      params.set('page', String(page));
      const query = params.toString();
      return `${apiUrl}/authors${query ? `?${query}` : ''}`;
    },
    [apiUrl, limit],
  );

  /**
   * Execute the fetch for a given page number.
   *
   * @param page - The 1-indexed page to fetch
   * @param append - Whether to append results to the existing list or replace it
   */
  const fetchAuthors = useCallback(
    async (page: number, append: boolean) => {
      const currentFetchId = ++fetchIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const url = buildUrl(page);
        const response = await fetch(url);

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          const message =
            typeof body.message === 'string'
              ? body.message
              : `Failed to fetch authors (status ${response.status})`;
          throw new Error(message);
        }

        const result = (await response.json()) as {
          data?: Author[];
          pagination?: {
            page: number;
            limit: number;
            total_results: number;
            total_pages: number;
          };
        };

        if (currentFetchId === fetchIdRef.current) {
          const data = result.data ?? [];
          setAuthors((prev) => (append ? [...prev, ...data] : data));
          pageRef.current = page;

          // Determine if there are more pages based on offset pagination
          const totalPages = result.pagination?.total_pages ?? 0;
          const morePages = page < totalPages;
          setHasMore(morePages);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (currentFetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    },
    [buildUrl],
  );

  // Auto-fetch the first page on mount and when filter deps change
  useEffect(() => {
    if (enabled) {
      pageRef.current = 1;
      void fetchAuthors(1, false);
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchAuthors]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await fetchAuthors(pageRef.current + 1, true);
  }, [hasMore, isLoading, fetchAuthors]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback(async (): Promise<void> => {
    pageRef.current = 1;
    await fetchAuthors(1, false);
  }, [fetchAuthors]);

  return { authors, isLoading, error, hasMore, loadMore, refetch };
}
