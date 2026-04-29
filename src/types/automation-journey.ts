/**
 * Automation journey types for the beehiiv API v2.
 * Automation journeys represent a subscriber's progression through
 * an automation workflow, including creation and retrieval of journey records.
 * @module types/automation-journey
 */

/** The status of an automation journey */
export type AutomationJourneyStatus = 'active' | 'completed' | 'exited';

/** An automation journey record returned by the beehiiv API */
export interface AutomationJourneyInfo {
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

/** Request body for creating a new automation journey */
export interface CreateAutomationJourneyRequest {
  /** The automation ID to enroll the subscriber in */
  automationId: string;
  /** The subscription ID of the subscriber to enroll */
  subscriptionId: string;
  /** Optional double opt-in override ('on' to enable, 'off' to disable) */
  doubleOptOverride?: 'on' | 'off';
}

/** Response wrapper for a single automation journey */
export interface AutomationJourneyResponse {
  /** The automation journey data */
  data: AutomationJourneyInfo;
}
