/**
 * Hook for fetching a single post by URL slug from a beehiiv publication.
 *
 * Talks to the user-owned API route (default `/api/beehiiv/posts`) using
 * the `slug=` query parameter. The generated route at
 * `app/api/beehiiv/posts/route.ts` (see `templates/posts-route.ts.hbs`)
 * resolves slug \u2192 post via the `fetchPostBySlug` server helper.
 *
 * @module hooks/usePostBySlug
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PostInfo } from '../types/post.js';
import { useBeehiiv } from './useBeehiiv.js';

/** Options accepted by {@link usePostBySlug} */
export interface UsePostBySlugOptions {
  /** The post slug to look up */
  slug: string;
  /**
   * Retained for source compatibility. The generated proxy is scoped to its
   * server-configured publication and ignores caller-controlled overrides.
   * @deprecated Configure the publication in the server-side proxy instead.
   */
  publicationId?: string;
  /** Whether the fetch should run automatically. @defaultValue true */
  enabled?: boolean;
}

/** Return value of {@link usePostBySlug} */
export interface UsePostBySlugReturn {
  /** The fetched post, or `null` while loading / when not found */
  post: PostInfo | null;
  /** Whether the post lookup completed and returned no match */
  notFound: boolean;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch, or `null` */
  error: Error | null;
  /** Manually re-trigger the fetch */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single post by URL slug.
 *
 * Issues a GET to `{apiUrl}/posts?slug={slug}`. The generated posts route
 * supports an optional `slug` query param that, when present, performs a
 * slug-based lookup and returns `{ data: PostInfo | null }`.
 *
 * @example
 * ```tsx
 * function BlogPost({ slug }: { slug: string }) {
 *   const { post, isLoading, notFound } = usePostBySlug({ slug });
 *   if (isLoading) return <p>Loading\u2026</p>;
 *   if (notFound) return <p>Not found</p>;
 *   if (!post) return null;
 *   return <PostContentRenderer content={post.content} />;
 * }
 * ```
 */
export function usePostBySlug(
  options: UsePostBySlugOptions,
): UsePostBySlugReturn {
  const { apiUrl } = useBeehiiv();
  const { slug, enabled = true } = options;

  const [post, setPost] = useState<PostInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchIdRef = useRef(0);

  const buildUrl = useCallback((): string => {
    const params = new URLSearchParams();
    params.set('slug', slug);
    return `${apiUrl}/posts?${params.toString()}`;
  }, [apiUrl, slug]);

  const run = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await fetch(buildUrl());
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
      const result = (await response.json()) as { data: PostInfo | null };

      if (id === fetchIdRef.current) {
        setPost(result.data ?? null);
        setNotFound(result.data == null);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (id === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [buildUrl]);

  useEffect(() => {
    if (enabled && slug) void run();
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, slug, run]);

  const refetch = useCallback(async (): Promise<void> => {
    await run();
  }, [run]);

  return { post, notFound, isLoading, error, refetch };
}
