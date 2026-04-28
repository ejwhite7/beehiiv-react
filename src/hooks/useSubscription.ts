/**
 * Hook for fetching subscription data by email or ID.
 *
 * Automatically fetches on mount (unless `enabled` is `false`) and
 * re-fetches when the lookup parameters change. Exposes a `refetch`
 * function for manual re-triggering.
 *
 * @module hooks/useSubscription
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SubscriptionInfo } from '../types/subscription.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options accepted by the {@link useSubscription} hook.
 *
 * Provide either `email` or `id` to look up a subscription. If both
 * are provided, `id` takes precedence.
 */
export interface UseSubscriptionOptions {
  /** The subscriber email address to look up */
  email?: string;
  /** The subscription ID (starts with "sub_") to look up */
  id?: string;
  /**
   * Whether the fetch should run automatically.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useSubscription} hook.
 */
export interface UseSubscriptionReturn {
  /** The fetched subscription record, or `null` if not yet loaded */
  subscription: SubscriptionInfo | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the subscription fetch */
  refetch: () => void;
}

/**
 * Hook for fetching a single subscription by email address or ID.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/subscription/{id}` when an `id` is provided, or
 * `{apiUrl}/subscription?email={email}` when an `email` is provided.
 *
 * @param options - Lookup parameters and fetch configuration
 * @returns Subscription data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function SubscriberProfile({ email }: { email: string }) {
 *   const { subscription, isLoading, error } = useSubscription({ email });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!subscription) return <p>No subscription found.</p>;
 *
 *   return <p>Status: {subscription.status}</p>;
 * }
 * ```
 */
export function useSubscription(
  options: UseSubscriptionOptions,
): UseSubscriptionReturn {
  const { apiUrl } = useBeehiiv();
  const { email, id, enabled = true } = options;

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current fetch so we can skip stale responses
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL from the provided options.
   */
  const buildUrl = useCallback((): string | null => {
    if (id) {
      return `${apiUrl}/subscription/${encodeURIComponent(id)}`;
    }
    if (email) {
      return `${apiUrl}/subscription?email=${encodeURIComponent(email)}`;
    }
    return null;
  }, [apiUrl, id, email]);

  /**
   * Execute the fetch request.
   */
  const fetchSubscription = useCallback(async () => {
    const url = buildUrl();
    if (!url) return;

    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch subscription (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: SubscriptionInfo };

      // Only update state if this is still the latest request
      if (currentFetchId === fetchIdRef.current) {
        setSubscription(result.data);
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
    if (enabled && (id || email)) {
      void fetchSubscription();
    }
  }, [enabled, id, email, fetchSubscription]);

  /**
   * Manually re-trigger the subscription fetch.
   */
  const refetch = useCallback(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, isLoading, error, refetch };
}
