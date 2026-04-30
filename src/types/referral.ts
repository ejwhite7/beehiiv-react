/**
 * Referral program types for the beehiiv API v2.
 * Referrals represent the subscriber referral program and its milestones.
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/referral
 */

import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * The type of reward granted when a referral milestone is reached.
 * Re-exported from the generated beehiiv API spec (`MilestoneRewardType`).
 */
export type ReferralMilestoneRewardType = components['schemas']['MilestoneRewardType'];

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes)
// ---------------------------------------------------------------------------

/** A single milestone in the referral program */
export interface ReferralMilestone {
  /** Unique milestone ID */
  id: string;
  /** Number of referrals required to reach this milestone */
  milestone_count: number;
  /** The type of reward granted at this milestone */
  reward_type: ReferralMilestoneRewardType;
  /** Human-readable description of the reward */
  reward_description: string;
  /** Whether this milestone is currently active */
  active: boolean;
}

/** The referral program configuration for a publication */
export interface ReferralProgram {
  /** Unique referral program ID */
  id: string;
  /** The publication this referral program belongs to */
  publication_id: string;
  /** Whether the referral program is currently enabled */
  enabled: boolean;
  /** List of milestones configured for the program */
  milestones: ReferralMilestone[];
  /** Base URL used to generate subscriber referral links */
  referral_url_base: string;
  /** Unix timestamp when the referral program was created */
  created_at: number;
}

/** Referral statistics for a specific subscriber */
export interface ReferralStats {
  /** The subscriber's unique ID */
  subscriber_id: string;
  /** The subscriber's unique referral code */
  referral_code: string;
  /** The subscriber's full referral URL */
  referral_url: string;
  /** Total number of successful referrals made by this subscriber */
  referral_count: number;
  /** List of milestone IDs this subscriber has achieved */
  milestones_achieved: string[];
}

/** Response wrapper for the referral program */
export interface ReferralProgramResponse {
  /** The referral program data */
  data: ReferralProgram;
}

/** Response wrapper for subscriber referral statistics */
export interface ReferralStatsResponse {
  /** The referral statistics data */
  data: ReferralStats;
}
