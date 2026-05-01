/**
 * Engagement types for the beehiiv API v2.
 * Engagements represent aggregated email engagement metrics for a
 * publication over a specified date range.
 *
 * @module types/engagement
 */

// ---------------------------------------------------------------------------
// Expand fields
// ---------------------------------------------------------------------------

/** Fields that can be expanded when retrieving engagement resources */
export type EngagementExpandField = 'stats';

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes)
// ---------------------------------------------------------------------------

/**
 * Aggregated engagement metrics for a single day.
 *
 * Each field tracks a specific email engagement metric for the
 * publication on the given date.
 */
export interface EngagementMetrics {
  /** The date these metrics apply to (ISO 8601 date string, e.g. "2024-01-15") */
  date: string;
  /** Total number of emails sent on this date */
  sends: number;
  /** Total number of unique opens on this date */
  opens: number;
  /** The ratio of opens to sends, expressed as a decimal (0.0 - 1.0) */
  open_rate: number;
  /** Total number of unique clicks on this date */
  clicks: number;
  /** The ratio of clicks to sends, expressed as a decimal (0.0 - 1.0) */
  click_rate: number;
  /** Total number of unsubscribes on this date */
  unsubscribes: number;
  /** Total number of spam reports received on this date */
  spam_reports: number;
}

// ---------------------------------------------------------------------------
// Request params
// ---------------------------------------------------------------------------

/**
 * Query parameters accepted when fetching engagement metrics.
 */
export interface GetEngagementsParams {
  /** Start date for the engagement data range (ISO 8601 date string, e.g. "2024-01-01") */
  start_date: string;
  /** End date for the engagement data range (ISO 8601 date string, e.g. "2024-01-31") */
  end_date: string;
  /** Optional related resources to include in the response */
  expand?: Array<EngagementExpandField>;
}

/**
 * Response wrapper for the engagements endpoint.
 *
 * Contains an array of daily engagement metrics for a publication
 * within the requested date range.
 */
export interface GetEngagementsResponse {
  /** Array of daily engagement metric records */
  data: EngagementMetrics[];
  /** The publication ID these metrics belong to */
  publication_id: string;
  /** The requested date range for the engagement data */
  date_range: {
    /** Start date of the range (ISO 8601 date string) */
    start_date: string;
    /** End date of the range (ISO 8601 date string) */
    end_date: string;
  };
}
