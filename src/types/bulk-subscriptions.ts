/**
 * Types for bulk subscription operations in the beehiiv API v2.
 *
 * Covers bulk creation of subscriptions, bulk field updates,
 * bulk status updates, and polling for asynchronous job results.
 *
 * @module types/bulk-subscriptions
 */

import type { CustomFieldValue } from './custom-field.js';

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
  custom_fields?: CustomFieldValue[];
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
 * The API processes the request asynchronously and returns the ID of the
 * import object created for the request.
 */
export interface BulkCreateSubscriptionsResponse {
  /** Human-readable result of the create request */
  message: string;
  /** The database ID of the import object created from the request */
  import_id: string;
}

// ---------------------------------------------------------------------------
// Bulk Subscription Update Jobs
// ---------------------------------------------------------------------------

/**
 * Possible states of a bulk subscription update job.
 *
 * Jobs transition through these states as the API processes the request:
 * `pending` -> `processing` -> `complete` | `failed`.
 */
export type BulkSubscriptionUpdateJobStatus =
  | 'pending'
  | 'processing'
  | 'complete'
  | 'failed';

/**
 * The kind of bulk update a job performs.
 *
 * `status` jobs come from the bulk status update endpoint; `bulk` jobs
 * come from the bulk field update (bulk_actions) endpoint.
 */
export type BulkSubscriptionUpdateJobType = 'status' | 'bulk';

/**
 * Represents a single Subscription Update job.
 *
 * Returned by the list and get endpoints under
 * `/publications/{publicationId}/bulk_subscription_updates`.
 * Mirrors the OpenAPI `BulkSubscriptionUpdates*ResponseData` schemas —
 * every field is optional/nullable per the spec.
 */
export interface BulkSubscriptionUpdateJob {
  /** Unique identifier for the update object */
  id?: string | null;
  /** The type of update (status or bulk) */
  type?: BulkSubscriptionUpdateJobType;
  /** The parameters passed in for the update */
  params?: string | null;
  /** Current processing status of the job */
  status?: BulkSubscriptionUpdateJobStatus;
  /** The publication ID associated with this update */
  publication_id?: string;
  /** If the job as a whole fails, details the errors encountered */
  failure_reason?: string | null;
  /** Unix timestamp of the job's completion */
  completed?: number | null;
  /** Unix timestamp of the job's creation */
  created?: number | null;
  /** Unix timestamp of the job's last update */
  updated?: number | null;
  /** Errors encountered for individual updates within the job */
  error_log?: string[] | null;
}

// ---------------------------------------------------------------------------
// Bulk Update Fields
// ---------------------------------------------------------------------------

/**
 * A custom field entry within a bulk subscription update.
 *
 * Setting `delete: true` removes the custom field entry from the
 * subscription instead of updating its value.
 */
export interface BulkUpdateCustomFieldEntry {
  /** The display name of the custom field */
  name?: string | null;
  /** The value to set for the custom field */
  value?: CustomFieldValue['value'];
  /** Whether to delete this custom field entry from the subscription */
  delete?: boolean | null;
}

/**
 * A single subscription entry within a bulk field update request.
 */
export interface BulkUpdateSubscriptionEntry {
  /** The subscription ID to update */
  subscription_id: string;
  /** The tier to set on the subscription */
  tier?: string;
  /** The Stripe customer ID to set on the subscription */
  stripe_customer_id?: string | null;
  /** Whether to unsubscribe this subscription from the publication */
  unsubscribe?: boolean | null;
  /** Custom field updates to apply to the subscription */
  custom_fields?: BulkUpdateCustomFieldEntry[] | null;
}

/**
 * Request body for updating multiple subscriptions at once.
 *
 * Calls `PUT /publications/{publicationId}/subscriptions/bulk_actions`.
 */
export interface BulkUpdateFieldsRequest {
  /** Array of per-subscription update entries */
  subscriptions: BulkUpdateSubscriptionEntry[];
}

/**
 * Response returned after submitting a bulk field update request.
 */
export interface BulkUpdateFieldsResponse {
  /** Wrapper object for the update job reference */
  data: {
    /** The ID of the Subscription Update object handling the update job */
    subscription_update_id?: string | null;
  };
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
  new_status: 'active' | 'inactive';
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
