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
  /** Content of the post in JSON format */
  content?: unknown;
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
