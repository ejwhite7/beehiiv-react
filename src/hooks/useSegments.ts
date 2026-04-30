/**
 * Hooks for fetching segment data from a beehiiv publication.
 *
 * Provides `useSegments` for paginated segment lists and
 * `useSegment` for fetching a single segment by ID.
 * Both hooks automatically fetch on mount (unless `enabled` is `false`)
 * and expose a `refetch` function for manual re-triggering.
 *
 * @module hooks/useSegments
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SegmentInfo } from '../types/segment.js';
import { useBeehiiv } from './useBeehiiv.js';

// ---------------------------------------------------------------------------
// useSegments (list)
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link useSegments} hook.
 */
export interface UseSegmentsOptions {
  /**
   * Override the publication ID from the provider context.
   * When omitted the value from the nearest `<BeehiivProvider>` is used.
   */
  publicationId?: string;
  /** Filter segments by their type */
  type?: string;
  /** Filter segments by their calculation status */
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
 * Return value of the {@link useSegments} hook.
 */
export interface UseSegmentsReturn {
  /** The list of fetched segments */
  segments: SegmentInfo[];
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Whether there are more pages available to load */
  hasMore: boolean;
  /** Load the next page of results, appending to the existing list */
  loadMore: () => Promise<void>;
  /** Re-fetch from the first page, replacing the current list */
  refetch: () => void;
}

/**
 * Hook for fetching a paginated list of segments from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/segments` with optional query parameters for
 * filtering and page-based (offset) pagination.
 *
 * @param options - Filtering, pagination, and fetch configuration
 * @returns Segment list data, loading state, error, and pagination controls
 *
 * @example
 * ```tsx
 * function SegmentList() {
 *   const { segments, isLoading, error, hasMore, loadMore } = useSegments({
 *     limit: 20,
 *   });
 *
 *   if (isLoading && segments.length === 0) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <>
 *       <ul>
 *         {segments.map((s) => <li key={s.id}>{s.name}</li>)}
 *       </ul>
 *       {hasMore && <button onClick={loadMore}>Load more</button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useSegments(
  options: UseSegmentsOptions = {},
): UseSegmentsReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, type, status, limit, enabled = true } = options;

  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  /** Current page number (1-indexed, matching the beehiiv API) */
  const pageRef = useRef<number>(1);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Build the endpoint URL with query parameters.
   *
   * @param page - The 1-indexed page number to fetch
   * @returns The fully-qualified URL string
   */
  const buildUrl = useCallback(
    (page: number): string => {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      if (type) {
        params.set('type', type);
      }
      if (status) {
        params.set('status', status);
      }
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }
      params.set('page', String(page));
      const query = params.toString();
      return `${apiUrl}/segments${query ? `?${query}` : ''}`;
    },
    [apiUrl, publicationId, type, status, limit],
  );

  /**
   * Execute the fetch for a given page number.
   *
   * @param page - The 1-indexed page to fetch
   * @param append - Whether to append results or replace
   */
  const fetchSegments = useCallback(
    async (page: number, append: boolean) => {
      const currentFetchId = ++fetchIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const url = buildUrl(page);
        const response = await fetch(url);

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          const message =
            typeof body.message === 'string'
              ? body.message
              : `Failed to fetch segments (status ${response.status})`;
          throw new Error(message);
        }

        const result = (await response.json()) as {
          data: SegmentInfo[];
          total_pages?: number;
        };

        if (currentFetchId === fetchIdRef.current) {
          const data = result.data ?? [];
          setSegments((prev) => (append ? [...prev, ...data] : data));
          pageRef.current = page;

          const totalPages = result.total_pages ?? 0;
          setHasMore(page < totalPages);
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
      pageRef.current = 1;
      void fetchSegments(1, false);
    }
  }, [enabled, fetchSegments]);

  /**
   * Load the next page of results, appending them to the current list.
   * No-op if there are no more pages or a fetch is already in progress.
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await fetchSegments(pageRef.current + 1, true);
  }, [hasMore, isLoading, fetchSegments]);

  /**
   * Re-fetch from the first page, replacing the entire list.
   */
  const refetch = useCallback((): void => {
    pageRef.current = 1;
    void fetchSegments(1, false);
  }, [fetchSegments]);

  return { segments, isLoading, error, hasMore, loadMore, refetch };
}

// ---------------------------------------------------------------------------
// useSegment (single)
// ---------------------------------------------------------------------------

/**
 * Options accepted by the {@link useSegment} hook.
 */
export interface UseSegmentOptions {
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
 * Return value of the {@link useSegment} hook.
 */
export interface UseSegmentReturn {
  /** The fetched segment record, or `null` while loading */
  segment: SegmentInfo | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the fetch */
  refetch: () => void;
}

/**
 * Hook for fetching a single segment by its ID from a beehiiv publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`. The request
 * is sent to `{apiUrl}/segments/{segmentId}`.
 *
 * @param segmentId - The segment ID to fetch (starts with "seg_")
 * @param options - Optional query configuration
 * @returns Segment data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function SegmentDetail({ id }: { id: string }) {
 *   const { segment, isLoading, error } = useSegment(id);
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!segment) return <p>Not found</p>;
 *
 *   return <h1>{segment.name} ({segment.total_results} members)</h1>;
 * }
 * ```
 */
export function useSegment(
  segmentId: string,
  options: UseSegmentOptions = {},
): UseSegmentReturn {
  const { apiUrl } = useBeehiiv();
  const { publicationId, enabled = true } = options;

  const [segment, setSegment] = useState<SegmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /** Monotonically increasing fetch ID to discard stale responses */
  const fetchIdRef = useRef(0);

  /**
   * Execute the fetch request for a single segment.
   */
  const fetchSegment = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (publicationId) {
        params.set('publicationId', publicationId);
      }
      const query = params.toString();
      const url = `${apiUrl}/segments/${encodeURIComponent(segmentId)}${query ? `?${query}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch segment (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: SegmentInfo };

      if (currentFetchId === fetchIdRef.current) {
        setSegment(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [apiUrl, publicationId, segmentId]);

  // Auto-fetch on mount when enabled
  useEffect(() => {
    if (enabled && segmentId) {
      void fetchSegment();
    }
  }, [enabled, fetchSegment, segmentId]);

  /**
   * Manually re-trigger the segment fetch.
   */
  const refetch = useCallback(() => {
    void fetchSegment();
  }, [fetchSegment]);

  return { segment, isLoading, error, refetch };
}
