/**
 * TanStack Query hooks and mutations for beehiiv Tier resources.
 *
 * Provides `useQuery`-based hooks for fetching tier lists and individual
 * tiers, plus `useMutation` hooks for creating and updating tiers.
 * Each hook reads context values (`apiUrl`, `publicationId`) from the
 * nearest `<BeehiivProvider>` and uses the key factory from `./keys.ts`
 * for cache keys.
 *
 * @module query/tiers
 */

import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type {
  Tier,
  TierType,
  CreateTierRequest,
  UpdateTierRequest,
} from '../types/tier.js';
import { beehiivKeys } from './keys.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read the beehiiv context, throwing if the provider is missing.
 *
 * This mirrors the behaviour of `useBeehiiv()` in `src/hooks/` without
 * importing from that module — avoids potential circular dependencies.
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
// Tiers list query
// ---------------------------------------------------------------------------

/** Filter / pagination options for {@link useTiersQuery}. */
export interface UseTiersQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /** Filter tiers by type (free or premium) */
  type?: TierType;
  /** Filter tiers by active status */
  active?: boolean;
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

/** Response shape returned by the tiers list endpoint. */
interface TiersListResponse {
  data: Tier[];
  pagination: { next_cursor: string | null; has_more: boolean };
}

/**
 * Fetch a paginated list of tiers via TanStack Query.
 *
 * Uses the `{apiUrl}/tiers` endpoint exposed by the beehiiv API proxy
 * and caches results under {@link beehiivKeys.tiers.list}.
 *
 * @param options - Optional filter, pagination, and query configuration
 * @returns A standard `UseQueryResult` containing the tiers list response
 *
 * @example
 * ```tsx
 * function TierList() {
 *   const { data, isLoading } = useTiersQuery({ type: 'premium', limit: 10 });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(t => <li key={t.id}>{t.name}</li>)}</ul>;
 * }
 * ```
 */
export function useTiersQuery(
  options: UseTiersQueryOptions = {},
): UseQueryResult<TiersListResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const {
    publicationId,
    type,
    active,
    limit,
    staleTime = 60_000,
    enabled = true,
  } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  const keyOptions = {
    publicationId: resolvedPublicationId,
    ...(type ? { type } : {}),
    ...(active !== undefined ? { active } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };

  return useQuery<TiersListResponse>({
    queryKey: beehiivKeys.tiers.list(keyOptions),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      if (type) params.set('type', type);
      if (active !== undefined) params.set('active', String(active));
      if (limit !== undefined) params.set('limit', String(limit));
      const query = params.toString();
      return fetchJson<TiersListResponse>(
        `${apiUrl}/tiers${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Single tier query
// ---------------------------------------------------------------------------

/** Options for {@link useTierQuery}. */
export interface UseTierQueryOptions {
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

/** Response shape returned by the single-tier endpoint. */
interface TierDetailResponse {
  data: Tier;
}

/**
 * Fetch a single tier by its ID via TanStack Query.
 *
 * Uses the `{apiUrl}/tiers/{id}` endpoint and caches results under
 * {@link beehiivKeys.tiers.detail}.
 *
 * @param id - The tier identifier (starts with "tier_")
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the single-tier response
 *
 * @example
 * ```tsx
 * function TierDetail({ tierId }: { tierId: string }) {
 *   const { data, isLoading } = useTierQuery(tierId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <h1>{data?.data.name}</h1>;
 * }
 * ```
 */
export function useTierQuery(
  id: string,
  options: UseTierQueryOptions = {},
): UseQueryResult<TierDetailResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  return useQuery<TierDetailResponse>({
    queryKey: beehiivKeys.tiers.detail(id, {
      publicationId: resolvedPublicationId,
    }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<TierDetailResponse>(
        `${apiUrl}/tiers/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!id,
  });
}

// ---------------------------------------------------------------------------
// Create tier mutation
// ---------------------------------------------------------------------------

/**
 * Variables required by the create-tier mutation.
 */
export interface CreateTierMutationVariables {
  /** The publication ID to create the tier on */
  publicationId: string;
  /** The tier creation data */
  data: CreateTierRequest;
}

/**
 * Options accepted by {@link useCreateTierMutation}.
 */
export interface UseCreateTierMutationOptions {
  /** Callback fired after a successful creation */
  onSuccess?: (tier: Tier) => void;
  /** Callback fired when the creation request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a new tier on a beehiiv publication.
 *
 * POSTs to `{apiUrl}/tiers` with the provided data. On success the
 * mutation automatically invalidates all tier queries so that list
 * views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the create-tier operation
 *
 * @example
 * ```tsx
 * function CreateTierForm() {
 *   const mutation = useCreateTierMutation({
 *     onSuccess: (tier) => console.log('Created tier:', tier.id),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() =>
 *         mutation.mutate({
 *           publicationId: 'pub_abc',
 *           data: { name: 'Gold', type: 'premium', price_in_cents: 999, currency: 'USD' },
 *         })
 *       }
 *     >
 *       {mutation.isPending ? 'Creating...' : 'Create Tier'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateTierMutation(
  options?: UseCreateTierMutationOptions,
): UseMutationResult<Tier, Error, CreateTierMutationVariables> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<Tier, Error, CreateTierMutationVariables>({
    mutationFn: async (variables: CreateTierMutationVariables) => {
      const response = await fetch(`${apiUrl}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationId: variables.publicationId,
          ...variables.data,
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
            : `Failed to create tier (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: Tier };
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate all tier queries so lists refresh automatically
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.tiers.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

// ---------------------------------------------------------------------------
// Update tier mutation
// ---------------------------------------------------------------------------

/**
 * Variables required by the update-tier mutation.
 */
export interface UpdateTierMutationVariables {
  /** The publication ID the tier belongs to */
  publicationId: string;
  /** The tier ID to update */
  tierId: string;
  /** The fields to update */
  data: UpdateTierRequest;
}

/**
 * Options accepted by {@link useUpdateTierMutation}.
 */
export interface UseUpdateTierMutationOptions {
  /** Callback fired after a successful update */
  onSuccess?: (tier: Tier) => void;
  /** Callback fired when the update request fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating an existing tier on a beehiiv publication.
 *
 * PATCHes `{apiUrl}/tiers/{tierId}` with the provided data. On success
 * the mutation automatically invalidates all tier queries and the specific
 * tier's detail query so that views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the update-tier operation
 *
 * @example
 * ```tsx
 * function EditTier({ tierId }: { tierId: string }) {
 *   const mutation = useUpdateTierMutation({
 *     onSuccess: (tier) => console.log('Updated tier:', tier.name),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() =>
 *         mutation.mutate({
 *           publicationId: 'pub_abc',
 *           tierId,
 *           data: { name: 'Platinum' },
 *         })
 *       }
 *     >
 *       {mutation.isPending ? 'Saving...' : 'Rename Tier'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUpdateTierMutation(
  options?: UseUpdateTierMutationOptions,
): UseMutationResult<Tier, Error, UpdateTierMutationVariables> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<Tier, Error, UpdateTierMutationVariables>({
    mutationFn: async (variables: UpdateTierMutationVariables) => {
      const response = await fetch(
        `${apiUrl}/tiers/${encodeURIComponent(variables.tierId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicationId: variables.publicationId,
            ...variables.data,
          }),
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
            : `Failed to update tier (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: Tier };
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all tier queries so lists refresh automatically
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.tiers.all,
      });
      // Also invalidate the specific tier detail query
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.tiers.detail(variables.tierId, {
          publicationId: variables.publicationId,
        }),
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
