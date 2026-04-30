/**
 * Publication types for the beehiiv API v2.
 * Publications represent newsletters managed in beehiiv.
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/publication
 */

import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * Expandable fields for publication requests.
 * Re-exported from the generated beehiiv API spec (`PublicationsRequestExpandItem`).
 */
export type PublicationsRequestExpand = components['schemas']['PublicationsRequestExpandItem'];

/**
 * Aggregate statistics for a publication.
 * Re-exported from the generated beehiiv API spec (`PublicationStats`).
 */
export type PublicationStats = components['schemas']['PublicationStats'];

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes)
// ---------------------------------------------------------------------------

/** A beehiiv publication */
export interface PublicationInfo {
  /** Unique publication ID (starts with "pub_") */
  id: string;
  /** The name of the publication */
  name: string;
  /** Unix timestamp when the publication was created */
  created: number;
  /** The timezone of the publication (IANA format, e.g. "America/New_York") */
  timezone: string;
  /** Publication statistics (only present when expand includes "stats") */
  stats?: PublicationStats;
}

/** Response wrapper for a single publication */
export interface PublicationResponse {
  /** The publication data */
  data: PublicationInfo;
}

/** Response wrapper for listing publications */
export interface PublicationsListResponse {
  /** Array of publication records */
  data: PublicationInfo[];
}
