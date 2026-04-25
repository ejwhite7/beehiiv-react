/**
 * Publication types for the beehiiv API v2.
 * Publications represent newsletters managed in beehiiv.
 * @module types/publication
 */

/** Expandable fields for publication requests */
export type PublicationsRequestExpand = 'stats';

/** Aggregate statistics for a publication */
export interface PublicationStats {
  /** Total number of active subscriptions */
  stat_active_subscriptions: number;
  /** Average email open rate (0-1 decimal) */
  stat_average_open_rate: number;
  /** Average email click rate (0-1 decimal) */
  stat_average_click_rate: number;
  /** Total number of posts published */
  stat_total_sent: number;
  /** Total number of subscribers (all statuses) */
  stat_total_subscriptions: number;
}

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
