/**
 * Hook for fetching a paginated list of posts from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * supports page-based pagination via the `loadMore` callback.
 * Exposes a `refetch` function for manual re-triggering that resets
 * the list to the first page.
 *
 * The beehiiv Posts API uses page-based (offset) pagination with a
 * 1-indexed `page` query parameter — not cursor-based pagination.
 *
 * @module hooks/usePosts
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PostInfo, PostAudience, PostStatus } from '../types/post.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link usePosts} hook.
 */
export interface UsePostsOptions {
  /**
   * Retained for source compatibility; the public proxy owns publication scope.
   * @deprecated Configure the publication in the server-side proxy instead.
   */
  publicationId?: string;
  /** @deprecated The public proxy always returns confirmed posts. */
  status?: PostStatus;
  /** @deprecated The public proxy always enforces its public audience policy. */
  audience?: PostAudience;
  /** Maximum number of results to return per page */
  limit?: number;
  /**
   * Retained for source compatibility; expansions are forbidden on the public
   * list proxy. Fetch authorized post detail through a protected route.
   * @deprecated Use an authenticated detail route for expanded content.
   */
  expand?: string[];
  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link usePosts} hook.
 */
export interface UsePostsReturn {
  /** The accumulated list of fetched posts */
  posts: PostInfo[];
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
 * Hook for fetching a paginated list of posts from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/posts` with optional query parameters for
 * filtering and page-based pagination.
 *
 * @param options - Filtering, pagination, and fetch configuration
 * @returns Post list data, loading state, error, pagination controls
 *
 * @example
 * ```tsx
 * function PostList() {
 *   const { posts, isLoading, error, hasMore, loadMore } = usePosts({
 *     status: 'confirmed',
 *     audience: 'all',
 *     limit: 10,
 *   });
 *
 *   if (isLoading && posts.length === 0) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <>
 *       <ul>
 *         {posts.map((p) => <li key={p.id}>{p.title}</li>)}
 *       </ul>
 *       {hasMore && <button onClick={loadMore}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const { apiUrl } = useBeehiiv();
  const { limit, enabled = true } = options;

  const [posts, setPosts] = useState<PostInfo[]>([]);
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
      return `${apiUrl}/posts${query ? `?${query}` : ''}`;
    },
    [apiUrl, limit],
  );

  /**
   * Execute the fetch for a given page number.
   *
   * @param page - The 1-indexed page to fetch
   * @param append - Whether to append results or replace
   */
  const fetchPosts = useCallback(
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
              : `Failed to fetch posts (status ${response.status})`;
          throw new Error(message);
        }

        const result = (await response.json()) as {
          data?: PostInfo[];
          pagination?: {
            page: number;
            limit: number;
            total_results: number;
            total_pages: number;
          };
        };

        if (currentFetchId === fetchIdRef.current) {
          const data = result.data ?? [];
          setPosts((prev) => (append ? [...prev, ...data] : data));
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
      void fetchPosts(1, false);
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchPosts]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await fetchPosts(pageRef.current + 1, true);
  }, [hasMore, isLoading, fetchPosts]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback(async (): Promise<void> => {
    pageRef.current = 1;
    await fetchPosts(1, false);
  }, [fetchPosts]);

  return { posts, isLoading, error, hasMore, loadMore, refetch };
}
