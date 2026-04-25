/**
 * Custom field types for beehiiv publications.
 * Custom fields let publishers collect additional data from subscribers.
 * @module types/custom-field
 */

import type { OffsetPaginationMeta } from './common.js';

/**
 * The primitive type stored in a beehiiv custom field.
 * Maps to TypeScript types during code generation.
 */
export type CustomFieldKind =
  | 'string'
  | 'integer'
  | 'double'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'list';

/** A custom field definition on a beehiiv publication */
export interface CustomFieldInfo {
  /** The unique ID of the custom field */
  id: string;
  /** The data type of the field */
  kind: CustomFieldKind;
  /** The display name shown in beehiiv UI */
  display: string;
  /** Unix timestamp of field creation */
  created: number;
  /** Available options -- only present when kind is "list" */
  options?: string[];
}

/** Response wrapper for a single custom field */
export interface CustomFieldResponse {
  data: CustomFieldInfo;
}

/** Response wrapper for listing custom fields */
export interface CustomFieldIndexResponse {
  data: CustomFieldInfo[];
  pagination: OffsetPaginationMeta;
}

/**
 * A custom field value sent when creating/updating a subscription.
 * The `name` must match an existing custom field's `display` name.
 */
export interface CustomFieldValue {
  /** The display name of the custom field */
  name: string;
  /** The value to set -- type depends on the field's kind */
  value: string | number | boolean | string[];
}

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
