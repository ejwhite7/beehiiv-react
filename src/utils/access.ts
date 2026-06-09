/**
 * Pure utility functions for resolving content access based on
 * subscriber tier and post audience settings.
 *
 * These functions are side-effect-free and do not depend on React or
 * any external state — making them easy to test and reuse on both
 * client and server.
 *
 * @module utils/access
 */

import type { PostAudience, SubscriptionTier, SubscriptionStatus } from '../types/index.js';

/**
 * Determines whether a subscriber can view content with the given audience setting.
 *
 * Rules:
 * - `PostAudience 'all'` — everyone can view (even non-subscribers). This is
 *   an SDK-only alias for public content; the beehiiv API never returns it.
 * - `PostAudience 'free'` — requires an **active** subscription (free or premium tier).
 * - `PostAudience 'both'` — sent to both free and premium audiences; requires an
 *   **active** subscription of either tier (same as `'free'`).
 * - `PostAudience 'premium'` — requires an **active premium** subscription only.
 *
 * A subscription is considered valid only when `status === 'active'`.
 * Statuses such as `'pending'`, `'inactive'`, or `'validating'` do **not**
 * grant access to gated content.
 *
 * @param tier - The subscriber's current tier, or `null` if not subscribed
 * @param status - The subscriber's current status, or `null` if not subscribed
 * @param audience - The content's audience/visibility setting
 * @returns `true` if the subscriber can view the content
 *
 * @example
 * ```ts
 * canViewContent('premium', 'active', 'premium'); // true
 * canViewContent('free', 'active', 'premium');     // false
 * canViewContent(null, null, 'all');                // true
 * ```
 */
export function canViewContent(
  tier: SubscriptionTier | null,
  status: SubscriptionStatus | null,
  audience: PostAudience,
): boolean {
  // Public content — visible to everyone
  if (audience === 'all') {
    return true;
  }

  // Gated content requires an active subscription
  const isActive = status === 'active';

  // 'both' posts go to both the free and premium audiences, so any
  // active subscriber can view them — same rule as 'free'.
  if (audience === 'free' || audience === 'both') {
    return isActive;
  }

  if (audience === 'premium') {
    return isActive && tier === 'premium';
  }

  return false;
}

/**
 * Returns a human-readable label for a {@link PostAudience} value.
 *
 * @param audience - The audience value to label
 * @returns A display-friendly string
 *
 * @example
 * ```ts
 * getAudienceLabel('all');     // 'Everyone'
 * getAudienceLabel('both');    // 'Members Only'
 * getAudienceLabel('free');    // 'Free'
 * getAudienceLabel('premium'); // 'Premium'
 * ```
 */
export function getAudienceLabel(audience: PostAudience): string {
  switch (audience) {
    case 'all':
      return 'Everyone';
    case 'both':
      return 'Members Only';
    case 'free':
      return 'Free';
    case 'premium':
      return 'Premium';
    default:
      return audience as string;
  }
}

/**
 * Returns a human-readable label for a {@link SubscriptionTier} value.
 *
 * @param tier - The tier value to label, or `null` for non-subscribers
 * @returns A display-friendly string
 *
 * @example
 * ```ts
 * getTierLabel('free');    // 'Free Subscriber'
 * getTierLabel('premium'); // 'Premium Subscriber'
 * getTierLabel(null);      // 'Non-subscriber'
 * ```
 */
export function getTierLabel(tier: SubscriptionTier | null): string {
  switch (tier) {
    case 'free':
      return 'Free Subscriber';
    case 'premium':
      return 'Premium Subscriber';
    default:
      return 'Non-subscriber';
  }
}
