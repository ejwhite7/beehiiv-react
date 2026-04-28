/**
 * Hook for fetching a paginated list of posts from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * supports cursor-based pagination via the `loadMore` callback.
 * Exposes a `refetch` function for manual re-triggering that resets
 * the list to the first page.
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
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  publicationId?: string;
  /** Filter posts by their publication status */
  status?: PostStatus;
  /** Filter posts by their intended audience */
  audience?: PostAudience;
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
 * filtering and pagination.
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
  const { publicationId, status, audience, limit, enabled = true } = options;

  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  /** Cursor for the next page of results */
  const cursorRef = useRef<string | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL with query parameters.
   *
   * @param cursor - Optional cursor token for pagination
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback(
    (cursor?: string | null): string => {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      if (status) {
        params.set('status', status);
      }
      if (audience) {
        params.set('audience', audience);
      }
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }
      if (cursor) {
        params.set('cursor', cursor);
      }
      const query = params.toString();
      return `${apiUrl}/posts${query ? `?${query}` : ''}`;
    },
    [apiUrl, publicationId, status, audience, limit],
  );

  /**
   * Execute the fetch, optionally appending to the existing list.
   *
   * @param cursor - Cursor for the page to fetch (`null` for first page)
   * @param append - Whether to append results or replace
   */
  const fetchPosts = useCallback(
    async (cursor: string | null, append: boolean) => {
      const currentFetchId = ++fetchIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const url = buildUrl(cursor);
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
          data: PostInfo[];
          pagination: { next_cursor: string | null; has_more: boolean };
        };

        if (currentFetchId === fetchIdRef.current) {
          setPosts((prev) => (append ? [...prev, ...result.data] : result.data));
          cursorRef.current = result.pagination.next_cursor;
          setHasMore(result.pagination.has_more);
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
      cursorRef.current = null;
      void fetchPosts(null, false);
    }
  }, [enabled, fetchPosts]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await fetchPosts(cursorRef.current, true);
  }, [hasMore, isLoading, fetchPosts]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback(async (): Promise<void> => {
    cursorRef.current = null;
    await fetchPosts(null, false);
  }, [fetchPosts]);

  return { posts, isLoading, error, hasMore, loadMore, refetch };
}
