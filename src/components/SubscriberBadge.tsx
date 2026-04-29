"use client";

/**
 * SubscriberBadge - a component that displays a subscriber's tier as a
 * visual badge, or delegates rendering to a headless render prop.
 *
 * Uses {@link useSubscriberProfile} internally to resolve the subscriber's
 * profile and then renders the appropriate tier badge.
 *
 * @module components/SubscriberBadge
 */

import React from 'react';

import { useSubscriberProfile } from '../hooks/useSubscriberProfile.js';
import type { SubscriberBadgeProps } from '../types/access.js';
export type { SubscriberBadgeProps } from '../types/access.js';

/**
 * Displays a subscriber tier badge or delegates rendering via `renderBadge`.
 *
 * **Default behaviour:**
 * - While loading: renders `loadingFallback` (defaults to `null`).
 * - Premium subscriber: renders `<span>Premium</span>` with `data-tier="premium"`.
 * - Active free subscriber: renders `<span>Free</span>` with `data-tier="free"`.
 * - Inactive / not found: renders `fallback` if provided, otherwise a "Free" badge.
 *
 * **Headless mode:** When `renderBadge` is provided, the component resolves the
 * subscriber profile and passes it to the render prop — no default UI is rendered.
 *
 * @param props - Component props
 * @returns A React element wrapping the badge content
 *
 * @example
 * ```tsx
 * <SubscriberBadge subscriberEmail="user@example.com" />
 *
 * <SubscriberBadge
 *   subscriberEmail="user@example.com"
 *   renderBadge={(profile) => <MyCustomBadge tier={profile.tier} />}
 * />
 * ```
 */
export function SubscriberBadge(props: SubscriberBadgeProps): React.JSX.Element | null {
  const {
    subscriberEmail,
    subscriberId,
    className,
    renderBadge,
    loadingFallback,
    fallback,
  } = props;

  const profile = useSubscriberProfile({
    email: subscriberEmail,
    id: subscriberId,
  });

  const { isPremium, isActive, isLoading } = profile;

  // --- Loading state ---
  if (isLoading) {
    if (loadingFallback != null) {
      return <>{loadingFallback}</>;
    }
    return null;
  }

  // --- Headless render prop ---
  if (renderBadge) {
    return <>{renderBadge(profile)}</>;
  }

  // --- Determine tier label and data attribute ---
  const tierLabel = isPremium ? 'premium' : 'free';
  const displayLabel = isPremium ? 'Premium' : 'Free';

  // If subscriber is not active and a fallback is provided, use it
  if (!isActive && fallback != null) {
    return (
      <span
        className={className}
        data-subscriber-badge=""
        data-tier={tierLabel}
        aria-label={`${tierLabel} subscriber`}
      >
        {fallback}
      </span>
    );
  }

  return (
    <span
      className={className}
      data-subscriber-badge=""
      data-tier={tierLabel}
      aria-label={`${tierLabel} subscriber`}
    >
      <span>{displayLabel}</span>
    </span>
  );
}
