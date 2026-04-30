/**
 * Segment types for the beehiiv API v2.
 * Segments allow grouping subscribers by dynamic rules, static lists,
 * or manual CSV uploads for targeted communication.
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/segment
 */

import type { SubscriptionInfo } from './subscription.js';
import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * The type of a segment.
 * Re-exported from the generated beehiiv API spec (`SegmentType`).
 */
export type SegmentType = components['schemas']['SegmentType'];

/**
 * The status of a segment's most recent calculation.
 * Re-exported from the generated beehiiv API spec (`SegmentStatus`).
 */
export type SegmentStatus = components['schemas']['SegmentStatus'];

/**
 * Expand options available when listing segment members.
 * Re-exported from the generated beehiiv API spec (`SegmentMembersExpandItems`).
 */
export type SegmentMembersExpand = components['schemas']['SegmentMembersExpandItems'];

/**
 * Expand options available when listing or getting segments.
 * Re-exported from the generated beehiiv API spec (`SegmentsExpandItems`).
 */
export type SegmentsExpand = components['schemas']['SegmentsExpandItems'];

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes)
// ---------------------------------------------------------------------------

/** Statistical data for a segment */
export interface SegmentStats {
  /** The average open rate of the subscribers in the segment */
  open_rate: number;
  /** The total number of emails sent to the subscribers in the segment */
  total_sent: number;
  /** The percentage of premium subscribers in the segment */
  percentage_premium_subscribers: number;
  /** The percentage of subscribers with at least one referral */
  percentage_subscribers_with_referrals: number;
  /** The total number of unique emails clicked */
  unique_emails_clicked: number;
  /** The total number of emails delivered */
  total_delivered: number;
  /** The total number of referrals from subscribers in the segment */
  total_referrals: number;
  /** The percentage of subscribers who have unsubscribed */
  unsubscribed_rate: number;
  /** The total number of subscribers in the segment */
  total_subscribers: number;
  /** The average clickthrough rate */
  clickthrough_rate: number;
  /** The total number of unsubscribed subscribers */
  unsubscribed_count: number;
  /** The total number of unique emails opened */
  unique_emails_opened: number;
  /** The total number of premium subscribers */
  premium_subscribers: number;
  /** The average number of referrals per subscriber */
  average_referrals_per_subscriber: number;
}

/** A segment object returned by the beehiiv API */
export interface SegmentInfo {
  /** The prefixed ID of the segment */
  id: string;
  /** The name of the segment */
  name: string;
  /** The type of segment (dynamic, static, or manual) */
  type: SegmentType;
  /** The time the segment was last calculated (Unix timestamp in seconds) */
  last_calculated?: number;
  /** The total number of subscriptions in the segment from the last calculation */
  total_results: number;
  /** The status of the segment's most recent calculation */
  status: SegmentStatus;
  /** Whether the segment is active (inactive dynamic segments are not auto-recalculated) */
  active: boolean;
  /** Segment statistics, included when expanded */
  stats?: SegmentStats;
}

/** A member of a segment, represented as a subscription object */
export type SegmentMember = SubscriptionInfo;

/** Response wrapper for a single segment */
export interface SegmentResponse {
  /** The segment data */
  data: SegmentInfo;
}

/** Response wrapper for listing segments (offset-paginated) */
export interface SegmentListResponse {
  /** Array of segment records */
  data: SegmentInfo[];
  /** The limit placed on the results */
  limit: number;
  /** The page number of the results */
  page: number;
  /** The total number of results across all pages */
  total_results: number;
  /** The total number of pages */
  total_pages: number;
}

/** Response wrapper for listing segment members (offset-paginated) */
export interface SegmentMembersResponse {
  /** Array of subscription records for segment members */
  data: SegmentMember[];
  /** The limit placed on the results */
  limit: number;
  /** The page number of the results */
  page: number;
  /** The total number of results across all pages */
  total_results: number;
  /** The total number of pages */
  total_pages: number;
}

/** A single custom field filter condition for dynamic segments */
export interface CustomFieldFilter {
  /** The display name of the custom field (case-insensitive match) */
  name: string;
  /** The comparison operator (e.g. 'equal', 'not_equal', 'contains', 'exists', 'does_not_exist') */
  operator: string;
  /** The value to compare against (not required for 'exists' / 'does_not_exist') */
  value?: string;
}

/**
 * Input for creating a segment.
 * Use `subscriptions` or `emails` for manual/static segments,
 * or `custom_fields` for dynamic segments.
 */
export type SegmentSubscriptionInput =
  | {
      /** Discriminator: create from subscription IDs */
      type: 'subscriptions';
      /** Array of subscription IDs */
      subscriptions: string[];
    }
  | {
      /** Discriminator: create from email addresses */
      type: 'emails';
      /** Array of email addresses */
      emails: string[];
    }
  | {
      /** Discriminator: create from custom field filters */
      type: 'custom_fields';
      /** Logical operator to combine filters ('and' | 'or') */
      operator?: 'and' | 'or';
      /** Array of custom field filter conditions */
      custom_fields: CustomFieldFilter[];
    };

/** Request body for creating a new segment */
export interface CreateSegmentRequest {
  /** A unique name for the segment */
  name: string;
  /** The input data defining the segment's membership */
  input: SegmentSubscriptionInput;
}

/** Options for listing segments with offset-based pagination */
export interface ListSegmentsOptions {
  /** Maximum number of results to return per page (1-100, default 10) */
  limit?: number;
  /** Page number to retrieve (default 1) */
  page?: number;
  /** Filter by segment type */
  type?: SegmentType;
  /** Filter by segment status */
  status?: SegmentStatus;
  /** Field to order results by */
  orderBy?: 'created' | 'last_calculated';
  /** Sort direction */
  direction?: 'asc' | 'desc';
  /** Expand additional data (e.g. 'stats') */
  expand?: SegmentsExpand[];
}

/** Options for listing segment members with offset-based pagination */
export interface ListSegmentMembersOptions {
  /** Maximum number of results to return per page (1-100, default 10) */
  limit?: number;
  /** Page number to retrieve (default 1) */
  page?: number;
  /** Expand additional subscription data */
  expand?: SegmentMembersExpand[];
}

/** Response wrapper for recalculating a segment */
export interface SegmentRecalculateResponse {
  /** Confirmation message */
  message: string;
}
