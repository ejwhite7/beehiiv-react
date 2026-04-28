/**
 * TanStack Query mutation hooks for beehiiv API write operations.
 *
 * Provides `useMutation`-based hooks that automatically invalidate
 * related queries on success, ensuring the cache stays consistent.
 *
 * @module query/mutations
 */

import { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type { SubscriptionInfo } from '../types/subscription.js';
import { beehiivKeys } from './keys.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read the beehiiv context, throwing if the provider is missing.
 *
 * Mirrors the behaviour of `useBeehiiv()` in `src/hooks/` without
 * importing from that module to avoid circular dependencies.
 *
 * @returns The current {@link BeehiivContextValue}
 * @throws {Error} If called outside a `<BeehiivProvider>`
 */
function useBeehiivContext(): BeehiivContextValue {
  const context = useContext(BeehiivContext);

  if (context === null) {
    throw new Error(
      'beehiiv-react/query hooks must be used within a <BeehiivProvider>. ' +
        'Wrap your component tree with <BeehiivProvider publicationId="...">.',
    );
  }

  return context;
}

// ---------------------------------------------------------------------------
// Subscribe mutation
// ---------------------------------------------------------------------------

/**
 * Input data for the subscribe mutation.
 *
 * Mirrors the shape accepted by the existing `useSubscribe` hook's
 * `subscribe()` function.
 */
export interface SubscribeMutationVariables {
  /** The email address to subscribe */
  email: string;
  /** Optional custom field values to attach to the subscriber */
  customFields?: Record<string, unknown>;
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
 * Options accepted by {@link useSubscribeMutation}.
 */
export interface UseSubscribeMutationOptions {
  /** Callback fired after a successful subscription */
  onSuccess?: (subscription: SubscriptionInfo) => void;
  /** Callback fired when the subscription request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for subscribing an email address to a beehiiv publication.
 *
 * POSTs to `{apiUrl}/subscribe` with the provided data. On success the
 * mutation automatically invalidates all subscriber queries so that list
 * views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the subscribe operation
 *
 * @example
 * ```tsx
 * function SignupForm() {
 *   const mutation = useSubscribeMutation({
 *     onSuccess: (sub) => console.log('Subscribed!', sub.id),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate({ email: 'user@example.com' })}
 *     >
 *       {mutation.isPending ? 'Subscribing...' : 'Subscribe'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSubscribeMutation(
  options?: UseSubscribeMutationOptions,
): UseMutationResult<SubscriptionInfo, Error, SubscribeMutationVariables> {
  const { apiUrl, publicationId } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<SubscriptionInfo, Error, SubscribeMutationVariables>({
    mutationFn: async (variables: SubscribeMutationVariables) => {
      const response = await fetch(`${apiUrl}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationId,
          email: variables.email,
          customFields: variables.customFields,
          reactivate: variables.reactivate,
          utmSource: variables.utmSource,
          utmMedium: variables.utmMedium,
          utmCampaign: variables.utmCampaign,
          utmTerm: variables.utmTerm,
          utmContent: variables.utmContent,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Subscription failed with status ${response.status}`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: SubscriptionInfo };
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate all subscriber queries so lists refresh automatically
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.subscribers.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
