/**
 * Custom field types for beehiiv publications.
 * Custom fields let publishers collect additional data from subscribers.
 *
 * Types that overlap with the auto-generated OpenAPI definitions re-export
 * or extend from `./beehiiv-api.generated.js`.
 *
 * @module types/custom-field
 */

import type { components } from './beehiiv-api.generated.js';

// ---------------------------------------------------------------------------
// Re-exports / aliases from the generated OpenAPI spec
// ---------------------------------------------------------------------------

/**
 * The primitive type stored in a beehiiv custom field.
 * Maps to TypeScript types during code generation.
 * Re-exported from the generated beehiiv API spec (`CustomFieldType`).
 */
export type CustomFieldKind = components['schemas']['CustomFieldType'];

/**
 * A custom field definition on a beehiiv publication.
 * Re-exported from the generated beehiiv API spec (`CustomFieldInfo`).
 */
export type CustomFieldInfo = components['schemas']['CustomFieldInfo'];

/**
 * Response wrapper for a single custom field.
 * Re-exported from the generated beehiiv API spec (`CustomFieldResponse`).
 */
export type CustomFieldResponse = components['schemas']['CustomFieldResponse'];

/**
 * Response wrapper for listing custom fields.
 * Re-exported from the generated beehiiv API spec (`CustomFieldIndexResponse`).
 */
export type CustomFieldIndexResponse = components['schemas']['CustomFieldIndexResponse'];

/**
 * A custom field value sent when creating/updating a subscription.
 * Re-exported from the generated beehiiv API spec (`CustomFieldValue`).
 */
export type CustomFieldValue = components['schemas']['CustomFieldValue'];

// ---------------------------------------------------------------------------
// Hand-written types (no generated equivalent)
// ---------------------------------------------------------------------------

/** Request body for creating a new custom field */
export interface CreateCustomFieldRequest {
  /** The display name for the custom field */
  display: string;
  /** The data type of the field */
  kind: CustomFieldKind;
  /** Available options (required when kind is "list") */
  options?: string[];
}

/** Request body for updating an existing custom field */
export interface UpdateCustomFieldRequest {
  /** Updated display name */
  display?: string;
  /** Updated options (only for "list" kind fields) */
  options?: string[];
}
