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
  return response.data ?? [];
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
 * @returns The {@link PostInfo} for the requested post, or `null` if the
 *   API response contains no post data
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
): Promise<PostInfo | null> {
  const response = await client.posts.get(publicationId, id, {
    expand: ['free_web_content', 'tags'],
  });
  return response.data ?? null;
}

/** Options shared by the post-list pagination helpers. */
interface ScanPostsOptions {
  /** Page size used while scanning. @defaultValue 100 */
  pageSize?: number;
  /** Hard cap on pages scanned to avoid runaway requests. @defaultValue 50 */
  maxPages?: number;
  /** Status filter applied while scanning. @defaultValue 'confirmed' */
  status?: ListPostsOptions['status'];
  /** Audience filter applied while scanning. */
  audience?: ListPostsOptions['audience'];
}

/**
 * Paginate through a publication's posts (newest first), invoking `visit`
 * for each post. Return `true` from `visit` to stop scanning early.
 *
 * This is the single source of truth for list pagination so the slug
 * lookup, slug enumeration, and full-post enumeration helpers can never
 * drift on page size, page cap, or termination conditions.
 */
async function scanPosts(
  client: BeehiivClient,
  publicationId: string,
  options: ScanPostsOptions | undefined,
  visit: (post: PostInfo) => boolean | void,
): Promise<void> {
  const pageSize = options?.pageSize ?? 100;
  const maxPages = options?.maxPages ?? 50;
  const status = options?.status ?? 'confirmed';
  const audience = options?.audience;

  for (let page = 1; page <= maxPages; page++) {
    const listOptions: ListPostsOptions = {
      page,
      limit: pageSize,
      status,
      orderBy: 'publish_date',
      direction: 'desc',
    };
    if (audience !== undefined) listOptions.audience = audience;
    const response = await client.posts.list(publicationId, listOptions);
    const items = response.data ?? [];
    for (const post of items) {
      if (visit(post) === true) return;
    }
    if (items.length < pageSize) break;
    const totalPages = response.pagination?.total_pages;
    if (totalPages != null && page >= totalPages) break;
  }
}

/**
 * Fetch a single post by its URL slug.
 *
 * The beehiiv v2 API does not expose a slug-based lookup endpoint, so this
 * helper paginates through the publication's posts (filtered to `confirmed`
 * status by default) and returns the first match. Once the post is found
 * its full content is loaded via {@link fetchPost} so callers receive an
 * expanded `content` field ready for `<PostContentRenderer>`.
 *
 * For sites with many posts this is an O(N/limit) operation. Cache the
 * result aggressively (e.g. `unstable_cache` or ISR `revalidate`) — slugs
 * are stable, so a long TTL is safe.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID (starts with `"pub_"`)
 * @param slug - The post slug as it appears in `PostInfo.slug`
 * @param options - Optional pagination tuning and status filter
 * @returns The matching {@link PostInfo} with expanded content, or `null` if none matches
 *
 * @example
 * ```ts
 * const post = await fetchPostBySlug(client, 'pub_abc', 'my-first-issue');
 * if (!post) notFound();
 * ```
 */
export async function fetchPostBySlug(
  client: BeehiivClient,
  publicationId: string,
  slug: string,
  options?: ScanPostsOptions,
): Promise<PostInfo | null> {
  let matchId: string | null = null;
  await scanPosts(client, publicationId, options, (post) => {
    if (post.slug !== slug) return false;
    matchId = post.id;
    return true;
  });
  return matchId ? fetchPost(client, publicationId, matchId) : null;
}

/**
 * Fetch every confirmed post for a publication (newest first).
 *
 * Paginates through the entire posts list and returns the full
 * {@link PostInfo} records. Useful for building sitemaps or RSS feeds that
 * must cover all published posts (not just the most recent page).
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID
 * @param options - Optional pagination tuning / status filter
 * @returns An array of {@link PostInfo} objects
 */
export async function fetchAllPosts(
  client: BeehiivClient,
  publicationId: string,
  options?: ScanPostsOptions,
): Promise<PostInfo[]> {
  const posts: PostInfo[] = [];
  await scanPosts(client, publicationId, options, (post) => {
    posts.push(post);
  });
  return posts;
}

/**
 * Fetch every post slug for a publication.
 *
 * Designed for `generateStaticParams` in `app/blog/[slug]/page.tsx`.
 * Paginates through all confirmed posts and returns their slugs.
 *
 * @param client - An initialised {@link BeehiivClient}
 * @param publicationId - The publication ID
 * @param options - Optional pagination tuning
 * @returns Array of `{ slug }` objects ready to return from `generateStaticParams`
 */
export async function fetchAllPostSlugs(
  client: BeehiivClient,
  publicationId: string,
  options?: ScanPostsOptions,
): Promise<{ slug: string }[]> {
  const slugs: { slug: string }[] = [];
  await scanPosts(client, publicationId, options, (post) => {
    if (post.slug) slugs.push({ slug: post.slug });
  });
  return slugs;
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
  return response.data ?? [];
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
 * @returns The {@link SubscriptionInfo} for the matched subscriber, or `null`
 *   if no matching subscriber is returned
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
): Promise<SubscriptionInfo | null> {
  const response = emailOrId.includes('@')
    ? await client.subscriptions.getByEmail(publicationId, emailOrId)
    : await client.subscriptions.getById(publicationId, emailOrId);
  return response.data ?? null;
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
  return response.data ?? [];
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
  return response.data ?? [];
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
  return response.data ?? [];
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
  return response.data ?? [];
}
