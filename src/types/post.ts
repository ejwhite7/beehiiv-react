/**
 * Post types for the beehiiv API v2.
 * Posts represent newsletter content (emails, web posts).
 * @module types/post
 */

import type { CursorPaginationMeta } from './common.js';

/** The publication status of a post */
export type PostStatus = 'draft' | 'confirmed' | 'archived';

/** The intended audience for a post */
export type PostAudience = 'free' | 'premium' | 'all';

/**
 * Discriminator for the format of post content.
 * - `'html'` — content is a raw HTML string
 * - `'json'` — content is a Lexical/ProseMirror-style JSON document
 */
export type PostContentFormat = 'html' | 'json';

/**
 * Post content in HTML format.
 *
 * Returned when the beehiiv API delivers content as a rendered
 * HTML string.
 */
export interface PostContentHtml {
  /** Discriminator — always `'html'` for this variant */
  format: 'html';
  /** The raw HTML string of the post body */
  html: string;
}

/**
 * Post content in JSON format.
 *
 * Returned when the beehiiv API delivers content as a
 * Lexical/ProseMirror-style JSON document tree.
 */
export interface PostContentJson {
  /** Discriminator — always `'json'` for this variant */
  format: 'json';
  /** The Lexical/ProseMirror-style JSON document tree */
  document: Record<string, unknown>;
}

/**
 * Discriminated union of possible post content representations.
 *
 * Use the `format` field to narrow the type:
 * ```ts
 * if (content.format === 'html') {
 *   console.log(content.html);
 * } else {
 *   console.log(content.document);
 * }
 * ```
 */
export type PostContent = PostContentHtml | PostContentJson;

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
  /** Content of the post as a discriminated union, or `null` if not loaded */
  content?: PostContent | null;
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
  /** Cursor-based pagination metadata */
  pagination: CursorPaginationMeta;
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
