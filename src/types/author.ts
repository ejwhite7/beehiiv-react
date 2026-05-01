/**
 * Author types for the beehiiv API v2.
 * Authors represent the writers / contributors of a beehiiv publication.
 *
 * This module defines the core `Author` interface along with the
 * request-option and response-wrapper types consumed by the client
 * endpoint, hooks, query adapters, and server fetchers.
 *
 * @module types/author
 */

import type { OffsetPaginationMeta } from './common.js';

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

/**
 * A beehiiv publication author.
 *
 * Represents a single contributor returned by the
 * `GET /v2/publications/{publicationId}/authors` family of endpoints.
 */
export interface Author {
  /** Unique author identifier (starts with "author_") */
  id: string;

  /** Display name of the author */
  name: string;

  /** Short biography / description of the author */
  bio: string;

  /** Absolute URL to the author's profile picture, or `null` if unset */
  profile_picture: string | null;

  /**
   * Unix timestamp (seconds) when the author record was created.
   * Expressed as a number to stay consistent with other beehiiv date fields.
   */
  created_at: number;

  /**
   * Unix timestamp (seconds) when the author record was last updated.
   * Expressed as a number to stay consistent with other beehiiv date fields.
   */
  updated_at: number;
}

// ---------------------------------------------------------------------------
// Expand fields
// ---------------------------------------------------------------------------

/** Fields that can be expanded when retrieving author resources */
export type AuthorExpandField = 'post_count';

// ---------------------------------------------------------------------------
// List params
// ---------------------------------------------------------------------------

/**
 * Query parameters accepted when listing authors.
 */
export interface ListAuthorsParams {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Page number for offset-based pagination */
  page?: number;
  /** Optional related resources to include in the response */
  expand?: Array<AuthorExpandField>;
}

// ---------------------------------------------------------------------------
// Response wrappers
// ---------------------------------------------------------------------------

/**
 * Response wrapper for listing authors.
 *
 * Returned by `GET /v2/publications/{publicationId}/authors`.
 * Contains a paginated array of {@link Author} records plus
 * offset-based pagination metadata.
 */
export interface ListAuthorsResponse {
  /** Array of author records for the current page */
  data: Author[];

  /** Offset-based pagination metadata */
  pagination: OffsetPaginationMeta;
}

/**
 * Response wrapper for retrieving a single author.
 *
 * Returned by `GET /v2/publications/{publicationId}/authors/{authorId}`.
 */
export interface GetAuthorResponse {
  /** The requested author record */
  data: Author;
}
