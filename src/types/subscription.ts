/**
 * Subscription types for the beehiiv API v2.
 * Subscriptions represent email subscribers to a publication.
 * @module types/subscription
 */

import type { CursorPaginationMeta } from './common.js';
import type { CustomFieldValue } from './custom-field.js';

/** The current status of a subscription */
export type SubscriptionStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'validating';

/** The subscription tier */
export type SubscriptionTier = 'free' | 'premium';

/** A subscriber's custom field value as returned by the API */
export interface SubscriptionCustomField {
  /** The display name of the custom field */
  name: string;
  /** The current value of the field for this subscriber */
  value: string | number | boolean | string[];
}

/** Complete subscription record returned by the beehiiv API */
export interface SubscriptionInfo {
  /** Unique subscription ID (starts with "sub_") */
  id: string;
  /** The publication this subscription belongs to */
  publication_id: string;
  /** The subscriber's email address */
  email: string;
  /** Current status of the subscription */
  status: SubscriptionStatus;
  /** Subscription tier (free or premium) */
  tier: SubscriptionTier;
  /** Custom field values for this subscriber */
  custom_fields?: SubscriptionCustomField[];
  /** UTM source parameter captured at subscription time */
  utm_source?: string;
  /** UTM medium parameter captured at subscription time */
  utm_medium?: string;
  /** UTM campaign parameter captured at subscription time */
  utm_campaign?: string;
  /** UTM term parameter captured at subscription time */
  utm_term?: string;
  /** UTM content parameter captured at subscription time */
  utm_content?: string;
  /** The referring site URL */
  referring_site?: string;
  /** The subscriber's unique referral code */
  referral_code?: string;
  /** Stripe customer ID for premium subscribers */
  stripe_customer_id?: string;
  /** Unix timestamp when the subscription was created */
  created_at: number;
  /** Unix timestamp when the subscription was last updated */
  updated_at?: number;
}

/** Request body for creating a new subscription */
export interface CreateSubscriptionRequest {
  /** The email address to subscribe */
  email: string;
  /** Whether to reactivate an existing inactive subscription (default: false) */
  reactivate_existing?: boolean;
  /** Whether to send the publication's welcome email (default: true) */
  send_welcome_email?: boolean;
  /** UTM source for attribution tracking */
  utm_source?: string;
  /** UTM medium for attribution tracking */
  utm_medium?: string;
  /** UTM campaign for attribution tracking */
  utm_campaign?: string;
  /** UTM term for attribution tracking */
  utm_term?: string;
  /** UTM content for attribution tracking */
  utm_content?: string;
  /** The referring site URL */
  referring_site?: string;
  /** Custom field values to set on the new subscriber */
  custom_fields?: CustomFieldValue[];
}

/** Request body for updating a subscription */
export interface UpdateSubscriptionRequest {
  /** Update the subscriber's email address */
  email?: string;
  /** Update custom field values */
  custom_fields?: CustomFieldValue[];
  /** Whether to unsubscribe (set status to inactive) */
  unsubscribe?: boolean;
}

/** Response wrapper for a single subscription */
export interface SubscriptionResponse {
  /** The subscription data */
  data: SubscriptionInfo;
}

/** Response wrapper for listing subscriptions */
export interface SubscriptionListResponse {
  /** Array of subscription records */
  data: SubscriptionInfo[];
  /** Cursor-based pagination metadata */
  pagination: CursorPaginationMeta;
}
