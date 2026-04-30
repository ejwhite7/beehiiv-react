/**
 * Webhook types for the beehiiv API v2.
 * Webhooks enable real-time notifications for publication events.
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/webhook
 */

import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * All supported beehiiv webhook event types.
 * Re-exported from the generated beehiiv API spec (`WebhookEventType`).
 */
export type WebhookEventType = components['schemas']['WebhookEventType'];

// ---------------------------------------------------------------------------
// Hand-written types (SDK-specific shapes)
// ---------------------------------------------------------------------------

/** A configured webhook on a beehiiv publication */
export interface WebhookInfo {
  /** Unique webhook ID */
  id: string;
  /** The URL that will receive webhook POST requests */
  url: string;
  /** The event types this webhook is subscribed to */
  event_types: WebhookEventType[];
  /** Whether the webhook is currently active */
  active: boolean;
  /** Unix timestamp when the webhook was created */
  created: number;
}

/**
 * Generic webhook payload wrapper.
 * The `data` field contains event-specific data.
 */
export interface WebhookPayload<T = unknown> {
  /** The type of event that triggered this webhook */
  event_type: WebhookEventType;
  /** Unix timestamp when the event occurred */
  timestamp: number;
  /** The publication ID this event belongs to */
  publication_id: string;
  /** Event-specific data payload */
  data: T;
}

/** Request body for creating a new webhook */
export interface CreateWebhookRequest {
  /** The URL to send webhook POST requests to */
  url: string;
  /** The event types to subscribe to */
  event_types: WebhookEventType[];
}

/** Request body for updating an existing webhook */
export interface UpdateWebhookRequest {
  /** Updated webhook URL */
  url?: string;
  /** Updated event types */
  event_types?: WebhookEventType[];
  /** Enable or disable the webhook */
  active?: boolean;
}

/** Response wrapper for a single webhook */
export interface WebhookResponse {
  /** The webhook data */
  data: WebhookInfo;
}

/** Response wrapper for listing webhooks */
export interface WebhookListResponse {
  /** Array of webhook records */
  data: WebhookInfo[];
}
