/**
 * Tier types for the beehiiv API v2.
 * Tiers represent subscription levels (free or premium) available on a
 * publication. Each publication has at least one free tier and may have
 * one or more premium tiers with associated pricing.
 *
 * @module types/tier
 */

import type { CursorPaginationMeta } from './common.js';

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

/**
 * The kind of tier — either free (no payment required) or premium
 * (requires a paid subscription).
 */
export type TierType = 'free' | 'premium';

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

/**
 * A subscription tier record as returned by the beehiiv API.
 *
 * Every publication has at least one free tier. Premium tiers carry
 * pricing information (`price_in_cents` and `currency`) and can be
 * toggled on/off via the `active` flag.
 */
export interface Tier {
  /** Unique tier identifier (starts with "tier_") */
  id: string;
  /** The publication this tier belongs to */
  publication_id: string;
  /** Human-readable tier name displayed to subscribers */
  name: string;
  /** Optional description of what the tier includes */
  description?: string;
  /** Whether the tier is free or premium */
  type: TierType;
  /** Price in the smallest currency unit (e.g. cents). Only set for premium tiers. */
  price_in_cents?: number;
  /** ISO 4217 currency code (e.g. "USD"). Only set for premium tiers. */
  currency?: string;
  /** Whether the tier is currently active and available for new subscribers */
  active: boolean;
  /** Unix timestamp (seconds) when the tier was created */
  created_at: number;
  /** Unix timestamp (seconds) when the tier was last updated */
  updated_at?: number;
}

// ---------------------------------------------------------------------------
// Expand fields
// ---------------------------------------------------------------------------

/** Fields that can be expanded when retrieving tier resources */
export type TierExpandField = 'free_tier_group' | 'premium_tier_group';

// ---------------------------------------------------------------------------
// List tiers
// ---------------------------------------------------------------------------

/**
 * Query parameters accepted when listing tiers.
 */
export interface ListTiersParams {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter tiers by type */
  type?: TierType;
  /** Filter tiers by active status */
  active?: boolean;
  /** Optional related resources to include in the response */
  expand?: Array<TierExpandField>;
}

/**
 * Response wrapper for listing tiers.
 * Contains an array of tier records and cursor-based pagination metadata.
 */
export interface ListTiersResponse {
  /** Array of tier records for the current page */
  data: Tier[];
  /** Cursor-based pagination metadata */
  pagination: CursorPaginationMeta;
}

// ---------------------------------------------------------------------------
// Get tier
// ---------------------------------------------------------------------------

/**
 * Response wrapper for retrieving a single tier by its ID.
 */
export interface GetTierResponse {
  /** The tier data */
  data: Tier;
}

// ---------------------------------------------------------------------------
// Create tier
// ---------------------------------------------------------------------------

/**
 * Request body for creating a new tier on a publication.
 */
export interface CreateTierRequest {
  /** Human-readable name for the tier */
  name: string;
  /** Optional description of what the tier includes */
  description?: string;
  /** Whether this is a free or premium tier */
  type: TierType;
  /**
   * Price in the smallest currency unit (e.g. cents).
   * Required when `type` is `"premium"`.
   */
  price_in_cents?: number;
  /**
   * ISO 4217 currency code (e.g. "USD").
   * Required when `type` is `"premium"`.
   */
  currency?: string;
}

/**
 * Response wrapper for a newly created tier.
 */
export interface CreateTierResponse {
  /** The created tier data */
  data: Tier;
}

// ---------------------------------------------------------------------------
// Update tier
// ---------------------------------------------------------------------------

/**
 * Request body for updating an existing tier.
 * All fields are optional — only provided fields are modified.
 */
export interface UpdateTierRequest {
  /** Updated name for the tier */
  name?: string;
  /** Updated description */
  description?: string;
  /** Whether the tier should be active */
  active?: boolean;
}

/**
 * Response wrapper for an updated tier.
 */
export interface UpdateTierResponse {
  /** The updated tier data */
  data: Tier;
}
