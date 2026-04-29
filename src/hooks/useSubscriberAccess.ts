"use client";

/**
 * Hook for resolving subscriber access against a content audience level.
 *
 * Combines {@link useSubscription} with the pure {@link canViewContent}
 * utility to produce a single {@link AccessResult} value that components
 * can use to conditionally render gated content.
 *
 * @module hooks/useSubscriberAccess
 */

import { useMemo } from 'react';

import type { AccessResult, UseSubscriberAccessOptions } from '../types/access.js';
import type { BeehiivApiError } from '../types/common.js';
import { canViewContent } from '../utils/access.js';
import { useSubscription } from './useSubscription.js';

/**
 * Resolves whether a subscriber (identified by email or ID) has access to
 * content at the given audience level.
 *
 * Internally delegates to {@link useSubscription} for data fetching and
 * applies {@link canViewContent} to compute the access decision.
 *
 * @param options - Subscriber identifier, audience level, and fetch options
 * @returns The resolved {@link AccessResult}
 *
 * @example
 * ```tsx
 * function Article({ audience }: { audience: PostAudience }) {
 *   const { canView, isLoading } = useSubscriberAccess({
 *     email: 'user@example.com',
 *     audience,
 *   });
 *
 *   if (isLoading) return <p>Checking access...</p>;
 *   if (!canView) return <p>Upgrade to view this content.</p>;
 *   return <ArticleBody />;
 * }
 * ```
 */
export function useSubscriberAccess(
  options: UseSubscriberAccessOptions,
): AccessResult {
  const { email, id, audience, enabled = true } = options;

  const { subscription, isLoading, error } = useSubscription({
    email,
    id,
    enabled,
  });

  const tier = subscription?.tier ?? null;
  const status = subscription?.status ?? null;

  const accessResult = useMemo<AccessResult>(() => {
    const isActive = status === 'active';
    const canView = isLoading ? false : canViewContent(tier, status, audience);

    return {
      canView,
      tier,
      status,
      isActive,
      isLoading,
      error: error as BeehiivApiError | null,
    };
  }, [tier, status, audience, isLoading, error]);

  return accessResult;
}
