/**
 * TanStack Query hooks for beehiiv referral program resources.
 *
 * Provides a `useQuery` hook for fetching the referral program
 * configuration from a publication.
 *
 * @module query/referrals
 */

import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/beehiiv-context.js';
import type { ReferralProgram } from '../types/referral.js';
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
// Referral program query
// ---------------------------------------------------------------------------

/** Options for {@link useReferralsQuery}. */
export interface UseReferralsQueryOptions {
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

/** Response shape returned by the referral program endpoint. */
interface ReferralProgramResponse {
  data: ReferralProgram;
}

/**
 * Fetch the referral program configuration via TanStack Query.
 *
 * Uses the `{apiUrl}/referral-program` endpoint and caches results under
 * {@link beehiivKeys.referrals.program}.
 *
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the referral program response
 *
 * @example
 * ```tsx
 * function ReferralInfo() {
 *   const { data, isLoading } = useReferralsQuery();
 *   if (isLoading) return <p>Loading...</p>;
 *   return <p>Program: {data?.data.enabled ? 'Active' : 'Inactive'}</p>;
 * }
 * ```
 */
export function useReferralsQuery(
  options: UseReferralsQueryOptions = {},
): UseQueryResult<ReferralProgramResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  return useQuery<ReferralProgramResponse>({
    queryKey: beehiivKeys.referrals.program({
      publicationId: resolvedPublicationId,
    }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<ReferralProgramResponse>(
        `${apiUrl}/referral-program${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}
