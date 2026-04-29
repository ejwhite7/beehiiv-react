"use client";

/**
 * PremiumContent - an opinionated shortcut for gating content behind
 * a premium subscription.
 *
 * Thin wrapper around the same access-resolution pattern as
 * {@link GatedContent} with `audience` fixed to `"premium"`. Adds a
 * convenient `upgradePrompt` render prop that receives the subscriber's
 * current tier and status so the host app can render a contextual
 * upgrade CTA.
 *
 * @module components/PremiumContent
 */

import React, { useEffect, useRef } from 'react';

import type { SubscriptionTier, SubscriptionStatus } from '../types/index.js';
import type { AccessResult } from '../types/access.js';
import { useSubscriberAccess } from '../hooks/useSubscriberAccess.js';

/**
 * Props for the {@link PremiumContent} component.
 */
export interface PremiumContentProps {
  /** Subscriber email. */
  subscriberEmail?: string;
  /** Subscriber ID. */
  subscriberId?: string;
  /** Content shown to premium subscribers. */
  children: React.ReactNode;
  /**
   * Slot for an upgrade prompt shown to free/non-subscribers.
   * Receives the subscriber's current tier and status so the
   * prompt can be contextualised (e.g. "You're on the Free plan").
   */
  upgradePrompt?: (
    tier: SubscriptionTier | null,
    status: SubscriptionStatus | null,
  ) => React.ReactNode;
  /** Fallback when no `upgradePrompt` is provided. Defaults to `null`. */
  fallback?: React.ReactNode;
  /** Loading fallback. Defaults to `null`. */
  loadingFallback?: React.ReactNode;
  /** Called when access is resolved. */
  onAccessResolved?: (result: AccessResult) => void;
  /** Optional CSS class for the wrapper element. */
  className?: string;
}

/**
 * Renders children only for premium subscribers.
 *
 * When access is denied, the component renders the result of
 * `upgradePrompt(tier, status)` if provided, otherwise falls back to
 * the static `fallback` prop (which defaults to `null`).
 *
 * Internally uses {@link useSubscriberAccess} with `audience="premium"`,
 * following the same resolution semantics as {@link GatedContent}.
 *
 * @param props - Component props
 * @returns A React element wrapping the appropriate content
 *
 * @example
 * ```tsx
 * <PremiumContent
 *   subscriberEmail="user@example.com"
 *   upgradePrompt={(tier) => (
 *     <p>You are on the {tier ?? 'non-subscriber'} plan. Upgrade now!</p>
 *   )}
 *   loadingFallback={<p>Checking access...</p>}
 * >
 *   <ExclusiveArticle />
 * </PremiumContent>
 * ```
 */
export function PremiumContent(props: PremiumContentProps): React.JSX.Element {
  const {
    subscriberEmail,
    subscriberId,
    children,
    upgradePrompt,
    fallback,
    loadingFallback,
    onAccessResolved,
    className,
  } = props;

  const accessResult = useSubscriberAccess({
    email: subscriberEmail,
    id: subscriberId,
    audience: 'premium',
  });

  const { canView, isLoading, tier, status } = accessResult;

  // Fire the onAccessResolved callback once after first resolution
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !resolvedRef.current) {
      resolvedRef.current = true;
      onAccessResolved?.(accessResult);
    }
  }, [isLoading, accessResult, onAccessResolved]);

  let content: React.ReactNode;

  if (isLoading) {
    content = loadingFallback ?? null;
  } else if (canView) {
    content = children;
  } else if (upgradePrompt) {
    content = upgradePrompt(tier, status);
  } else {
    content = fallback ?? null;
  }

  return (
    <div
      className={className}
      data-audience="premium"
      data-access={canView ? 'granted' : 'denied'}
    >
      {content}
    </div>
  );
}
