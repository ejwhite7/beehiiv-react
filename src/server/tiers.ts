/**
 * Pure async data-fetching functions for tiers in React Server Components (RSC).
 *
 * Every function in this module is a plain async function — no React hooks,
 * no `useState`, no `useEffect`. They are safe to call directly inside
 * Server Components, Route Handlers, Server Actions, or any Node.js context.
 *
 * Each function accepts a {@link BeehiivClient} as its first argument and
 * returns **unwrapped** data (the inner `data` array / object from the API
 * response envelope) so consumers never have to drill into `{ data: ... }`.
 *
 * @module server/tiers
 */

import type { BeehiivClient } from '../client/index.js';
import type { Tier } from '../types/tier.js';
import type { ListTiersOptions } from '../client/endpoints/tiers.js';

/**
 * Fetch a paginated list of tiers for a publication.
 *
 * Calls {@link BeehiivClient.tiers.list} and returns the unwrapped `data`
 * array, discarding the pagination envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param options - Optional filtering / pagination parameters
 * @returns An array of {@link Tier} objects
 *
 * @example
 * ```ts
 * const tiers = await fetchTiers(client, 'pub_abc', { type: 'premium' });
 * ```
 */
export async function fetchTiers(
  client: BeehiivClient,
  publicationId: string,
  options?: ListTiersOptions,
): Promise<Tier[]> {
  const response = await client.tiers.list(publicationId, options);
  return response.data ?? [];
}

/**
 * Fetch a single tier by its ID.
 *
 * Calls {@link BeehiivClient.tiers.get} and returns the unwrapped `data`
 * object from the API response envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param tierId - The tier ID (starts with `"tier_"`)
 * @returns The {@link Tier} for the requested tier
 *
 * @example
 * ```ts
 * const tier = await fetchTier(client, 'pub_abc', 'tier_123');
 * ```
 */
export async function fetchTier(
  client: BeehiivClient,
  publicationId: string,
  tierId: string,
): Promise<Tier> {
  const response = await client.tiers.get(publicationId, tierId);
  return response.data;
}
