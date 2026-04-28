/**
 * Server-side factory for creating a pre-configured BeehiivClient.
 *
 * Designed for React Server Components (RSC) and other Node.js server
 * environments where environment variables are available at runtime.
 * Reads `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` from `process.env`
 * and merges them with any explicitly passed options.
 *
 * @module server/client
 */

import { BeehiivClient } from '../client/index.js';
import type { BeehiivApiConfig } from '../types/common.js';

/**
 * Create a pre-configured {@link BeehiivClient} using environment variables.
 *
 * Reads the following environment variables:
 * - `BEEHIIV_API_KEY` — **required** unless provided via `options.apiKey`
 * - `BEEHIIV_PUBLICATION_ID` — optional, used as the default publication ID
 *
 * Explicitly passed `options` take priority over environment variables,
 * allowing per-call overrides when needed.
 *
 * @param options - Optional partial config that overrides env-var defaults
 * @returns A fully initialised {@link BeehiivClient} ready for API calls
 *
 * @throws {Error} If neither `options.apiKey` nor `BEEHIIV_API_KEY` is set
 *
 * @example
 * ```ts
 * // Minimal — reads everything from env vars
 * const client = createBeehiivClient();
 *
 * // Override the publication ID for a specific call
 * const client = createBeehiivClient({ publicationId: 'pub_other' });
 *
 * // Provide the API key explicitly (e.g. in tests)
 * const client = createBeehiivClient({ apiKey: 'test-key' });
 * ```
 */
export function createBeehiivClient(
  options?: Partial<BeehiivApiConfig>,
): BeehiivClient {
  const apiKey = options?.apiKey ?? process.env.BEEHIIV_API_KEY;

  if (!apiKey) {
    throw new Error(
      'beehiiv API key is required. Set the BEEHIIV_API_KEY environment variable ' +
        'or pass `apiKey` in the options object to createBeehiivClient().',
    );
  }

  const publicationId =
    options?.publicationId ?? process.env.BEEHIIV_PUBLICATION_ID;

  const config: BeehiivApiConfig = {
    ...options,
    apiKey,
    ...(publicationId ? { publicationId } : {}),
  };

  return new BeehiivClient(config);
}
