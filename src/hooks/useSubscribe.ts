/**
 * Hook for subscribing an email address to a beehiiv publication.
 * Manages form state, validation, and API submission.
 * @module hooks/useSubscribe
 */

/** Options for the useSubscribe hook */
export interface UseSubscribeOptions {
  /** The API endpoint to POST subscription data to (default: "/api/beehiiv/subscribe") */
  endpoint?: string;
  /** Callback fired on successful subscription */
  onSuccess?: (data: unknown) => void;
  /** Callback fired on subscription error */
  onError?: (error: Error) => void;
  /** UTM source for attribution */
  utmSource?: string;
  /** UTM medium for attribution */
  utmMedium?: string;
  /** UTM campaign for attribution */
  utmCampaign?: string;
}

/** Return value of the useSubscribe hook */
export interface UseSubscribeReturn {
  /** Submit a subscription request */
  subscribe: (email: string) => Promise<void>;
  /** Whether a subscription request is in progress */
  isLoading: boolean;
  /** Whether the last subscription was successful */
  isSuccess: boolean;
  /** Error from the last subscription attempt, if any */
  error: Error | null;
  /** Reset the hook state */
  reset: () => void;
}

/**
 * Hook for managing email subscription to a beehiiv publication.
 *
 * @param options - Configuration options for the subscription
 * @returns Subscription state and methods
 */
export function useSubscribe(_options?: UseSubscribeOptions): UseSubscribeReturn {
  // TODO: Implement with React state management in Stage 2
  void _options;
  throw new Error('Not yet implemented');
}
