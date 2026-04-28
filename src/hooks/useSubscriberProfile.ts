/**
 * @file useSubscriberProfile.ts
 * Hook for resolving a subscriber's full profile — tier, status, and identity flags —
 * independently of any content or audience check.
 *
 * Use this hook when you need to know who a user is (e.g., to decorate a profile,
 * gate non-beehiiv features, or render a subscriber badge) without tying the lookup
 * to a specific post or content visibility setting.
 *
 * @module hooks/useSubscriberProfile
 */

import { useCallback } from 'react';

import { useSubscription } from './useSubscription.js';
import type { UseSubscriberProfileOptions, SubscriberProfile } from '../types/index.js';

/**
 * Resolves a subscriber's full profile from their email or subscription ID.
 *
 * Returns the raw subscription record alongside pre-computed `isPremium` and
 * `isActive` flags so callers never have to manually derive access state.
 *
 * @param options - Lookup options (email or id, plus enabled flag)
 * @returns SubscriberProfile — tier, status, flags, raw subscription, loading/error state
 *
 * @example
 * ```tsx
 * const { isPremium, tier, isLoading } = useSubscriberProfile({ email: user.email });
 *
 * return isPremium ? <PremiumBadge /> : <FreeBadge />;
 * ```
 */
export function useSubscriberProfile(options: UseSubscriberProfileOptions): SubscriberProfile {
  const { email, id, enabled = true } = options;

  const { subscription, isLoading, error, refetch: rawRefetch } = useSubscription({
    email,
    id,
    enabled,
  });

  const tier = subscription?.tier ?? null;
  const status = subscription?.status ?? null;
  const isActive = status === 'active';
  const isPremium = isActive && tier === 'premium';

  /** Wraps the underlying refetch as an async function. */
  const refetch = useCallback(async (): Promise<void> => {
    rawRefetch();
  }, [rawRefetch]);

  return {
    subscription: subscription ?? null,
    tier,
    status,
    isPremium,
    isActive,
    isLoading,
    error,
    refetch,
  };
}
