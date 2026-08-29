/**
 * Hook for fetching a single tier by its ID from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * re-fetches when the `id` parameter changes. Exposes a `refetch`
 * function for manual re-triggering.
 *
 * @module hooks/useTier
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Tier } from '../types/tier.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useTier} hook.
 */
export interface UseTierOptions {
  /** The tier ID to fetch (starts with "tier_") */
  id: string;
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
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
 * Return value of the {@link useTier} hook.
 */
export interface UseTierReturn {
  /** The fetched tier record, or `null` if not yet loaded */
  tier: Tier | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the tier fetch */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a single tier by its ID.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/tiers/{id}` with an optional `publicationId`
 * query parameter.
 *
 * @param options - Lookup parameters and fetch configuration
 * @returns Tier data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function TierDetail({ tierId }: { tierId: string }) {
 *   const { tier, isLoading, error } = useTier({ id: tierId });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!tier) return <p>Tier not found.</p>;
 *
 *   return <h1>{tier.name}</h1>;
 * }
 * ```
 */
export function useTier(options: UseTierOptions): UseTierReturn {
  const { apiUrl } = useBeehiiv();
  const { id, publicationId, enabled = true } = options;

  const [tier, setTier] = useState<Tier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL for a single tier.
   *
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback((): string => {
    const params = new URLSearchParams();
    if (publicationId) {
      params.set('publicationId', publicationId);
    }
    const query = params.toString();
    return `${apiUrl}/tiers/${encodeURIComponent(id)}${query ? `?${query}` : ''}`;
  }, [apiUrl, id, publicationId]);

  /**
   * Execute the fetch request for the tier.
   */
  const fetchTier = useCallback(async () => {
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
            : `Failed to fetch tier (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: Tier };

      if (currentFetchId === fetchIdRef.current) {
        setTier(result.data);
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
      void fetchTier();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, id, fetchTier]);

  /**
   * Manually re-trigger the tier fetch.
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchTier();
  }, [fetchTier]);

  return { tier, isLoading, error, refetch };
}
