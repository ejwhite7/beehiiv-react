/**
 * Hook for fetching engagement metrics from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * exposes a `refetch` function for manual re-triggering.
 *
 * @module hooks/useEngagements
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { EngagementMetrics } from '../types/engagement.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useEngagements} hook.
 */
export interface UseEngagementsOptions {
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  publicationId?: string;
  /** Start date for the engagement data range (ISO 8601 date string, e.g. "2024-01-01") */
  start_date: string;
  /** End date for the engagement data range (ISO 8601 date string, e.g. "2024-01-31") */
  end_date: string;
  /** Optional fields to expand in the response */
  expand?: string[];
  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useEngagements} hook.
 */
export interface UseEngagementsReturn {
  /** Array of daily engagement metric records */
  engagements: EngagementMetrics[];
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Re-fetch the engagement data, replacing the current results */
  refetch: () => void;
}

/**
 * Hook for fetching engagement metrics from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/engagements` with required `start_date` and
 * `end_date` query parameters.
 *
 * @param options - Date range, filtering, and fetch configuration
 * @returns Engagement data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function EngagementDashboard() {
 *   const { engagements, isLoading, error } = useEngagements({
 *     start_date: '2024-01-01',
 *     end_date: '2024-01-31',
 *   });
 *
 *   if (isLoading) return <p>Loading engagement data...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {engagements.map((e) => (
 *         <li key={e.date}>
 *           {e.date}: {e.opens} opens, {e.clicks} clicks
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useEngagements(options: UseEngagementsOptions): UseEngagementsReturn {
  const { apiUrl } = useBeehiiv();
  const {
    publicationId,
    start_date,
    end_date,
    expand,
    enabled = true,
  } = options;

  const [engagements, setEngagements] = useState<EngagementMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Serialised expand key for stable dependency tracking.
   * Arrays are compared by reference in dependency arrays, so we
   * serialise to avoid infinite re-render loops when callers pass
   * a new array literal on each render.
   */
  const expandKey = expand ? expand.join(',') : '';

  /**
   * Build the endpoint URL with query parameters.
   *
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback((): string => {
    const params = new URLSearchParams();
    if (publicationId) {
      params.set('publicationId', publicationId);
    }
    params.set('start_date', start_date);
    params.set('end_date', end_date);
    if (expand) {
      for (const field of expand) {
        params.append('expand[]', field);
      }
    }
    const query = params.toString();
    return `${apiUrl}/engagements${query ? `?${query}` : ''}`;
  }, [apiUrl, publicationId, start_date, end_date, expandKey]);

  /**
   * Execute the fetch request for engagement metrics.
   */
  const fetchEngagements = useCallback(async () => {
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
            : `Failed to fetch engagements (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: EngagementMetrics[] };

      if (currentFetchId === fetchIdRef.current) {
        setEngagements(result.data ?? []);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [buildUrl]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      void fetchEngagements();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchEngagements]);

  /**
   * Manually re-trigger the engagement data fetch.
   */
  const refetch = useCallback(() => {
    void fetchEngagements();
  }, [fetchEngagements]);

  return { engagements, isLoading, error, refetch };
}
