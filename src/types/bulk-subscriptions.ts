/**
 * Types for bulk subscription operations in the beehiiv API v2.
 *
 * Covers bulk creation of subscriptions, bulk field updates,
 * bulk status updates, and polling for asynchronous job results.
 *
 * @module types/bulk-subscriptions
 */

// ---------------------------------------------------------------------------
// Bulk Create Subscriptions
// ---------------------------------------------------------------------------

/**
 * A single subscription entry within a bulk create request.
 *
 * Each entry represents one subscriber to add to the publication.
 * Only `email` is required; all other fields are optional.
 */
export interface BulkCreateSubscriptionEntry {
  /** The email address to subscribe */
  email: string;
  /** UTM source for attribution tracking */
  utm_source?: string;
  /** UTM medium for attribution tracking */
  utm_medium?: string;
  /** UTM campaign for attribution tracking */
  utm_campaign?: string;
  /** Custom field values to attach to the subscriber */
  custom_fields?: Record<string, unknown>;
  /** Whether to send the publication's welcome email (default: true) */
  send_welcome_email?: boolean;
  /** Whether to reactivate an existing inactive subscription (default: false) */
  reactivate_existing?: boolean;
}

/**
 * Request body for creating multiple subscriptions in a single API call.
 *
 * Calls `POST /publications/{publicationId}/bulk_subscriptions`.
 */
export interface BulkCreateSubscriptionsRequest {
  /** Array of subscription entries to create */
  subscriptions: BulkCreateSubscriptionEntry[];
}

/**
 * Response returned after submitting a bulk subscription creation request.
 *
 * The API processes the request asynchronously and returns a job ID
 * that can be polled for completion status.
 */
export interface BulkCreateSubscriptionsResponse {
  /** Unique identifier for the asynchronous bulk job */
  job_id: string;
  /** Current status of the bulk operation */
  status: string;
  /** Total number of subscriptions in the request */
  total: number;
  /** Number of subscriptions successfully created */
  created: number;
  /** Number of existing subscriptions that were updated */
  updated: number;
  /** Number of subscriptions that failed to process */
  failed: number;
}

// ---------------------------------------------------------------------------
// Bulk Subscription Update Jobs
// ---------------------------------------------------------------------------

/**
 * Possible states of a bulk subscription update job.
 *
 * Jobs transition through these states as the API processes the request:
 * `pending` -> `processing` -> `completed` | `failed`.
 */
export type BulkSubscriptionUpdateJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Represents a single bulk subscription update job.
 *
 * Returned by the list and get endpoints under
 * `/publications/{publicationId}/bulk_subscription_updates`.
 */
export interface BulkSubscriptionUpdateJob {
  /** Unique identifier for the bulk update job */
  id: string;
  /** Current processing status of the job */
  status: BulkSubscriptionUpdateJobStatus;
  /** Total number of subscriptions targeted by the job */
  total: number;
  /** Number of subscriptions successfully created */
  created: number;
  /** Number of subscriptions successfully updated */
  updated: number;
  /** Number of subscriptions that failed to process */
  failed: number;
  /** ISO 8601 timestamp when the job was created */
  created_at: string;
  /** ISO 8601 timestamp when the job completed (null if still processing) */
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Bulk Update Fields
// ---------------------------------------------------------------------------

/**
 * Request body for updating custom fields on multiple subscriptions at once.
 *
 * Calls `PUT /publications/{publicationId}/subscriptions/bulk_actions`.
 */
export interface BulkUpdateFieldsRequest {
  /** Array of subscription IDs to update */
  subscription_ids: string[];
  /** Key-value map of fields to set on each subscription */
  fields: Record<string, unknown>;
}

/**
 * Response returned after submitting a bulk field update request.
 */
export interface BulkUpdateFieldsResponse {
  /** Unique identifier for the asynchronous bulk job */
  job_id: string;
  /** Current status of the bulk operation */
  status: string;
}

// ---------------------------------------------------------------------------
// Bulk Update Status
// ---------------------------------------------------------------------------

/**
 * Request body for changing the status of multiple subscriptions at once.
 *
 * Calls `PUT /publications/{publicationId}/subscriptions`.
 */
export interface BulkUpdateStatusRequest {
  /** Array of subscription IDs to update */
  subscription_ids: string[];
  /** The new status to apply to each subscription */
  status: 'active' | 'inactive';
}

/**
 * Response returned after submitting a bulk status update request.
 */
export interface BulkUpdateStatusResponse {
  /** Unique identifier for the asynchronous bulk job */
  job_id: string;
  /** Current status of the bulk operation */
  status: string;
}

// ---------------------------------------------------------------------------
// List / Get Bulk Update Jobs Responses
// ---------------------------------------------------------------------------

/**
 * Response wrapper for listing bulk subscription update jobs.
 *
 * Returned by `GET /publications/{publicationId}/bulk_subscription_updates`.
 */
export interface ListBulkUpdateJobsResponse {
  /** Array of bulk update job records */
  data: BulkSubscriptionUpdateJob[];
}

/**
 * Response wrapper for retrieving a single bulk subscription update job.
 *
 * Returned by `GET /publications/{publicationId}/bulk_subscription_updates/{id}`.
 */
export interface GetBulkUpdateJobResponse {
  /** The bulk update job record */
  data: BulkSubscriptionUpdateJob;
}
