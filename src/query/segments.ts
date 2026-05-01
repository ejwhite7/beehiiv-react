/**
 * TanStack Query hooks for beehiiv segment resources.
 *
 * Provides `useQuery` hooks for listing and retrieving segments, and
 * `useMutation` hooks for creating, deleting, and recalculating segments.
 * Also includes `useSegmentResultsQuery` for fetching subscriber IDs
 * from segment results.
 *
 * @module query/segments
 */

import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type {
  SegmentInfo,
  CreateSegmentRequest,
  SegmentRecalculateResponse,
} from '../types/segment.js';
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
// Segments list query
// ---------------------------------------------------------------------------

/** Options for {@link useSegmentsQuery}. */
export interface UseSegmentsQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /** Filter by segment type */
  type?: string;
  /** Filter by segment status */
  status?: string;
  /** Maximum number of results to return per page */
  limit?: number;
  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the segments list endpoint. */
interface SegmentsListResponse {
  data: SegmentInfo[];
  limit: number;
  page: number;
  total_results: number;
  total_pages: number;
}

/**
 * Fetch a paginated list of segments via TanStack Query.
 *
 * Uses the `{apiUrl}/segments` endpoint and caches results under
 * {@link beehiivKeys.segments.list}.
 *
 * @param options - Optional filter, pagination, and query configuration
 * @returns A standard `UseQueryResult` containing the segments list response
 *
 * @example
 * ```tsx
 * function SegmentList() {
 *   const { data, isLoading } = useSegmentsQuery({ limit: 20 });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(s => <li key={s.id}>{s.name}</li>)}</ul>;
 * }
 * ```
 */
