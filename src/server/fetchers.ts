/**
 * Pure async data-fetching functions for React Server Components (RSC).
 *
 * Every function in this module is a plain async function — no React hooks,
 * no `useState`, no `useEffect`. They are safe to call directly inside
 * Server Components, Route Handlers, Server Actions, or any Node.js context.
 *
 * Each function accepts a {@link BeehiivClient} as its first argument and
 * returns **unwrapped** data (the inner `data` array / object from the API
 * response envelope) so consumers never have to drill into `{ data: ... }`.
 *
 * @module server/fetchers
 */

import type { BeehiivClient } from '../client/index.js';
import type { PostInfo } from '../types/post.js';
import type { SubscriptionInfo } from '../types/subscription.js';
import type { PublicationInfo } from '../types/publication.js';
import type { CustomFieldInfo } from '../types/custom-field.js';
import type { ListPostsOptions } from '../client/endpoints/posts.js';
import type { ListSubscriptionsOptions } from '../client/endpoints/subscriptions.js';
import type { WebhookInfo } from '../types/webhook.js';
import type { SegmentInfo } from '../types/segment.js';

/**
 * Fetch a paginated list of posts for a publication.
 *
 * Calls {@link BeehiivClient.posts.list} and returns the unwrapped `data`
 * array, discarding the pagination envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param options - Optional filtering / pagination parameters
 * @returns An array of {@link PostInfo} objects
 *
 * @example
 * ```ts
 * const posts = await fetchPosts(client, 'pub_abc', { status: 'confirmed', limit: 10 });
 * ```
 */
export async function fetchPosts(
  client: BeehiivClient,
  publicationId: string,
  options?: ListPostsOptions,
): Promise<PostInfo[]> {
  const response = await client.posts.list(publicationId, options);
  return response.data;
}

/**
 * Fetch a single post by its ID.
 *
 * Calls {@link BeehiivClient.posts.get} with the `expand` parameter set to
 * `['free_web_content']` so the API returns the full post content. Without
 * this expand parameter the beehiiv API returns empty content fields.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param id - The post ID (starts with `"post_"`)
 * @returns The {@link PostInfo} for the requested post
 *
 * @example
 * ```ts
 * const post = await fetchPost(client, 'pub_abc', 'post_123');
 * ```
 */
export async function fetchPost(
  client: BeehiivClient,
  publicationId: string,
  id: string,
): Promise<PostInfo> {
  const response = await client.posts.get(publicationId, id, {
    expand: ['free_web_content'],
  });
  return response.data;
}

/**
 * Fetch a paginated list of subscribers for a publication.
 *
 * Calls {@link BeehiivClient.subscriptions.list} and returns the unwrapped
 * `data` array, discarding the pagination envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param options - Optional filtering / pagination parameters
 * @returns An array of {@link SubscriptionInfo} objects
 *
 * @example
 * ```ts
 * const subs = await fetchSubscribers(client, 'pub_abc', { tier: 'premium' });
 * ```
 */
export async function fetchSubscribers(
  client: BeehiivClient,
  publicationId: string,
  options?: ListSubscriptionsOptions,
): Promise<SubscriptionInfo[]> {
  const response = await client.subscriptions.list(publicationId, options);
  return response.data;
}

/**
 * Fetch a single subscription by email address or subscription ID.
 *
 * Automatically detects whether `emailOrId` is an email (contains `@`) or
 * a subscription ID, and calls the appropriate endpoint method.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param emailOrId - An email address or a subscription ID (starts with `"sub_"`)
 * @returns The {@link SubscriptionInfo} for the matched subscriber
 *
 * @example
 * ```ts
 * // By email
 * const sub = await fetchSubscription(client, 'pub_abc', 'user@example.com');
 *
 * // By ID
 * const sub = await fetchSubscription(client, 'pub_abc', 'sub_xyz');
 * ```
 */
export async function fetchSubscription(
  client: BeehiivClient,
  publicationId: string,
  emailOrId: string,
): Promise<SubscriptionInfo> {
  const response = emailOrId.includes('@')
    ? await client.subscriptions.getByEmail(publicationId, emailOrId)
    : await client.subscriptions.getById(publicationId, emailOrId);
  return response.data;
}

/**
 * Fetch all publications accessible with the current API key.
 *
 * Calls {@link BeehiivClient.publications.list} and returns the unwrapped
 * `data` array. No `publicationId` argument is required because the
 * publications endpoint is account-scoped, not publication-scoped.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @returns An array of {@link PublicationInfo} objects
 *
 * @example
 * ```ts
 * const pubs = await fetchPublications(client);
 * ```
 */
export async function fetchPublications(
  client: BeehiivClient,
): Promise<PublicationInfo[]> {
  const response = await client.publications.list();
  return response.data;
}

/**
 * Fetch all custom field definitions for a publication.
 *
 * Calls {@link BeehiivClient.customFields.list} and returns the unwrapped
 * `data` array, discarding the pagination envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @returns An array of {@link CustomFieldInfo} objects
 *
 * @example
 * ```ts
 * const fields = await fetchCustomFields(client, 'pub_abc');
 * ```
 */
export async function fetchCustomFields(
  client: BeehiivClient,
  publicationId: string,
): Promise<CustomFieldInfo[]> {
  const response = await client.customFields.list(publicationId);
  return response.data;
}

/**
 * Fetch all webhooks for a publication.
 *
 * Calls {@link BeehiivClient.webhooks.list} and returns the unwrapped `data`
 * array from the API response envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @returns An array of {@link WebhookInfo} objects
 *
 * @example
 * ```ts
 * const hooks = await fetchWebhooks(client, 'pub_abc');
 * ```
 */
export async function fetchWebhooks(
  client: BeehiivClient,
  publicationId: string,
): Promise<WebhookInfo[]> {
  const response = await client.webhooks.list(publicationId);
  return response.data;
}

/**
 * Fetch all segments for a publication.
 *
 * Calls {@link BeehiivClient.segments.list} and returns the unwrapped `data`
 * array, discarding the pagination envelope.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @returns An array of {@link SegmentInfo} objects
 *
 * @example
 * ```ts
 * const segments = await fetchSegments(client, 'pub_abc');
 * ```
 */
export async function fetchSegments(
  client: BeehiivClient,
  publicationId: string,
): Promise<SegmentInfo[]> {
  const response = await client.segments.list(publicationId);
  return response.data;
}
