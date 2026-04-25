/**
 * Hook for fetching subscription data by email or ID.
 * @module hooks/useSubscription
 */

import type { SubscriptionInfo } from '../types/subscription.js';

/** Return value of the useSubscription hook */
export interface UseSubscriptionReturn {
  /** The subscription data, if loaded */
  subscription: SubscriptionInfo | null;
  /** Whether the subscription data is loading */
  isLoading: boolean;
  /** Error from the last fetch attempt, if any */
  error: Error | null;
  /** Refetch the subscription data */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a subscription by email or ID.
 *
 * @param emailOrId - The email address or subscription ID to look up
 * @returns Subscription data and loading state
 */
export function useSubscription(_emailOrId: string): UseSubscriptionReturn {
  // TODO: Implement with React state management in Stage 2
  void _emailOrId;
  throw new Error('Not yet implemented');
}
