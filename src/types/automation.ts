/**
 * Automation types for the beehiiv API v2.
 * Automations represent automated email workflows triggered by subscriber events.
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/automation
 */

import type { CursorPaginationMeta } from './common.js';
import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * The current status of an automation workflow.
 * Re-exported from the generated beehiiv API spec (`AutomationStatus`).
 */
export type AutomationStatus = components['schemas']['AutomationStatus'];

/**
 * The status of a subscriber's journey through an automation.
 * Re-exported from the generated beehiiv API spec (`AutomationJourneyStatus`).
 */
export type AutomationJourneyStatus = components['schemas']['AutomationJourneyStatus'];

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes)
// ---------------------------------------------------------------------------

/** The type of event that triggers an automation */
export type AutomationTriggerType =
  | 'subscriber_created'
  | 'subscriber_updated'
  | 'segment_entered'
  | 'referral_milestone';

/** The type of action performed at each step of an automation */
export type AutomationStepType =
  | 'send_email'
  | 'wait'
  | 'condition'
  | 'add_tag'
  | 'remove_tag'
  | 'update_custom_field';

/** A single step within an automation workflow */
export interface AutomationStep {
  /** Unique identifier for the automation step */
  id: string;
  /** The type of action this step performs */
  type: AutomationStepType;
  /** Step-specific configuration (varies by step type) */
  config: unknown;
  /** Zero-based position of this step within the automation sequence */
  position: number;
}

/** The trigger configuration that starts an automation */
export interface AutomationTrigger {
  /** The event type that activates this trigger */
  type: AutomationTriggerType;
  /** Trigger-specific configuration (varies by trigger type) */
  config: unknown;
}

/** Complete automation record returned by the beehiiv API */
export interface AutomationInfo {
  /** Unique automation ID */
  id: string;
  /** The publication this automation belongs to */
  publication_id: string;
  /** Human-readable name for the automation */
  name: string;
  /** Current status of the automation */
  status: AutomationStatus;
  /** The trigger that starts this automation */
  trigger: AutomationTrigger;
  /** Ordered list of steps in the automation workflow */
  steps: AutomationStep[];
  /** Number of subscribers currently in or who have completed this automation */
  subscriber_count: number;
  /** Unix timestamp when the automation was created */
  created_at: number;
  /** Unix timestamp when the automation was last updated */
  updated_at: number;
}

/** A subscriber's journey record through an automation */
export interface AutomationJourney {
  /** Unique journey ID */
  id: string;
  /** The automation this journey belongs to */
  automation_id: string;
  /** The subscriber progressing through the automation */
  subscriber_id: string;
  /** Current status of the journey */
  status: AutomationJourneyStatus;
  /** Unix timestamp when the subscriber entered the automation */
  started_at: number;
  /** Unix timestamp when the journey completed (null if still active) */
  completed_at: number | null;
}

/** Response wrapper for a single automation */
export interface AutomationResponse {
  /** The automation data */
  data: AutomationInfo;
}

/** Response wrapper for listing automations */
export interface AutomationListResponse {
  /** Array of automation records */
  data: AutomationInfo[];
  /** Cursor-based pagination metadata */
  pagination: CursorPaginationMeta;
}

/** Response wrapper for listing automation journeys */
export interface AutomationJourneyListResponse {
  /** Array of automation journey records */
  data: AutomationJourney[];
  /** Cursor-based pagination metadata */
  pagination: CursorPaginationMeta;
}

/** Request body for creating a new automation */
export interface CreateAutomationRequest {
  /** Human-readable name for the automation */
  name: string;
  /** The trigger that starts this automation */
  trigger: AutomationTrigger;
  /** Optional initial steps to add to the automation */
  steps?: Omit<AutomationStep, 'id'>[];
}

/** Options for listing automations with cursor-based pagination */
export interface ListAutomationsOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter automations by status */
  status?: AutomationStatus;
}

/** Options for listing automation journeys with cursor-based pagination */
export interface ListJourneysOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter journeys by status */
  status?: AutomationJourneyStatus;
}

/** An email associated with an automation workflow */
export interface AutomationEmailInfo {
  /** Unique email ID */
  id: string;
  /** The automation this email belongs to */
  automation_id: string;
  /** The subject line of the email */
  subject: string;
  /** The preheader text of the email */
  preheader?: string;
  /** The position of this email in the automation sequence */
  position: number;
  /** Unix timestamp when the email was created */
  created_at: number;
  /** Unix timestamp when the email was last updated */
  updated_at: number;
}

/** Response wrapper for listing automation emails */
export interface AutomationEmailListResponse {
  /** Array of automation email records */
  data: AutomationEmailInfo[];
  /** The limit placed on the results */
  limit: number;
  /** The page number of the results */
  page: number;
  /** The total number of results across all pages */
  total_results: number;
  /** The total number of pages */
  total_pages: number;
}
