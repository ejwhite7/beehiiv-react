/**
 * Hook for fetching a paginated list of tiers from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * supports cursor-based pagination via the `loadMore` callback.
 * Exposes a `refetch` function for manual re-triggering that resets
 * the list to the first page.
 *
 * The beehiiv Tiers API uses cursor-based pagination with a `cursor`
 * query parameter for page advancement.
 *
 * @module hooks/useTiers
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Tier, TierType } from '../types/tier.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useTiers} hook.
 */
export interface UseTiersOptions {
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  publicationId?: string;
  /** Filter tiers by type (free or premium) */
  type?: TierType;
  /** Filter tiers by active status */
  active?: boolean;
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
 * Return value of the {@link useTiers} hook.
 */
export interface UseTiersReturn {
  /** The accumulated list of fetched tiers */
  tiers: Tier[];
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
 * Hook for fetching a paginated list of tiers from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/tiers` with optional query parameters for
 * filtering and cursor-based pagination.
 *
 * @param options - Filtering, pagination, and fetch configuration
 * @returns Tier list data, loading state, error, pagination controls
 *
 * @example
 * ```tsx
 * function TierList() {
 *   const { tiers, isLoading, error, hasMore, loadMore } = useTiers({
 *     type: 'premium',
 *     limit: 10,
 *   });
 *
 *   if (isLoading && tiers.length === 0) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <>
 *       <ul>
 *         {tiers.map((t) => <li key={t.id}>{t.name}</li>)}
 *       </ul>
 *       {hasMore && <button onClick={loadMore}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useTiers(options: UseTiersOptions = {}): UseTiersReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, type, active, limit, enabled = true } = options;

  /**
   * Serialised filter key for stable dependency tracking.
   * Prevents infinite re-render loops when callers pass new object
   * literals on each render.
   */
  const filterKey = useMemo(
    () => JSON.stringify({ type, active, limit }),
    [type, active, limit],
  );

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  /** Current cursor for the next page (null means first page) */
  const cursorRef = useRef<string | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL with query parameters.
   *
   * @param cursor - The cursor for fetching the next page, or null for the first page
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback(
    (cursor: string | null): string => {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      if (type) {
        params.set('type', type);
      }
      if (active !== undefined) {
        params.set('active', String(active));
      }
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }
      if (cursor) {
        params.set('cursor', cursor);
      }
      const query = params.toString();
      return `${apiUrl}/tiers${query ? `?${query}` : ''}`;
    },
    [apiUrl, publicationId, filterKey],
  );

  /**
   * Execute the fetch for a given cursor position.
   *
   * @param cursor - The cursor to fetch from (null for first page)
   * @param append - Whether to append results or replace the entire list
   */
  const fetchTiers = useCallback(
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
              : `Failed to fetch tiers (status ${response.status})`;
          throw new Error(message);
        }

        const result = (await response.json()) as {
          data?: Tier[];
          pagination?: {
            next_cursor: string | null;
            has_more: boolean;
            total_results: number;
          };
        };

        if (currentFetchId === fetchIdRef.current) {
          const data = result.data ?? [];
          setTiers((prev) => (append ? [...prev, ...data] : data));
          cursorRef.current = result.pagination?.next_cursor ?? null;
          setHasMore(result.pagination?.has_more ?? false);
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
      void fetchTiers(null, false);
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchTiers]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await fetchTiers(cursorRef.current, true);
  }, [hasMore, isLoading, fetchTiers]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback(async (): Promise<void> => {
    cursorRef.current = null;
    await fetchTiers(null, false);
  }, [fetchTiers]);

  return { tiers, isLoading, error, hasMore, loadMore, refetch };
}
