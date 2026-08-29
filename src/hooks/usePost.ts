/**
 * Hook for fetching a single post by its ID from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * re-fetches when the `id` parameter changes. Exposes a `refetch`
 * function for manual re-triggering.
 *
 * @module hooks/usePost
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PostInfo } from '../types/post.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link usePost} hook.
 */
export interface UsePostOptions {
  /** The post ID to fetch (starts with "post_") */
  id: string;
  /**
   * @deprecated Generated routes always use their server-configured publication.
   * This value is ignored to prevent caller-controlled publication access.
   */
  publicationId?: string;
  /**
   * Whether the fetch should run automatically.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link usePost} hook.
 */
export interface UsePostReturn {
  /** The fetched post record, or `null` if not yet loaded */
  post: PostInfo | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the post fetch */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single post by its ID.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/posts/{id}` with an optional `publicationId`
 * query parameter.
 *
 * @param options - Lookup parameters and fetch configuration
 * @returns Post data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function PostDetail({ postId }: { postId: string }) {
 *   const { post, isLoading, error } = usePost({ id: postId });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!post) return <p>Post not found.</p>;
 *
 *   return <h1>{post.title}</h1>;
 * }
 * ```
 */
export function usePost(options: UsePostOptions): UsePostReturn {
  const { apiUrl } = useBeehiiv();
  const { id, enabled = true } = options;

  const [post, setPost] = useState<PostInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL for a single post.
   */
  const buildUrl = useCallback((): string => {
    return `${apiUrl}/posts/${encodeURIComponent(id)}`;
  }, [apiUrl, id]);

  /**
   * Execute the fetch request.
   */
  const fetchPost = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const url = buildUrl();
      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch post (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: PostInfo };

      if (currentFetchId === fetchIdRef.current) {
        setPost(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [buildUrl]);

  // Auto-fetch on mount and when the id changes
  useEffect(() => {
    if (enabled && id) {
      void fetchPost();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, id, fetchPost]);

  /**
   * Manually re-trigger the post fetch.
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchPost();
  }, [fetchPost]);

  return { post, isLoading, error, refetch };
}
