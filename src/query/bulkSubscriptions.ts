/**
 * TanStack Query mutation hooks for bulk subscription operations.
 *
 * Provides `useMutation`-based hooks for bulk subscription creation,
 * bulk field updates, bulk status updates, and subscription tag management.
 * Each mutation automatically invalidates related queries on success,
 * ensuring the cache stays consistent.
 *
 * @module query/bulkSubscriptions
 */

import { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/beehiiv-context.js';
import type {
  BulkCreateSubscriptionsRequest,
  BulkCreateSubscriptionsResponse,
  BulkUpdateFieldsRequest,
  BulkUpdateFieldsResponse,
  BulkUpdateStatusRequest,
} from '../types/bulk-subscriptions.js';
import type { AddTagsResponse } from '../client/endpoints/subscriptions.js';
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

/**
 * Execute a JSON request and return parsed response, or throw on failure.
 *
 * @param url - Fully-qualified URL to fetch
 * @param method - HTTP method to use
 * @param body - Optional request body to serialize as JSON
 * @returns The parsed JSON body
 */
async function fetchJsonMutation<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const message =
      typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  /* Some endpoints (e.g. bulk status update) return 204 No Content */
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Bulk Subscribe Mutation
// ---------------------------------------------------------------------------

/**
 * Variables for the bulk subscribe mutation.
 */
export interface BulkSubscribeMutationVariables {
  /** The bulk create request body containing subscription entries */
  body: BulkCreateSubscriptionsRequest;
}

/**
 * Options accepted by {@link useBulkSubscribeMutation}.
 */
export interface UseBulkSubscribeMutationOptions {
  /** Callback fired after a successful bulk subscription creation */
  onSuccess?: (response: BulkCreateSubscriptionsResponse) => void;
  /** Callback fired when the bulk subscription request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating multiple subscriptions in bulk.
 *
 * POSTs to `{apiUrl}/bulk-subscriptions` with an array of subscription
 * entries. On success, the mutation automatically invalidates all subscriber
 * and bulk subscription queries so that list views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the bulk subscribe operation
 *
 * @example
 * ```tsx
 * function BulkImportButton() {
 *   const mutation = useBulkSubscribeMutation({
 *     onSuccess: (res) => console.log(`Import ${res.import_id} started`),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() =>
 *         mutation.mutate({
 *           body: {
 *             subscriptions: [
 *               { email: 'user1@example.com' },
 *               { email: 'user2@example.com' },
 *             ],
 *           },
 *         })
 *       }
 *     >
 *       {mutation.isPending ? 'Importing...' : 'Import Subscribers'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBulkSubscribeMutation(
  options?: UseBulkSubscribeMutationOptions,
): UseMutationResult<
  BulkCreateSubscriptionsResponse,
  Error,
  BulkSubscribeMutationVariables
> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<
    BulkCreateSubscriptionsResponse,
    Error,
    BulkSubscribeMutationVariables
  >({
    mutationFn: async (variables: BulkSubscribeMutationVariables) => {
      return fetchJsonMutation<BulkCreateSubscriptionsResponse>(
        `${apiUrl}/bulk-subscriptions`,
        'POST',
        variables.body,
      );
    },
    onSuccess: (data) => {
      /* Invalidate subscriber and bulk subscription queries */
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.subscribers.all,
      });
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.bulkSubscriptions.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Bulk Update Fields Mutation
// ---------------------------------------------------------------------------

/**
 * Variables for the bulk update fields mutation.
 */
export interface BulkUpdateFieldsMutationVariables {
  /** The bulk field update request body */
  body: BulkUpdateFieldsRequest;
}

/**
 * Options accepted by {@link useBulkUpdateFieldsMutation}.
 */
export interface UseBulkUpdateFieldsMutationOptions {
  /** Callback fired after a successful bulk field update */
  onSuccess?: (response: BulkUpdateFieldsResponse) => void;
  /** Callback fired when the bulk field update request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating custom fields on multiple subscriptions at once.
 *
 * PUTs to `{apiUrl}/subscriptions/bulk_actions` with an array of
 * subscription IDs and the fields to update. On success, the mutation
 * automatically invalidates all subscriber and bulk subscription update queries.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the bulk field update operation
 *
 * @example
 * ```tsx
 * function BulkFieldUpdate() {
 *   const mutation = useBulkUpdateFieldsMutation({
 *     onSuccess: (res) =>
 *       console.log(`Update ${res.data.subscription_update_id} started`),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() =>
 *         mutation.mutate({
 *           body: {
 *             subscriptions: [
 *               { subscription_id: 'sub_1', tier: 'premium' },
 *               { subscription_id: 'sub_2', tier: 'premium' },
 *             ],
 *           },
 *         })
 *       }
 *     >
 *       {mutation.isPending ? 'Updating...' : 'Update Fields'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBulkUpdateFieldsMutation(
  options?: UseBulkUpdateFieldsMutationOptions,
): UseMutationResult<
  BulkUpdateFieldsResponse,
  Error,
  BulkUpdateFieldsMutationVariables
> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<
    BulkUpdateFieldsResponse,
    Error,
    BulkUpdateFieldsMutationVariables
  >({
    mutationFn: async (variables: BulkUpdateFieldsMutationVariables) => {
      return fetchJsonMutation<BulkUpdateFieldsResponse>(
        `${apiUrl}/subscriptions/bulk_actions`,
        'PUT',
        variables.body,
      );
    },
    onSuccess: (data) => {
      /* Invalidate subscriber and bulk update queries */
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.subscribers.all,
      });
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.bulkSubscriptionUpdates.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Bulk Update Status Mutation
// ---------------------------------------------------------------------------

