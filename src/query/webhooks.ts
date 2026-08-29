/**
 * TanStack Query hooks for beehiiv webhook resources.
 *
 * Provides `useQuery` hooks for listing and retrieving webhooks,
 * and `useMutation` hooks for creating, updating, and deleting webhooks.
 *
 * @module query/webhooks
 */

import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type {
  WebhookInfo,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from '../types/webhook.js';
import { beehiivKeys } from './keys.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read the beehiiv context, throwing if the provider is missing.
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
 * Execute a GET request and return parsed JSON, or throw on failure.
 *
 * @param url - Fully-qualified URL to fetch
 * @returns The parsed JSON body
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const message =
      typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Webhooks list query
// ---------------------------------------------------------------------------

/** Options for {@link useWebhooksQuery}. */
export interface UseWebhooksQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the webhooks list endpoint. */
interface WebhooksListResponse {
  data: WebhookInfo[];
}

/**
 * Fetch the list of webhooks via TanStack Query.
 *
 * Uses the `{apiUrl}/webhooks` endpoint and caches results under
 * {@link beehiivKeys.webhooks.list}.
 *
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the webhooks list response
 *
 * @example
 * ```tsx
 * function WebhookList() {
 *   const { data, isLoading } = useWebhooksQuery();
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(w => <li key={w.id}>{w.url}</li>)}</ul>;
 * }
 * ```
 */
export function useWebhooksQuery(
  options: UseWebhooksQueryOptions = {},
): UseQueryResult<WebhooksListResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  return useQuery<WebhooksListResponse>({
    queryKey: beehiivKeys.webhooks.list({
      publicationId: resolvedPublicationId,
    }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<WebhooksListResponse>(
        `${apiUrl}/webhooks${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Single webhook query
// ---------------------------------------------------------------------------

/** Options for {@link useWebhookQuery}. */
export interface UseWebhookQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the single webhook endpoint. */
interface WebhookDetailResponse {
  data: WebhookInfo;
}

/**
 * Fetch a single webhook by its ID via TanStack Query.
 *
 * Uses the `{apiUrl}/webhooks/{id}` endpoint and caches results under
 * {@link beehiivKeys.webhooks.detail}.
 *
 * @param id - The webhook endpoint ID
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the webhook response
 *
 * @example
 * ```tsx
 * function WebhookDetail({ webhookId }: { webhookId: string }) {
 *   const { data, isLoading } = useWebhookQuery(webhookId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <p>URL: {data?.data.url}</p>;
 * }
 * ```
 */
export function useWebhookQuery(
  id: string,
  options: UseWebhookQueryOptions = {},
): UseQueryResult<WebhookDetailResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  return useQuery<WebhookDetailResponse>({
    queryKey: beehiivKeys.webhooks.detail(id, {
      publicationId: resolvedPublicationId,
    }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<WebhookDetailResponse>(
        `${apiUrl}/webhooks/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!id,
  });
}

// ---------------------------------------------------------------------------
// Create webhook mutation
// ---------------------------------------------------------------------------

/** Options for {@link useCreateWebhookMutation}. */
export interface UseCreateWebhookMutationOptions {
  /** Callback fired after a successful webhook creation */
  onSuccess?: (webhook: WebhookInfo) => void;
  /** Callback fired when the webhook creation fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a new webhook.
 *
 * POSTs to `{apiUrl}/webhooks` with the provided data. On success the
 * mutation automatically invalidates all webhook queries so that list
 * views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the create operation
 *
 * @example
 * ```tsx
 * function CreateWebhookButton() {
 *   const mutation = useCreateWebhookMutation({
 *     onSuccess: (w) => console.log('Created:', w.id),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate({
 *         url: 'https://example.com/hook',
 *         event_types: ['subscription.created'],
 *       })}
 *     >
 *       Create Webhook
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateWebhookMutation(
  options?: UseCreateWebhookMutationOptions,
): UseMutationResult<WebhookInfo, Error, CreateWebhookRequest> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<WebhookInfo, Error, CreateWebhookRequest>({
    mutationFn: async (variables: CreateWebhookRequest) => {
      const response = await fetch(`${apiUrl}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to create webhook (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: WebhookInfo };
      return result.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.webhooks.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Update webhook mutation
// ---------------------------------------------------------------------------

/** Variables for the update webhook mutation. */
export interface UpdateWebhookVariables {
  /** The webhook endpoint ID to update */
  id: string;
  /** The fields to update */
  data: UpdateWebhookRequest;
}

/** Options for {@link useUpdateWebhookMutation}. */
export interface UseUpdateWebhookMutationOptions {
  /** Callback fired after a successful webhook update */
  onSuccess?: (webhook: WebhookInfo) => void;
  /** Callback fired when the webhook update fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating an existing webhook.
 *
 * PATCHes `{apiUrl}/webhooks/{id}` with the provided data. On success
 * the mutation invalidates all webhook queries.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the update operation
 *
 * @example
 * ```tsx
 * function DisableWebhookButton({ webhookId }: { webhookId: string }) {
 *   const mutation = useUpdateWebhookMutation();
 *
 *   return (
 *     <button onClick={() => mutation.mutate({
 *       id: webhookId,
 *       data: { active: false },
 *     })}>
 *       Disable
 *     </button>
 *   );
 * }
 * ```
 */
export function useUpdateWebhookMutation(
  options?: UseUpdateWebhookMutationOptions,
): UseMutationResult<WebhookInfo, Error, UpdateWebhookVariables> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<WebhookInfo, Error, UpdateWebhookVariables>({
    mutationFn: async (variables: UpdateWebhookVariables) => {
      const response = await fetch(
        `${apiUrl}/webhooks/${encodeURIComponent(variables.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variables.data),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to update webhook (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: WebhookInfo };
      return result.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.webhooks.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Delete webhook mutation
// ---------------------------------------------------------------------------

/** Options for {@link useDeleteWebhookMutation}. */
export interface UseDeleteWebhookMutationOptions {
  /** Callback fired after a successful webhook deletion */
  onSuccess?: () => void;
  /** Callback fired when the webhook deletion fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for deleting a webhook.
 *
 * DELETEs `{apiUrl}/webhooks/{id}`. On success the mutation invalidates
 * all webhook queries so that list views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the delete operation
 *
 * @example
 * ```tsx
 * function DeleteWebhookButton({ webhookId }: { webhookId: string }) {
 *   const mutation = useDeleteWebhookMutation({
 *     onSuccess: () => console.log('Deleted'),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate(webhookId)}
 *     >
 *       Delete
 *     </button>
 *   );
 * }
 * ```
 */
export function useDeleteWebhookMutation(
  options?: UseDeleteWebhookMutationOptions,
): UseMutationResult<void, Error, string> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (webhookId: string) => {
      const response = await fetch(
        `${apiUrl}/webhooks/${encodeURIComponent(webhookId)}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to delete webhook (status ${response.status})`;
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.webhooks.all,
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
