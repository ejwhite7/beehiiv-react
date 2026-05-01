/**
 * Server-side data-fetching function for beehiiv engagement metrics.
 *
 * A plain async function safe to call from React Server Components,
 * Route Handlers, Server Actions, or any Node.js server context.
 *
 * @module server/engagements
 */

import type { BeehiivClient } from '../client/index.js';
import type { EngagementMetrics } from '../types/engagement.js';
import type { GetEngagementsParams } from '../client/endpoints/engagements.js';

/**
 * Fetch engagement metrics for a publication within a date range.
 *
 * Calls {@link BeehiivClient.engagements.get} and returns the unwrapped
 * `data` array, discarding the response envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param params - Query parameters including start_date, end_date, and optional expand
 * @returns An array of {@link EngagementMetrics} objects
 *
 * @example
 * ```ts
 * const metrics = await fetchEngagements(client, 'pub_abc', {
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-31',
 * });
 * ```
 */
export async function fetchEngagements(
  client: BeehiivClient,
  publicationId: string,
  params: GetEngagementsParams,
): Promise<EngagementMetrics[]> {
  const response = await client.engagements.get(publicationId, params);
  return response.data ?? [];
}
