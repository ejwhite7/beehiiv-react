/**
 * TanStack Query hooks for beehiiv engagement metrics.
 *
 * Wraps the engagements API endpoint in a `useQuery` hook with
 * cache keys from the key factory in `./keys.ts`.
 *
 * @module query/engagements
 */

import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';
import type { EngagementMetrics } from '../types/engagement.js';
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
// Engagements query
// ---------------------------------------------------------------------------

/** Options for {@link useEngagementsQuery}. */
export interface UseEngagementsQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /** Start date for the engagement data range (ISO 8601 date string) */
  start_date: string;
  /** End date for the engagement data range (ISO 8601 date string) */
  end_date: string;
  /** Optional fields to expand in the response */
  expand?: string[];
  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the engagements endpoint. */
interface EngagementsResponse {
  data: EngagementMetrics[];
  publication_id: string;
  date_range: { start_date: string; end_date: string };
}

/**
 * Fetch engagement metrics via TanStack Query.
 *
 * Uses the `{apiUrl}/engagements` endpoint and caches results under
 * {@link beehiivKeys.engagements.list}.
 *
 * @param options - Date range, filter, and query configuration
 * @returns A standard `UseQueryResult` containing the engagements response
 *
 * @example
 * ```tsx
 * function EngagementChart() {
 *   const { data, isLoading } = useEngagementsQuery({
 *     start_date: '2024-01-01',
 *     end_date: '2024-01-31',
 *   });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <pre>{JSON.stringify(data?.data, null, 2)}</pre>;
 * }
 * ```
 */
export function useEngagementsQuery(
  options: UseEngagementsQueryOptions,
): UseQueryResult<EngagementsResponse> {
  const { apiUrl } = useBeehiivContext();
  const {
    publicationId,
    start_date,
    end_date,
    expand,
    staleTime = 60_000,
    enabled = true,
  } = options;

  return useQuery<EngagementsResponse>({
    queryKey: beehiivKeys.engagements.list({ start_date, end_date }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      params.set('start_date', start_date);
      params.set('end_date', end_date);
      if (expand) {
        for (const field of expand) {
          params.append('expand[]', field);
        }
      }
      const query = params.toString();
      return fetchJson<EngagementsResponse>(
        `${apiUrl}/engagements${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}
