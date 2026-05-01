/**
 * TanStack Query hooks for beehiiv automation resources.
 *
 * Provides `useQuery` hooks for listing and retrieving automations,
 * and a `useMutation` hook for creating automation journeys.
 *
 * @module query/automations
 */

import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type { AutomationInfo } from '../types/automation.js';
import type { AutomationJourneyInfo, CreateAutomationJourneyRequest } from '../types/automation-journey.js';
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
// Automations list query
// ---------------------------------------------------------------------------

/** Options for {@link useAutomationsQuery}. */
export interface UseAutomationsQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /** Filter automations by status */
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

/** Response shape returned by the automations list endpoint. */
interface AutomationsListResponse {
  data: AutomationInfo[];
  pagination: { next_cursor: string | null; has_more: boolean };
}

/**
 * Fetch a paginated list of automations via TanStack Query.
 *
 * Uses the `{apiUrl}/automations` endpoint and caches results under
 * {@link beehiivKeys.automations.list}.
 *
 * @param options - Optional filter, pagination, and query configuration
 * @returns A standard `UseQueryResult` containing the automations list response
 *
 * @example
 * ```tsx
 * function AutomationList() {
 *   const { data, isLoading } = useAutomationsQuery({ status: 'active' });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(a => <li key={a.id}>{a.name}</li>)}</ul>;
 * }
 * ```
 */
export function useAutomationsQuery(
  options: UseAutomationsQueryOptions = {},
): UseQueryResult<AutomationsListResponse> {
  const { apiUrl } = useBeehiivContext();
  const {
    publicationId,
    status,
    limit,
    staleTime = 60_000,
    enabled = true,
  } = options;

  const keyOptions = {
    ...(status ? { status } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };

  return useQuery<AutomationsListResponse>({
    queryKey: beehiivKeys.automations.list(keyOptions),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      if (status) params.set('status', status);
      if (limit !== undefined) params.set('limit', String(limit));
      const query = params.toString();
      return fetchJson<AutomationsListResponse>(
        `${apiUrl}/automations${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Single automation query
// ---------------------------------------------------------------------------

/** Options for {@link useAutomationQuery}. */
export interface UseAutomationQueryOptions {
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

/** Response shape returned by the single automation endpoint. */
interface AutomationDetailResponse {
  data: AutomationInfo;
}

/**
 * Fetch a single automation by its ID via TanStack Query.
 *
 * Uses the `{apiUrl}/automations/{id}` endpoint and caches results under
 * {@link beehiivKeys.automations.detail}.
 *
 * @param id - The automation identifier (starts with "aut_")
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the automation response
 *
 * @example
 * ```tsx
 * function AutomationDetail({ automationId }: { automationId: string }) {
 *   const { data, isLoading } = useAutomationQuery(automationId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <h1>{data?.data.name}</h1>;
 * }
 * ```
 */
export function useAutomationQuery(
  id: string,
  options: UseAutomationQueryOptions = {},
): UseQueryResult<AutomationDetailResponse> {
  const { apiUrl } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;

  return useQuery<AutomationDetailResponse>({
    queryKey: beehiivKeys.automations.detail(id),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<AutomationDetailResponse>(
        `${apiUrl}/automations/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!id,
  });
}

// ---------------------------------------------------------------------------
// Create automation journey mutation
// ---------------------------------------------------------------------------

/** Options for {@link useCreateAutomationJourneyMutation}. */
export interface UseCreateAutomationJourneyMutationOptions {
  /** Callback fired after a successful journey creation */
  onSuccess?: (journey: AutomationJourneyInfo) => void;
  /** Callback fired when the journey creation fails */
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating an automation journey (enrolling a subscriber
 * in an automation).
 *
 * POSTs to `{apiUrl}/automation-journeys` with the provided data. On success
 * the mutation automatically invalidates all automation queries so that
 * related views stay up-to-date.
 *
 * @param options - Optional `onSuccess` and `onError` callbacks
 * @returns A standard `UseMutationResult` for the create-journey operation
 *
 * @example
 * ```tsx
 * function EnrollButton({ automationId, subscriptionId }: Props) {
 *   const mutation = useCreateAutomationJourneyMutation({
 *     onSuccess: (j) => console.log('Enrolled:', j.id),
 *   });
 *
 *   return (
 *     <button
 *       disabled={mutation.isPending}
 *       onClick={() => mutation.mutate({ automationId, subscriptionId })}
 *     >
 *       {mutation.isPending ? 'Enrolling...' : 'Enroll'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateAutomationJourneyMutation(
  options?: UseCreateAutomationJourneyMutationOptions,
): UseMutationResult<AutomationJourneyInfo, Error, CreateAutomationJourneyRequest> {
  const { apiUrl } = useBeehiivContext();
  const queryClient = useQueryClient();

  return useMutation<AutomationJourneyInfo, Error, CreateAutomationJourneyRequest>({
    mutationFn: async (variables: CreateAutomationJourneyRequest) => {
      const response = await fetch(`${apiUrl}/automation-journeys`, {
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
            : `Failed to create automation journey (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: AutomationJourneyInfo };
      return result.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: beehiivKeys.automations.all,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
