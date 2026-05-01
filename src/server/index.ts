/**
 * Server-side utilities for beehiiv-react.
 *
 * This sub-path export (`beehiiv-react/server`) provides modules that are
 * safe to use in React Server Components (RSC), API Route Handlers, Server
 * Actions, and any other Node.js server context.
 *
 * **No "use client" directive is applied to this entry point.** This is
 * intentional — everything exported here is designed for server-side
 * execution where direct access to environment variables and the beehiiv
 * API key is available.
 *
 * For client-side React components and hooks, import from the package
 * root instead:
 *
 * ```ts
 * import { SubscriptionForm, useSubscribe } from 'beehiiv-react';
 * ```
 *
 * @packageDocumentation
 */

// --- BeehiivClient ---
// The core API client class for making authenticated requests to the
// beehiiv API. Re-exported here so server code can import it without
// pulling in the client-side "use client" entry point.
export { BeehiivClient } from '../client/index.js';

// --- Endpoint Classes ---
// Standalone endpoint classes for advanced usage patterns where consumers
// need direct access to a specific API namespace (e.g. custom HTTP client
// wrappers, testing, or building higher-level abstractions).
export { WebhooksEndpoint } from '../client/endpoints/webhooks.js';
export { SegmentsEndpoint } from '../client/endpoints/segments.js';
export { AutomationsEndpoint } from '../client/endpoints/automations.js';
export { ReferralsEndpoint } from '../client/endpoints/referrals.js';

// --- Server Helpers ---
// Factory function that reads BEEHIIV_API_KEY from process.env and returns
// a fully configured BeehiivClient instance.
export { createBeehiivClient } from './client.js';

// --- Data Fetchers ---
// Pure async functions that accept a BeehiivClient and return unwrapped
// API data. No React hooks, no client-side state — safe for direct use
// inside Server Components, Route Handlers, and Server Actions.
export {
  fetchPosts,
  fetchPost,
  fetchPostBySlug,
  fetchAllPostSlugs,
  fetchSubscribers,
  fetchSubscription,
  fetchPublications,
  fetchCustomFields,
  fetchWebhooks,
  fetchSegments,
} from './fetchers.js';

// --- Metadata helpers ---
export { generatePostMetadata } from './metadata.js';
export type { PostMetadata } from './metadata.js';

// --- New Endpoint Classes ---
export { TiersEndpoint } from '../client/endpoints/tiers.js';
export { AuthorsEndpoint } from '../client/endpoints/authors.js';
export { BulkSubscriptionsEndpoint } from '../client/endpoints/bulkSubscriptions.js';
export { BulkSubscriptionUpdatesEndpoint } from '../client/endpoints/bulkSubscriptionUpdates.js';
export { EngagementsEndpoint } from '../client/endpoints/engagements.js';

// --- New Data Fetchers ---
export {
  fetchTiers,
  fetchTier,
} from './tiers.js';

export {
  fetchAuthors,
  fetchAuthor,
} from './authors.js';

export {
  fetchEngagements,
} from './engagements.js';
