"use client";

/**
 * Hook for fetching a paginated list of subscribers from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * supports cursor-based pagination via the `fetchMore` callback.
 * Exposes a `refetch` function for manual re-triggering that resets
 * the list to the first page.
 *
 * @module hooks/useSubscribers
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  SubscriptionInfo,
  SubscriptionStatus,
  SubscriptionTier,
} from '../types/subscription.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useSubscribers} hook.
 */
export interface UseSubscribersOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Filter subscribers by their subscription status */
  status?: SubscriptionStatus;
  /** Filter subscribers by their subscription tier */
  tier?: SubscriptionTier;
  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useSubscribers} hook.
 */
export interface UseSubscribersReturn {
  /** The accumulated list of fetched subscribers */
  subscribers: SubscriptionInfo[];
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Load the next page of results, appending to the existing list */
  fetchMore: () => void;
  /** Whether there are more pages available to load */
  hasMore: boolean;
  /** Re-fetch from the first page, replacing the current list */
  refetch: () => void;
}

/**
 * Hook for fetching a paginated list of subscribers from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/subscribers` with optional query parameters for
 * filtering and pagination.
 *
 * @param options - Filtering, pagination, and fetch configuration
 * @returns Subscriber list data, loading state, error, pagination controls
 *
 * @example
 * ```tsx
 * function SubscriberList() {
 *   const { subscribers, isLoading, error, hasMore, fetchMore } = useSubscribers({
 *     status: 'active',
 *     tier: 'premium',
 *     limit: 10,
 *   });
 *
 *   if (isLoading && subscribers.length === 0) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <>
 *       <ul>
 *         {subscribers.map((s) => <li key={s.id}>{s.email}</li>)}
 *       </ul>
 *       {hasMore && <button onClick={fetchMore}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useSubscribers(
  options: UseSubscribersOptions = {},
): UseSubscribersReturn {
  const { apiUrl } = useBeehiiv();
  const { status, tier, limit, enabled = true } = options;

  const [subscribers, setSubscribers] = useState<SubscriptionInfo[]>([]);
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
      if (status) {
        params.set('status', status);
      }
      if (tier) {
        params.set('tier', tier);
      }
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }
      if (cursor) {
        params.set('cursor', cursor);
      }
      const query = params.toString();
      return `${apiUrl}/subscribers${query ? `?${query}` : ''}`;
    },
    [apiUrl, status, tier, limit],
  );

  /**
   * Execute the fetch, optionally appending to the existing list.
   *
   * @param cursor - Cursor for the page to fetch (`null` for first page)
   * @param append - Whether to append results or replace
   */
  const fetchSubscribers = useCallback(
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
              : `Failed to fetch subscribers (status ${response.status})`;
          throw new Error(message);
        }

        const result = (await response.json()) as {
          data: SubscriptionInfo[];
          pagination: { next_cursor: string | null; has_more: boolean };
        };

        if (currentFetchId === fetchIdRef.current) {
          setSubscribers((prev) =>
            append ? [...prev, ...result.data] : result.data,
          );
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
      void fetchSubscribers(null, false);
    }
  }, [enabled, fetchSubscribers]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const fetchMore = useCallback((): void => {
    if (!hasMore || isLoading) return;
    void fetchSubscribers(cursorRef.current, true);
  }, [hasMore, isLoading, fetchSubscribers]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback((): void => {
    cursorRef.current = null;
    void fetchSubscribers(null, false);
  }, [fetchSubscribers]);

  return { subscribers, isLoading, error, fetchMore, hasMore, refetch };
}
