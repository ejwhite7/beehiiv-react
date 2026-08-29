/**
 * Hook for fetching referral program data from a beehiiv publication.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * exposes a `refetch` function for manual re-triggering.
 *
 * @module hooks/useReferrals
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReferralProgram } from '../types/referral.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useReferrals} hook.
 */
export interface UseReferralsOptions {
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  publicationId?: string;
  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useReferrals} hook.
 */
export interface UseReferralsReturn {
  /** The fetched referral program, or `null` while loading */
  referralProgram: ReferralProgram | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the fetch */
  refetch: () => void;
}

/**
 * Hook for fetching the referral program from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/referral-program` to retrieve the publication's
 * referral program configuration including milestones.
 *
 * @param options - Optional query configuration
 * @returns Referral program data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function ReferralProgramInfo() {
 *   const { referralProgram, isLoading, error } = useReferrals();
 *
 *   if (isLoading) return <p>Loading referral program...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!referralProgram) return <p>No referral program configured</p>;
 *
 *   return (
 *     <div>
 *       <p>Program ID: {referralProgram.id}</p>
 *       <p>Enabled: {referralProgram.enabled ? 'Yes' : 'No'}</p>
 *       <p>Milestones: {referralProgram.milestones.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useReferrals(
  options: UseReferralsOptions = {},
): UseReferralsReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, enabled = true } = options;

  const [referralProgram, setReferralProgram] = useState<ReferralProgram | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Execute the fetch request for the referral program.
   */
  const fetchReferralProgram = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      const query = params.toString();
      const url = `${apiUrl}/referral-program${query ? `?${query}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch referral program (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: ReferralProgram };

      if (currentFetchId === fetchIdRef.current) {
        setReferralProgram(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [apiUrl, publicationId]);

  // Auto-fetch on mount when enabled
  useEffect(() => {
    if (enabled) {
      void fetchReferralProgram();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchReferralProgram]);

  /**
   * Manually re-trigger the referral program fetch.
   */
  const refetch = useCallback(() => {
    void fetchReferralProgram();
  }, [fetchReferralProgram]);

  return { referralProgram, isLoading, error, refetch };
}