/**
 * Variables for the bulk update status mutation.
 */
export interface BulkUpdateStatusMutationVariables {
  /** The bulk status update request body */
  body: BulkUpdateStatusRequest;
}

/**
 * Options accepted by {@link useBulkUpdateStatusMutation}.
 */
export interface UseBulkUpdateStatusMutationOptions {
  /** Callback fired after a successful bulk status update */
  onSuccess?: () => void;
  /** Callback fired when the bulk status update request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for changing the status of multiple subscriptions at once.
 *
 * PUTs to `{apiUrl}/subscriptions` with an array of subscription IDs
 * and the new status. The API responds with 204 No Content, so the
 * mutation resolves with no data. On success, the mutation automatically
 * invalidates all subscriber and bulk subscription update queries.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the bulk status update operation
 *
 * @example
 * ```tsx
 * function BulkDeactivate() {
 *   const mutation = useBulkUpdateStatusMutation({
 *     onSuccess: () => console.log('Bulk status update submitted'),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() =>
 *         mutation.mutate({
 *           body: {
 *             subscription_ids: ['sub_1', 'sub_2'],
 *             new_status: 'inactive',
 *           },
 *         })
 *       }
 *     >
 *       {mutation.isPending ? 'Deactivating...' : 'Deactivate Selected'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBulkUpdateStatusMutation(
  options?: UseBulkUpdateStatusMutationOptions,
): UseMutationResult<void, Error, BulkUpdateStatusMutationVariables> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, BulkUpdateStatusMutationVariables>({
    mutationFn: async (variables: BulkUpdateStatusMutationVariables) => {
      return fetchJsonMutation<void>(
        `${apiUrl}/subscriptions`,
        'PUT',
        variables.body,
      );
    },
    onSuccess: () => {
      /* Invalidate subscriber and bulk update queries */
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.subscribers.all,
      });
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.bulkSubscriptionUpdates.all,
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Add Tags Mutation
// ---------------------------------------------------------------------------

/**
 * Variables for the add tags mutation.
 */
export interface AddTagsMutationVariables {
  /** The subscription ID to tag (starts with "sub_") */
  subscriptionId: string;
  /** Array of tag strings to add to the subscription */
  tags: string[];
}

/**
 * Options accepted by {@link useAddTagsMutation}.
 */
export interface UseAddTagsMutationOptions {
  /** Callback fired after tags are successfully added */
  onSuccess?: (response: AddTagsResponse) => void;
  /** Callback fired when the add tags request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for adding tags to a subscription.
 *
 * POSTs to `{apiUrl}/subscriptions/{subscriptionId}/tags` with an array
 * of tag strings. On success, the mutation automatically invalidates
 * all subscriber queries so that list views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the add tags operation
 *
 * @example
 * ```tsx
 * function TagButton({ subscriptionId }: { subscriptionId: string }) {
 *   const mutation = useAddTagsMutation({
 *     onSuccess: (res) => console.log('Tags added:', res.tags),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() =>
 *         mutation.mutate({
 *           subscriptionId,
 *           tags: ['vip', 'early-adopter'],
 *         })
 *       }
 *     >
 *       {mutation.isPending ? 'Tagging...' : 'Add Tags'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAddTagsMutation(
  options?: UseAddTagsMutationOptions,
): UseMutationResult<AddTagsResponse, Error, AddTagsMutationVariables> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<AddTagsResponse, Error, AddTagsMutationVariables>({
    mutationFn: async (variables: AddTagsMutationVariables) => {
      return fetchJsonMutation<AddTagsResponse>(
        `${apiUrl}/subscriptions/${variables.subscriptionId}/tags`,
        'POST',
        { tags: variables.tags },
      );
    },
    onSuccess: (data) => {
      /* Invalidate subscriber queries so lists reflect the new tags */
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
