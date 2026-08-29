/**
 * Hook for fetching a single author by their ID from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * re-fetches when the `id` parameter changes. Exposes a `refetch`
 * function for manual re-triggering.
 *
 * @module hooks/useAuthor
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Author } from '../types/author.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useAuthor} hook.
 */
export interface UseAuthorOptions {
  /** The author ID to fetch (starts with "author_") */
  id: string;

  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  /** @deprecated Configure publication scope in the server-side proxy. */
  publicationId?: string;

  /**
   * Whether the fetch should run automatically.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useAuthor} hook.
 */
export interface UseAuthorReturn {
  /** The fetched author record, or `null` if not yet loaded */
  author: Author | null;

  /** Whether a fetch is currently in progress */
  isLoading: boolean;

  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;

  /** Manually re-trigger the author fetch */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single author by their ID.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/authors/{id}` with an optional `publicationId`
 * query parameter.
 *
 * @param options - Lookup parameters and fetch configuration
 * @returns Author data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function AuthorProfile({ authorId }: { authorId: string }) {
 *   const { author, isLoading, error } = useAuthor({ id: authorId });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!author) return <p>Author not found.</p>;
 *
 *   return <h1>{author.name}</h1>;
 * }
 * ```
 */
export function useAuthor(options: UseAuthorOptions): UseAuthorReturn {
  const { apiUrl } = useBeehiiv();
  const { id, enabled = true } = options;

  const [author, setAuthor] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL for a single author.
   *
   * @returns The fully-qualified URL string targeting the author resource
   */
  const buildUrl = useCallback((): string => {
    return `${apiUrl}/authors/${encodeURIComponent(id)}`;
  }, [apiUrl, id]);

  /**
   * Execute the fetch request for the author.
   */
  const fetchAuthor = useCallback(async () => {
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
            : `Failed to fetch author (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: Author };

      if (currentFetchId === fetchIdRef.current) {
        setAuthor(result.data);
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
      void fetchAuthor();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, id, fetchAuthor]);

  /**
   * Manually re-trigger the author fetch.
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchAuthor();
  }, [fetchAuthor]);

  return { author, isLoading, error, refetch };
}
