/**
 * TanStack Query hooks for beehiiv API resources.
 *
 * Each hook wraps a standard `fetch()` call inside `useQuery` from
 * `@tanstack/react-query`, using the key factory from `./keys.ts`
 * for cache keys. Context values (`apiUrl`, `publicationId`) are read
 * from the nearest `<BeehiivProvider>` via the exported context object,
 * keeping this module free of imports from `src/hooks/`.
 *
 * @module query/hooks
 */

import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/beehiiv-context.js';
import type { PostInfo, PostAudience, PostStatus } from '../types/post.js';
import type { SubscriptionInfo } from '../types/subscription.js';
import type { CustomFieldInfo } from '../types/custom-field.js';
import type { PublicationInfo } from '../types/publication.js';
import { beehiivKeys } from './keys.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read the beehiiv context, throwing if the provider is missing.
 *
 * This mirrors the behaviour of `useBeehiiv()` in `src/hooks/` without
 * importing from that module — avoids potential circular dependencies.
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
// Posts
// ---------------------------------------------------------------------------

/** Filter / pagination options for {@link usePostsQuery}. */
export interface UsePostsQueryOptions {
  /** Override the publication ID from the provider context */
  publicationId?: string;
  /** Filter posts by their publication status */
  status?: PostStatus;
  /** Filter posts by their intended audience */
  audience?: PostAudience;
  /** Maximum number of results to return per page */
  limit?: number;
  /**
   * Fields to expand in the response (e.g. ['free_web_content']).
   * When included, the beehiiv API returns the full post content
   * alongside the standard list fields.
   */
  expand?: string[];
  /**
   * Stale time in milliseconds before a background re-fetch is triggered.
   * @defaultValue 60_000 (1 minute)
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the posts list endpoint. */
interface PostsListResponse {
  data: PostInfo[];
  pagination: { next_cursor: string | null; has_more: boolean };
}

/**
 * Fetch a paginated list of posts via TanStack Query.
 *
 * Uses the `{apiUrl}/posts` endpoint exposed by the beehiiv API proxy
 * and caches results under {@link beehiivKeys.posts.list}.
 *
 * @param options - Optional filter, pagination, and query configuration
 * @returns A standard `UseQueryResult` containing the posts list response
 *
 * @example
 * ```tsx
 * function PostFeed() {
 *   const { data, isLoading } = usePostsQuery({ status: 'confirmed', limit: 10 });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
 * }
 * ```
 */
export function usePostsQuery(
  options: UsePostsQueryOptions = {},
): UseQueryResult<PostsListResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const {
    publicationId,
    status,
    audience,
    limit,
    expand,
    staleTime = 60_000,
    enabled = true,
  } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  const keyOptions = {
    publicationId: resolvedPublicationId,
    ...(status ? { status } : {}),
    ...(audience ? { audience } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(expand && expand.length > 0 ? { expand } : {}),
  };

  return useQuery<PostsListResponse>({
    queryKey: beehiivKeys.posts.list(keyOptions),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      if (status) params.set('status', status);
      if (audience) params.set('audience', audience);
      if (limit !== undefined) params.set('limit', String(limit));
      if (expand) {
        for (const field of expand) {
          params.append('expand[]', field);
        }
      }
      const query = params.toString();
      return fetchJson<PostsListResponse>(
        `${apiUrl}/posts${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Single post
// ---------------------------------------------------------------------------

/** Options for {@link usePostQuery}. */
export interface UsePostQueryOptions {
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

/** Response shape returned by the single-post endpoint. */
interface PostDetailResponse {
  data: PostInfo;
}

/**
 * Fetch a single post by its ID via TanStack Query.
 *
 * Uses the `{apiUrl}/posts/{id}` endpoint and caches results under
 * {@link beehiivKeys.posts.detail}.
 *
 * @param id - The post identifier (starts with "post_")
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the single-post response
 *
 * @example
 * ```tsx
 * function PostDetail({ postId }: { postId: string }) {
 *   const { data, isLoading } = usePostQuery(postId);
 *   if (isLoading) return <p>Loading...</p>;
 *   return <h1>{data?.data.title}</h1>;
 * }
 * ```
 */
export function usePostQuery(
  id: string,
  options: UsePostQueryOptions = {},
): UseQueryResult<PostDetailResponse> {
  const { apiUrl, publicationId: contextPublicationId } = useBeehiivContext();
  const { publicationId, staleTime = 60_000, enabled = true } = options;
  const resolvedPublicationId = publicationId ?? contextPublicationId;

  return useQuery<PostDetailResponse>({
    queryKey: beehiivKeys.posts.detail(id, {
      publicationId: resolvedPublicationId,
    }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (publicationId) params.set('publicationId', publicationId);
      const query = params.toString();
      return fetchJson<PostDetailResponse>(
        `${apiUrl}/posts/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled: enabled && !!id,
  });
}

// ---------------------------------------------------------------------------
// Subscribers
// ---------------------------------------------------------------------------

/** Filter / pagination options for {@link useSubscribersQuery}. */
export interface UseSubscribersQueryOptions {
  /** Filter by subscriber email */
  email?: string;
  /** Filter by subscriber status */
  status?: string;
  /** Maximum number of results to return per page */
  limit?: number;
  /**
   * Stale time in milliseconds.
   * @defaultValue 60_000
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the subscribers list endpoint. */
interface SubscribersListResponse {
  data: SubscriptionInfo[];
  pagination: { next_cursor: string | null; has_more: boolean };
}

/**
 * Fetch a paginated list of subscribers via TanStack Query.
 *
 * Uses the `{apiUrl}/subscribers` endpoint and caches results under
 * {@link beehiivKeys.subscribers.list}.
 *
 * @param options - Optional filter, pagination, and query configuration
 * @returns A standard `UseQueryResult` containing the subscribers list response
 *
 * @example
 * ```tsx
 * function SubscriberList() {
 *   const { data, isLoading } = useSubscribersQuery({ limit: 20 });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <ul>{data?.data.map(s => <li key={s.id}>{s.email}</li>)}</ul>;
 * }
 * ```
 */
export function useSubscribersQuery(
  options: UseSubscribersQueryOptions = {},
): UseQueryResult<SubscribersListResponse> {
  const { apiUrl, publicationId } = useBeehiivContext();
  const { email, status, limit, staleTime = 60_000, enabled = true } = options;

  const keyOptions = {
    publicationId,
    ...(email ? { email } : {}),
    ...(status ? { status } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };

  return useQuery<SubscribersListResponse>({
    queryKey: beehiivKeys.subscribers.list(keyOptions),
    queryFn: () => {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (status) params.set('status', status);
      if (limit !== undefined) params.set('limit', String(limit));
      const query = params.toString();
      return fetchJson<SubscribersListResponse>(
        `${apiUrl}/subscribers${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Subscription (single look-up)
// ---------------------------------------------------------------------------

/** Options for {@link useSubscriptionQuery}. */
export interface UseSubscriptionQueryOptions {
  /**
   * Stale time in milliseconds.
   * @defaultValue 60_000
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the subscription endpoint. */
interface SubscriptionDetailResponse {
  data: SubscriptionInfo | null;
}

/**
 * Fetch a single subscription by email or ID via TanStack Query.
 *
 * If `emailOrId` looks like a subscription ID (starts with "sub_") the
 * request targets `{apiUrl}/subscription/{id}`, otherwise it is treated
 * as an email and sent as a query parameter.
 *
 * Caches results under {@link beehiivKeys.subscriptions.detail}.
 *
 * @param emailOrId - The subscriber email address or subscription ID
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the subscription response
 *
 * @example
 * ```tsx
 * function Profile({ email }: { email: string }) {
 *   const { data } = useSubscriptionQuery(email);
 *   return <p>Status: {data?.data?.status}</p>;
 * }
 * ```
 */
export function useSubscriptionQuery(
  emailOrId: string,
  options: UseSubscriptionQueryOptions = {},
): UseQueryResult<SubscriptionDetailResponse> {
  const { apiUrl, publicationId } = useBeehiivContext();
  const { staleTime = 60_000, enabled = true } = options;

  return useQuery<SubscriptionDetailResponse>({
    queryKey: beehiivKeys.subscriptions.detail(emailOrId, { publicationId }),
    queryFn: () => {
      const isId = emailOrId.startsWith('sub_');
      const url = isId
        ? `${apiUrl}/subscription/${encodeURIComponent(emailOrId)}`
        : `${apiUrl}/subscription?email=${encodeURIComponent(emailOrId)}`;
      return fetchJson<SubscriptionDetailResponse>(url);
    },
    staleTime,
    enabled: enabled && !!emailOrId,
  });
}

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

/** Options for {@link useCustomFieldsQuery}. */
export interface UseCustomFieldsQueryOptions {
  /**
   * Stale time in milliseconds.
   * @defaultValue 60_000
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the custom-fields endpoint. */
interface CustomFieldsListResponse {
  data: CustomFieldInfo[];
}

/**
 * Fetch the custom field definitions for the current publication via
 * TanStack Query.
 *
 * Uses the `{apiUrl}/custom-fields` endpoint and caches results under
 * {@link beehiivKeys.customFields.list}.
 *
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the custom-fields response
 *
 * @example
 * ```tsx
 * function FieldList() {
 *   const { data } = useCustomFieldsQuery();
 *   return <ul>{data?.data.map(f => <li key={f.id}>{f.display}</li>)}</ul>;
 * }
 * ```
 */
export function useCustomFieldsQuery(
  options: UseCustomFieldsQueryOptions = {},
): UseQueryResult<CustomFieldsListResponse> {
  const { apiUrl, publicationId } = useBeehiivContext();
  const { staleTime = 60_000, enabled = true } = options;

  return useQuery<CustomFieldsListResponse>({
    queryKey: beehiivKeys.customFields.list({ publicationId }),
    queryFn: () =>
      fetchJson<CustomFieldsListResponse>(`${apiUrl}/custom-fields`),
    staleTime,
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------

/** Options for {@link usePublicationsQuery}. */
export interface UsePublicationsQueryOptions {
  /** Expandable fields to include (e.g. "stats") */
  expand?: string[];
  /**
   * Stale time in milliseconds.
   * @defaultValue 60_000
   */
  staleTime?: number;
  /** Whether the query should execute automatically. @defaultValue true */
  enabled?: boolean;
}

/** Response shape returned by the publications endpoint. */
interface PublicationsListResponse {
  data: PublicationInfo[];
}

/**
 * Fetch the list of publications accessible to the current API key via
 * TanStack Query.
 *
 * Uses the `{apiUrl}/publications` endpoint and caches results under
 * {@link beehiivKeys.publications.list}.
 *
 * @param options - Optional query configuration
 * @returns A standard `UseQueryResult` containing the publications response
 *
 * @example
 * ```tsx
 * function PubList() {
 *   const { data } = usePublicationsQuery({ expand: ['stats'] });
 *   return <ul>{data?.data.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
 * }
 * ```
 */
export function usePublicationsQuery(
  options: UsePublicationsQueryOptions = {},
): UseQueryResult<PublicationsListResponse> {
  const { apiUrl } = useBeehiivContext();
  const { expand, staleTime = 60_000, enabled = true } = options;

  const keyOptions = {
    ...(expand && expand.length > 0 ? { expand } : {}),
  };

  return useQuery<PublicationsListResponse>({
    queryKey: beehiivKeys.publications.list(keyOptions),
    queryFn: () => {
      const params = new URLSearchParams();
      if (expand) {
        expand.forEach((e) => params.append('expand', e));
      }
      const query = params.toString();
      return fetchJson<PublicationsListResponse>(
        `${apiUrl}/publications${query ? `?${query}` : ''}`,
      );
    },
    staleTime,
    enabled,
  });
}
