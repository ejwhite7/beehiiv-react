/**
 * Hook for fetching publications from the beehiiv API.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * exposes a `refetch` function for manual re-triggering.
 *
 * @module hooks/usePublications
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  PublicationInfo,
  PublicationsRequestExpand,
} from '../types/publication.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link usePublications} hook.
 */
export interface UsePublicationsOptions {
  /**
   * Expand additional fields on each publication.
   * Pass `'stats'` to include aggregate statistics.
   */
  expand?: PublicationsRequestExpand;
  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link usePublications} hook.
 */
export interface UsePublicationsReturn {
  /** Array of publications returned by the API */
  publications: PublicationInfo[];
  /** Whether the publications are currently being fetched */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the publications fetch */
  refetch: () => void;
}

/**
 * Hook for fetching publications from the beehiiv API.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`, then sends a
 * GET request to `{apiUrl}/publications` with optional query parameters.
 *
 * @param options - Expansion and fetch configuration
 * @returns Publication data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function PublicationList() {
 *   const { publications, isLoading, error } = usePublications({
 *     expand: 'stats',
 *   });
 *
 *   if (isLoading) return <p>Loading publications...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {publications.map((p) => (
 *         <li key={p.id}>{p.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePublications(
  options: UsePublicationsOptions = {},
): UsePublicationsReturn {
  const { apiUrl } = useBeehiiv();
  const { expand, enabled = true } = options;

  const [publications, setPublications] = useState<PublicationInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL with query parameters.
   *
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback((): string => {
    const params = new URLSearchParams();
    if (expand) {
      params.set('expand', expand);
    }
    const query = params.toString();
    return `${apiUrl}/publications${query ? `?${query}` : ''}`;
  }, [apiUrl, expand]);

  /**
   * Execute the fetch request for publications.
   */
  const fetchPublications = useCallback(async () => {
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
            : `Failed to fetch publications (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: PublicationInfo[] };

      if (currentFetchId === fetchIdRef.current) {
        setPublications(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [buildUrl]);

  // Auto-fetch on mount when enabled
  useEffect(() => {
    if (enabled) {
      void fetchPublications();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchPublications]);

  /**
   * Manually re-trigger the publications fetch.
   */
  const refetch = useCallback(() => {
    void fetchPublications();
  }, [fetchPublications]);

  return { publications, isLoading, error, refetch };
}
