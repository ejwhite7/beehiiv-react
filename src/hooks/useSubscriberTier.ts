/**
 * @file useSubscriberTier.ts
 * Lightweight hook that returns only a subscriber's tier and access flags,
 * without the full subscription record.
 *
 * Prefer this hook when you only need to know "is this user premium / active?"
 * and do not need the full SubscriptionInfo object.
 *
 * @module hooks/useSubscriberTier
 */

import { useSubscriberProfile } from './useSubscriberProfile.js';
import type { UseSubscriberProfileOptions, SubscriberTierResult } from '../types/index.js';

/**
 * Returns a subscriber's tier and computed access flags.
 * A lightweight alternative to useSubscriberProfile when the full subscription
 * record is not needed.
 *
 * @param options - Lookup options (email or id, plus enabled flag)
 * @returns SubscriberTierResult — tier, status, isPremium, isActive, loading/error
 *
 * @example
 * ```tsx
 * const { isPremium, isLoading } = useSubscriberTier({ email: user.email });
 *
 * if (isPremium) showPremiumFeature();
 * ```
 */
export function useSubscriberTier(options: UseSubscriberProfileOptions): SubscriberTierResult {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { subscription, ...rest } = useSubscriberProfile(options);
  return rest;
}
