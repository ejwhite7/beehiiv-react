/**
 * Hooks for fetching automation data from a beehiiv publication.
 *
 * Provides `useAutomations` for paginated automation lists and
 * `useAutomation` for fetching a single automation by ID.
 * Both hooks automatically fetch on mount (unless `enabled` is `false`)
 * and expose a `refetch` function for manual re-triggering.
 *
 * @module hooks/useAutomations
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AutomationInfo } from '../types/automation.js';
import { useBeehiiv } from './useBeehiiv.js';

// ---------------------------------------------------------------------------
// useAutomations (list)
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link useAutomations} hook.
 */
export interface UseAutomationsOptions {
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  publicationId?: string;
  /** Filter automations by their current status */
  status?: string;
  /** Maximum number of results to return per page */
  limit?: number;
  /**
   * Whether the fetch should run automatically on mount.
   * Set to `false` to defer fetching until `refetch()` is called.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link useAutomations} hook.
 */
export interface UseAutomationsReturn {
  /** The accumulated list of fetched automations */
  automations: AutomationInfo[];
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Whether there are more pages available to load */
  hasMore: boolean;
  /** Load the next page of results, appending to the existing list */
  fetchMore: () => void;
  /** Re-fetch from the first page, replacing the current list */
  refetch: () => void;
}

/**
 * Hook for fetching a paginated list of automations from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/automations` with optional query parameters for
 * filtering and cursor-based pagination.
 *
 * @param options - Filtering, pagination, and fetch configuration
 * @returns Automation list data, loading state, error, and pagination controls
 *
 * @example
 * ```tsx
 * function AutomationList() {
 *   const { automations, isLoading, error, hasMore, fetchMore } = useAutomations({
 *     status: 'active',
 *     limit: 20,
 *   });
 *
 *   if (isLoading && automations.length === 0) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <>
 *       <ul>
 *         {automations.map((a) => <li key={a.id}>{a.name}</li>)}
 *       </ul>
 *       {hasMore && <button onClick={fetchMore}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useAutomations(
  options: UseAutomationsOptions = {},
): UseAutomationsReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, status, limit, enabled = true } = options;

  const [automations, setAutomations] = useState<AutomationInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  /** Cursor for the next page of results */
  const cursorRef = useRef<string | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL with query parameters.
   *
   * @param cursor - Optional cursor token for pagination
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback(
    (cursor?: string | null): string => {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      if (status) {
        params.set('status', status);
      }
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }
      if (cursor) {
        params.set('cursor', cursor);
      }
      const query = params.toString();
      return `${apiUrl}/automations${query ? `?${query}` : ''}`;
    },
    [apiUrl, publicationId, status, limit],
  );

  /**
   * Execute the fetch, optionally appending to the existing list.
   *
   * @param cursor - Cursor for the page to fetch (`null` for first page)
   * @param append - Whether to append results or replace
   */
  const fetchAutomations = useCallback(
    async (cursor: string | null, append: boolean) => {
      const currentFetchId = ++fetchIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const url = buildUrl(cursor);
        const response = await fetch(url);

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          const message =
            typeof body.message === 'string'
              ? body.message
              : `Failed to fetch automations (status ${response.status})`;
          throw new Error(message);
        }

        const result = (await response.json()) as {
          data: AutomationInfo[];
          pagination: { next_cursor: string | null; has_more: boolean };
        };

        if (currentFetchId === fetchIdRef.current) {
          setAutomations((prev) =>
            append ? [...prev, ...result.data] : result.data,
          );
          cursorRef.current = result.pagination.next_cursor;
          setHasMore(result.pagination.has_more);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (currentFetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    },
    [buildUrl],
  );

  // Auto-fetch the first page on mount and when filter deps change
  useEffect(() => {
    if (enabled) {
      cursorRef.current = null;
      void fetchAutomations(null, false);
    }
  }, [enabled, fetchAutomations]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const fetchMore = useCallback((): void => {
    if (!hasMore || isLoading) return;
    void fetchAutomations(cursorRef.current, true);
  }, [hasMore, isLoading, fetchAutomations]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback((): void => {
    cursorRef.current = null;
    void fetchAutomations(null, false);
  }, [fetchAutomations]);

  return { automations, isLoading, error, hasMore, fetchMore, refetch };
}

// ---------------------------------------------------------------------------
// useAutomation (single)
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link useAutomation} hook.
 */
export interface UseAutomationOptions {
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
 * Return value of the {@link useAutomation} hook.
 */
export interface UseAutomationReturn {
  /** The fetched automation record, or `null` while loading */
  automation: AutomationInfo | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the fetch */
  refetch: () => void;
}

/**
 * Hook for fetching a single automation by its ID from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/automations/{automationId}`.
 *
 * @param automationId - The automation ID to fetch (starts with "aut_")
 * @param options - Optional query configuration
 * @returns Automation data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function AutomationDetail({ id }: { id: string }) {
 *   const { automation, isLoading, error } = useAutomation(id);
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!automation) return <p>Not found</p>;
 *
 *   return <h1>{automation.name}</h1>;
 * }
 * ```
 */
export function useAutomation(
  automationId: string,
  options: UseAutomationOptions = {},
): UseAutomationReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, enabled = true } = options;

  const [automation, setAutomation] = useState<AutomationInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Execute the fetch request for a single automation.
   */
  const fetchAutomation = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      const query = params.toString();
      const url = `${apiUrl}/automations/${encodeURIComponent(automationId)}${query ? `?${query}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch automation (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: AutomationInfo };

      if (currentFetchId === fetchIdRef.current) {
        setAutomation(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [apiUrl, publicationId, automationId]);

  // Auto-fetch on mount when enabled
  useEffect(() => {
    if (enabled && automationId) {
      void fetchAutomation();
    }
  }, [enabled, fetchAutomation, automationId]);

  /**
   * Manually re-trigger the automation fetch.
   */
  const refetch = useCallback(() => {
    void fetchAutomation();
  }, [fetchAutomation]);

  return { automation, isLoading, error, refetch };
}
