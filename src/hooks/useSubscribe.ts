/**
 * Hook for subscribing an email address to a beehiiv publication.
 *
 * Manages loading, success, and error states for the subscription
 * request and exposes callbacks for side-effects.
 *
 * @module hooks/useSubscribe
 */

import { useCallback, useState } from 'react';

import type { SubscriptionInfo } from '../types/subscription.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options that can be passed to {@link useSubscribe} to configure
 * callbacks triggered during the subscription lifecycle.
 *
 * @typeParam TCustomFields - Shape of custom field values sent with the request
 */
export interface UseSubscribeOptions {
  /** Callback fired after a successful subscription */
  onSuccess?: (subscription: SubscriptionInfo) => void;
  /** Callback fired when the subscription request fails */
  onError?: (error: Error) => void;
}

/**
 * Data accepted by the `subscribe` function returned from {@link useSubscribe}.
 *
 * @typeParam TCustomFields - Shape of custom field values sent with the request
 */
export interface SubscribeData<TCustomFields = Record<string, unknown>> {
  /** The email address to subscribe */
  email: string;
  /** Optional custom field values to attach to the subscriber */
  customFields?: TCustomFields;
  /** Whether to reactivate an existing inactive subscription */
  reactivate?: boolean;
  /** UTM source for attribution tracking */
  utmSource?: string;
  /** UTM medium for attribution tracking */
  utmMedium?: string;
  /** UTM campaign for attribution tracking */
  utmCampaign?: string;
  /** UTM term for attribution tracking */
  utmTerm?: string;
  /** UTM content for attribution tracking */
  utmContent?: string;
}

/**
 * Return value of the {@link useSubscribe} hook.
 *
 * @typeParam TCustomFields - Shape of custom field values sent with the request
 */
export interface UseSubscribeReturn<
  TCustomFields = Record<string, unknown>,
> {
  /** Submit a subscription request with the given data */
  subscribe: (data: SubscribeData<TCustomFields>) => Promise<void>;
  /** Whether a subscription request is currently in progress */
  isLoading: boolean;
  /** Whether the most recent subscription request succeeded */
  isSuccess: boolean;
  /** Error from the most recent subscription attempt, or `null` */
  error: Error | null;
  /** Reset the hook state back to its initial values */
  reset: () => void;
}

/** Internal state managed by the hook */
interface SubscribeState {
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
}

/** Initial (idle) state */
const INITIAL_STATE: SubscribeState = {
  isLoading: false,
  isSuccess: false,
  error: null,
};

/**
 * Hook for managing email subscription to a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl` and
 * `publicationId`, then POSTs to `{apiUrl}/subscribe`.
 *
 * @typeParam TCustomFields - Shape of custom field values sent with the request
 * @param options - Optional callbacks for success and error handling
 * @returns Subscription state and control methods
 *
 * @example
 * ```tsx
 * function NewsletterSignup() {
 *   const { subscribe, isLoading, isSuccess, error, reset } = useSubscribe({
 *     onSuccess: (sub) => console.log('Subscribed!', sub.id),
 *     onError: (err) => console.error(err),
 *   });
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => subscribe({ email: 'user@example.com' })}
 *     >
 *       {isLoading ? 'Subscribing...' : 'Subscribe'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSubscribe<TCustomFields = Record<string, unknown>>(
  options?: UseSubscribeOptions,
): UseSubscribeReturn<TCustomFields> {
  const { apiUrl, publicationId } = useBeehiiv();
  const [state, setState] = useState<SubscribeState>(INITIAL_STATE);

  /**
   * Submit a subscription request to the beehiiv API proxy.
   *
   * @param data - Subscription payload including email and optional fields
   */
  const subscribe = useCallback(
    async (data: SubscribeData<TCustomFields>): Promise<void> => {
      setState({ isLoading: true, isSuccess: false, error: null });

      try {
        const response = await fetch(`${apiUrl}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicationId,
            email: data.email,
            customFields: data.customFields,
            reactivate: data.reactivate,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            utmTerm: data.utmTerm,
            utmContent: data.utmContent,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as Record<string, unknown>;
          const message =
            typeof body.message === 'string'
              ? body.message
              : `Subscription failed with status ${response.status}`;
          throw new Error(message);
        }

        const result = (await response.json()) as { data: SubscriptionInfo };
        setState({ isLoading: false, isSuccess: true, error: null });
        options?.onSuccess?.(result.data);
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        setState({ isLoading: false, isSuccess: false, error });
        options?.onError?.(error);
      }
    },
    [apiUrl, publicationId, options],
  );

  /**
   * Reset the hook state to its initial idle values.
   */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    subscribe,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    error: state.error,
    reset,
  };
}
