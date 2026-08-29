/**
 * Server-side factory for creating a pre-configured BeehiivClient.
 *
 * Designed for React Server Components (RSC) and other Node.js server
 * environments where environment variables are available at runtime.
 * Reads API-key or OAuth credentials and `BEEHIIV_PUBLICATION_ID` from
 * `process.env`, then merges them with any explicitly passed options.
 *
 * @module server/client
 */

import { BeehiivClient } from '../client/index.js';
import type { BeehiivApiConfig } from '../types/common.js';

/**
 * Create a pre-configured {@link BeehiivClient} using environment variables.
 *
 * Reads the following environment variables:
 * - `BEEHIIV_API_KEY` — preferred long-lived server credential
 * - `BEEHIIV_ACCESS_TOKEN` — OAuth access token fallback
 * - `BEEHIIV_PUBLICATION_ID` — optional, used as the default publication ID
 *
 * Explicitly passed `options` take priority over environment variables,
 * allowing per-call overrides when needed.
 *
 * @param options - Optional partial config that overrides env-var defaults
 * @returns A fully initialised {@link BeehiivClient} ready for API calls
 *
 * @throws {Error} If no supported credential is configured
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
  const apiKey = resolveBeehiivAuthToken(options?.apiKey);

  const publicationId =
    options?.publicationId ?? process.env.BEEHIIV_PUBLICATION_ID;

  const config: BeehiivApiConfig = {
    ...options,
    apiKey,
    ...(publicationId ? { publicationId } : {}),
  };

  return new BeehiivClient(config);
}

/**
 * Resolve the bearer credential shared by generated server code.
 *
 * Explicit credentials take priority, followed by the existing API-key
 * variable for backward compatibility, then the OAuth access token written
 * by `beehiiv-react init --oauth`.
 *
 * @param explicitCredential - Optional credential supplied by the caller
 * @returns A bearer credential suitable for the beehiiv API client
 * @throws {Error} If no supported credential is configured
 */
export function resolveBeehiivAuthToken(explicitCredential?: string): string {
  const credential =
    explicitCredential ??
    process.env.BEEHIIV_API_KEY ??
    process.env.BEEHIIV_ACCESS_TOKEN;

  if (!credential) {
    throw new Error(
      'beehiiv credential is required. Set BEEHIIV_API_KEY or ' +
        'BEEHIIV_ACCESS_TOKEN, or pass `apiKey` to createBeehiivClient().',
    );
  }

  return credential;
}
