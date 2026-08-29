/**
 * Hooks for fetching webhook data from a beehiiv publication.
 *
 * Provides `useWebhooks` for listing all webhooks and `useWebhook`
 * for fetching a single webhook by ID. Both hooks automatically
 * fetch on mount (unless `enabled` is `false`) and expose a `refetch`
 * function for manual re-triggering.
 *
 * @module hooks/useWebhooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { WebhookInfo } from '../types/webhook.js';
import { useBeehiiv } from './useBeehiiv.js';

// ---------------------------------------------------------------------------
// useWebhooks (list)
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link useWebhooks} hook.
 */
export interface UseWebhooksOptions {
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
 * Return value of the {@link useWebhooks} hook.
 */
export interface UseWebhooksReturn {
  /** The list of fetched webhooks */
  webhooks: WebhookInfo[];
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Re-fetch the webhook list, replacing the current results */
  refetch: () => void;
}

/**
 * Hook for fetching the list of webhooks from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/webhooks`.
 *
 * @param options - Optional query configuration
 * @returns Webhook list data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function WebhookList() {
 *   const { webhooks, isLoading, error } = useWebhooks();
 *
 *   if (isLoading) return <p>Loading webhooks...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {webhooks.map((w) => (
 *         <li key={w.id}>{w.url}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useWebhooks(
  options: UseWebhooksOptions = {},
): UseWebhooksReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, enabled = true } = options;

  const [webhooks, setWebhooks] = useState<WebhookInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Execute the fetch request for webhooks.
   */
  const fetchWebhooks = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      const query = params.toString();
      const url = `${apiUrl}/webhooks${query ? `?${query}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch webhooks (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: WebhookInfo[] };

      if (currentFetchId === fetchIdRef.current) {
        setWebhooks(result.data ?? []);
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
      void fetchWebhooks();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchWebhooks]);

  /**
   * Manually re-trigger the webhook list fetch.
   */
  const refetch = useCallback(() => {
    void fetchWebhooks();
  }, [fetchWebhooks]);

  return { webhooks, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// useWebhook (single)
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link useWebhook} hook.
 */
export interface UseWebhookOptions {
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
 * Return value of the {@link useWebhook} hook.
 */
export interface UseWebhookReturn {
  /** The fetched webhook record, or `null` while loading */
  webhook: WebhookInfo | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the fetch */
  refetch: () => void;
}

/**
 * Hook for fetching a single webhook by its ID from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/webhooks/{webhookId}`.
 *
 * @param webhookId - The webhook endpoint ID to fetch
 * @param options - Optional query configuration
 * @returns Webhook data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function WebhookDetail({ id }: { id: string }) {
 *   const { webhook, isLoading, error } = useWebhook(id);
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!webhook) return <p>Not found</p>;
 *
 *   return <p>URL: {webhook.url}</p>;
 * }
 * ```
 */
export function useWebhook(
  webhookId: string,
  options: UseWebhookOptions = {},
): UseWebhookReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, enabled = true } = options;

  const [webhook, setWebhook] = useState<WebhookInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Execute the fetch request for a single webhook.
   */
  const fetchWebhook = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      const query = params.toString();
      const url = `${apiUrl}/webhooks/${encodeURIComponent(webhookId)}${query ? `?${query}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch webhook (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: WebhookInfo };

      if (currentFetchId === fetchIdRef.current) {
        setWebhook(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [apiUrl, publicationId, webhookId]);

  // Auto-fetch on mount when enabled
  useEffect(() => {
    if (enabled && webhookId) {
      void fetchWebhook();
    }
    return () => {
      fetchIdRef.current += 1;
    };
  }, [enabled, fetchWebhook, webhookId]);

  /**
   * Manually re-trigger the webhook fetch.
   */
  const refetch = useCallback(() => {
    void fetchWebhook();
  }, [fetchWebhook]);

  return { webhook, isLoading, error, refetch };
}
