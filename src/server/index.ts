/**
 * Server-side utilities for beehiiv-react.
 *
 * This sub-path export (`beehiiv-react/server`) provides React Server
 * Component (RSC) compatible helpers: a factory function for creating a
 * pre-configured {@link BeehiivClient} from environment variables, and
 * pure async data-fetching functions that return unwrapped API data.
 *
 * @packageDocumentation
 */

export { createBeehiivClient } from './client.js';

export {
  fetchPosts,
  fetchPost,
  fetchSubscribers,
  fetchSubscription,
  fetchPublications,
  fetchCustomFields,
  fetchWebhooks,
  fetchSegments,
} from './fetchers.js';