export function useSegmentsQuery(
  options: UseSegmentsQueryOptions = {},
): UseQueryResult<SegmentsListResponse> {
  const { apiUrl } = useBeehiivContext();
  const {
    publicationId,
    type,
    status,
    limit,
    staleTime = 60_000,
    enabled = true,
  } = options;

  return useQuery<SegmentsListResponse>({
    queryKey: beehiivKeys.segments.list(),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (limit !== undefined) params.set('limit', String(limit));
      const query = params.toString();
      return fetchJson<SegmentsListResponse>(
        `${apiUrl}/segments${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Single segment query
// ---------------------------------------------------------------------------

/** Options for {@link useSegmentQuery}. */
export interface UseSegmentQueryOptions {
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

/** Response shape returned by the single segment endpoint. */
interface SegmentDetailResponse {
  data: SegmentInfo;
}

/**
 * Fetch a single segment by its ID via TanStack Query.
 *
 * Uses the `{apiUrl}/segments/{id}` endpoint and caches results under
 * {@link beehiivKeys.segments.detail}.
 *
 * @param id - The segment identifier (starts with "seg_")
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the segment response
 *
 * @example
 * ```tsx
 * function SegmentDetail({ segmentId }: { segmentId: string }) {
 *   const { data, isLoading } = useSegmentQuery(segmentId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <h1>{data?.data.name}</h1>;
 * }
 * ```
 */
export function useSegmentQuery(
  id: string,
  options: UseSegmentQueryOptions = {},
): UseQueryResult<SegmentDetailResponse> {
  const { apiUrl } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;

  return useQuery<SegmentDetailResponse>({
    queryKey: beehiivKeys.segments.detail(id),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<SegmentDetailResponse>(
        `${apiUrl}/segments/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!id,
  });
}

// ---------------------------------------------------------------------------
// Segment results (subscriber IDs) query
// ---------------------------------------------------------------------------

/** Options for {@link useSegmentResultsQuery}. */
export interface UseSegmentResultsQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /** Maximum number of results to return per page */
  limit?: number;
  /** Page number to retrieve */
  page?: number;
  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the segment results endpoint. */
interface SegmentResultsResponse {
  data: string[];
  limit: number;
  page: number;
  total_results: number;
  total_pages: number;
}

/**
 * Fetch subscriber IDs from a segment's results via TanStack Query.
 *
 * Uses the `{apiUrl}/segments/{id}/results` endpoint and caches results
 * under {@link beehiivKeys.segments.results}.
 *
 * @param segmentId - The segment identifier (starts with "seg_")
 * @param options - Optional pagination and query configuration
 * @returns A standard `UseQueryResult` containing the subscriber IDs
 *
 * @example
 * ```tsx
 * function SegmentResults({ segmentId }: { segmentId: string }) {
 *   const { data, isLoading } = useSegmentResultsQuery(segmentId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <p>{data?.total_results} subscribers in this segment</p>;
 * }
 * ```
 */
export function useSegmentResultsQuery(
  segmentId: string,
  options: UseSegmentResultsQueryOptions = {},
): UseQueryResult<SegmentResultsResponse> {
  const { apiUrl } = useBeehiivContext();
  const { publicationId, limit, page, staleTime = 60_000, enabled = true } = options;

  return useQuery<SegmentResultsResponse>({
    queryKey: beehiivKeys.segments.results(segmentId),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      if (limit !== undefined) params.set('limit', String(limit));
      if (page !== undefined) params.set('page', String(page));
      const query = params.toString();
      return fetchJson<SegmentResultsResponse>(
        `${apiUrl}/segments/${encodeURIComponent(segmentId)}/results${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!segmentId,
  });
}

// ---------------------------------------------------------------------------
// Create segment mutation
// ---------------------------------------------------------------------------

/** Options for {@link useCreateSegmentMutation}. */
export interface UseCreateSegmentMutationOptions {
  /** Callback fired after a successful segment creation */
  onSuccess?: (segment: SegmentInfo) => void;
  /** Callback fired when the segment creation fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a new segment.
 *
 * POSTs to `{apiUrl}/segments` with the provided data. On success the
 * mutation automatically invalidates all segment queries.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the create operation
 *
 * @example
 * ```tsx
 * function CreateSegmentForm() {
 *   const mutation = useCreateSegmentMutation({
 *     onSuccess: (s) => console.log('Created:', s.id),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate({
 *         name: 'VIP Subscribers',
 *         input: { type: 'emails', emails: ['user@example.com'] },
 *       })}
 *     >
 *       Create Segment
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateSegmentMutation(
  options?: UseCreateSegmentMutationOptions,
): UseMutationResult<SegmentInfo, Error, CreateSegmentRequest> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<SegmentInfo, Error, CreateSegmentRequest>({
    mutationFn: async (variables: CreateSegmentRequest) => {
      const response = await fetch(`${apiUrl}/segments`, {
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
            : `Failed to create segment (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: SegmentInfo };
      return result.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.segments.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Delete segment mutation
// ---------------------------------------------------------------------------

/** Options for {@link useDeleteSegmentMutation}. */
export interface UseDeleteSegmentMutationOptions {
  /** Callback fired after a successful segment deletion */
  onSuccess?: () => void;
  /** Callback fired when the segment deletion fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for deleting a segment.
 *
 * DELETEs `{apiUrl}/segments/{id}`. On success the mutation invalidates
 * all segment queries so that list views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the delete operation
 *
 * @example
 * ```tsx
 * function DeleteSegmentButton({ segmentId }: { segmentId: string }) {
 *   const mutation = useDeleteSegmentMutation({
 *     onSuccess: () => console.log('Deleted'),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate(segmentId)}
 *     >
 *       Delete
 *     </button>
 *   );
 * }
 * ```
 */
export function useDeleteSegmentMutation(
  options?: UseDeleteSegmentMutationOptions,
): UseMutationResult<void, Error, string> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (segmentId: string) => {
      const response = await fetch(
        `${apiUrl}/segments/${encodeURIComponent(segmentId)}`,
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
            : `Failed to delete segment (status ${response.status})`;
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.segments.all,
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Recalculate segment mutation
// ---------------------------------------------------------------------------

/** Options for {@link useRecalculateSegmentMutation}. */
export interface UseRecalculateSegmentMutationOptions {
  /** Callback fired after a successful recalculation trigger */
  onSuccess?: (result: SegmentRecalculateResponse) => void;
  /** Callback fired when the recalculation fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for triggering a segment recalculation.
 *
 * PUTs to `{apiUrl}/segments/{id}/recalculate`. On success the mutation
 * invalidates all segment queries so views refresh with new membership data.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the recalculate operation
 *
 * @example
 * ```tsx
 * function RecalculateButton({ segmentId }: { segmentId: string }) {
 *   const mutation = useRecalculateSegmentMutation({
 *     onSuccess: (r) => console.log(r.message),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate(segmentId)}
 *     >
 *       Recalculate
 *     </button>
 *   );
 * }
 * ```
 */
export function useRecalculateSegmentMutation(
  options?: UseRecalculateSegmentMutationOptions,
): UseMutationResult<SegmentRecalculateResponse, Error, string> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<SegmentRecalculateResponse, Error, string>({
    mutationFn: async (segmentId: string) => {
      const response = await fetch(
        `${apiUrl}/segments/${encodeURIComponent(segmentId)}/recalculate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
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
            : `Failed to recalculate segment (status ${response.status})`;
        throw new Error(message);
      }

      return (await response.json()) as SegmentRecalculateResponse;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.segments.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
