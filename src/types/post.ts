/**
 * Post types for the beehiiv API v2.
 * Posts represent newsletter content (emails, web posts).
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/post
 */

import type { OffsetPaginationMeta } from './common.js';
import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * The publication status of a post.
 * Re-exported from the generated beehiiv API spec (`PostStatus`).
 */
export type PostStatus = components['schemas']['PostStatus'];

/**
 * The intended audience for a post.
 *
 * The upstream API spec defines `PostAudience` as `"free" | "premium" | "both"`.
 * This SDK also accepts `"all"` as a convenience alias for `"both"` in access-
 * resolution utilities (e.g. {@link canViewContent}). The API itself never
 * returns `"all"`, but the SDK uses it as a safe fallback default.
 */
export type PostAudience = components['schemas']['PostAudience'] | 'all';

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes that differ from raw API)
// ---------------------------------------------------------------------------

/**
 * Content tier containing RSS and web HTML strings.
 *
 * The beehiiv API returns post content nested under audience tiers
 * (e.g. `free`, `premium`). Each tier contains an `rss` field (the
 * content as sent in the RSS feed / email) and a `web` field (the
 * content as rendered on the web post page).
 */
export interface PostContentTier {
  /** The content as rendered in the RSS feed / email */
  rss: string;
  /** The content as rendered on the web post page */
  web: string;
}

/**
 * Post content as returned by the beehiiv API.
 *
 * The actual wire format nests content under audience tiers:
 * - `free` — content visible to free subscribers
 * - `premium` — content visible only to premium subscribers (optional)
 *
 * This replaces the old `{ format: string; html: string }` shape which
 * did not match the actual API response.
 *
 * @example
 * ```ts
 * // Accessing post content:
 * const html = post.content?.free.web;
 * const rssContent = post.content?.free.rss;
 * ```
 */
export interface PostContent {
  /** Content available to free subscribers */
  free: PostContentTier;
  /** Content available only to premium subscribers */
  premium?: PostContentTier;
}

/** Engagement statistics for a post */
export interface PostStats {
  /** Total number of recipients the post was sent to */
  recipients: number;
  /** Number of email opens */
  opens: number;
  /** Number of unique email opens */
  unique_opens: number;
  /** Number of link clicks */
  clicks: number;
  /** Number of unique link clicks */
  unique_clicks: number;
  /** Open rate as a decimal (0-1) */
  open_rate: number;
  /** Click rate as a decimal (0-1) */
  click_rate: number;
  /** Number of unsubscribes triggered by this post */
  unsubscribes: number;
  /** Number of spam reports triggered by this post */
  spam_reports: number;
}

/** A beehiiv post */
export interface PostInfo {
  /** Unique post ID (starts with "post_") */
  id: string;
  /** The publication this post belongs to */
  publication_id: string;
  /** The title of the post */
  title: string;
  /** The subtitle/preview text of the post */
  subtitle?: string;
  /** The URL slug for the web version */
  slug?: string;
  /** The current status of the post */
  status: PostStatus;
  /** The intended audience for the post */
  audience: PostAudience;
  /** Whether beehiiv requires subscriber access for the free web content. */
  enforce_gated_content?: boolean;
  /** The web URL of the post */
  web_url?: string;
  /** The thumbnail/preview image URL */
  thumbnail_url?: string;
  /** Post engagement statistics */
  stats?: PostStats;
  /** Unix timestamp when the post was created */
  created_at: number;
  /** Unix timestamp when the post was published/sent */
  publish_date?: number;
  /** Unix timestamp when the post was last updated */
  updated_at?: number;
  /**
   * Content of the post, or `null` if not expanded.
   *
   * The beehiiv API only returns content when the `expand[]` query
   * parameter includes the appropriate content field (e.g.
   * `free_web_content`). Without expansion this field will be `null`.
   */
  content?: PostContent | null;
  /**
   * Tags associated with the post, or `undefined` if not expanded.
   *
   * The beehiiv API returns tags as an array of tag name strings when
   * the `expand[]` query parameter includes `"tags"`. Without expansion
   * this field is omitted from the response.
   */
  tags?: string[];
}

/** Request body for creating a new post */
export interface CreatePostRequest {
  /** The title of the post */
  title: string;
  /** The subtitle/preview text */
  subtitle?: string;
  /** The intended audience */
  audience?: PostAudience;
  /** The post status */
  status?: PostStatus;
  /** HTML content of the post */
  content_html?: string;
}

/** Request body for updating an existing post */
export interface UpdatePostRequest {
  /** Updated title */
  title?: string;
  /** Updated subtitle */
  subtitle?: string;
  /** Updated audience */
  audience?: PostAudience;
  /** Updated status */
  status?: PostStatus;
  /** Updated HTML content */
  content_html?: string;
}

/** Response wrapper for a single post */
export interface PostResponse {
  /** The post data */
  data: PostInfo;
}

/** Response wrapper for listing posts */
export interface PostListResponse {
  /** Array of post records */
  data: PostInfo[];
  /** Page-based pagination metadata */
  pagination: OffsetPaginationMeta;
}

/** Aggregate statistics for posts on a publication */
export interface PostAggregateStats {
  /** Total number of posts matching the filter criteria */
  total_posts: number;
  /** Total number of recipients across all matching posts */
  total_recipients: number;
  /** Total number of email opens across all matching posts */
  total_opens: number;
  /** Total number of unique email opens across all matching posts */
  total_unique_opens: number;
  /** Total number of link clicks across all matching posts */
  total_clicks: number;
  /** Total number of unique link clicks across all matching posts */
  total_unique_clicks: number;
  /** Average open rate across all matching posts (decimal 0-1) */
  average_open_rate: number;
  /** Average click rate across all matching posts (decimal 0-1) */
  average_click_rate: number;
  /** Total number of unsubscribes triggered by matching posts */
  total_unsubscribes: number;
  /** Total number of spam reports triggered by matching posts */
  total_spam_reports: number;
}

/** Response wrapper for aggregate post statistics */
export interface PostAggregateStatsResponse {
  /** The aggregate statistics data */
  data: PostAggregateStats;
}
