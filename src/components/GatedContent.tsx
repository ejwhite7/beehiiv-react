"use client";

/**
 * GatedContent - a declarative component for conditionally rendering
 * content based on subscriber access level.
 *
 * Resolves the subscriber's access against the specified audience via
 * {@link useSubscriberAccess} and renders children, fallback, or loading
 * content accordingly.
 *
 * @module components/GatedContent
 */

import React, { useEffect, useRef } from 'react';

import type { PostAudience } from '../types/index.js';
import type { AccessResult } from '../types/access.js';
import { useSubscriberAccess } from '../hooks/useSubscriberAccess.js';

/**
 * Props for the {@link GatedContent} component.
 */
export interface GatedContentProps {
  /** The audience/visibility level required to view the children. */
  audience: PostAudience;
  /** Subscriber email to resolve access for. */
  subscriberEmail?: string;
  /** Subscriber ID to resolve access for. */
  subscriberId?: string;
  /** Content to show when access is granted. */
  children: React.ReactNode;
  /** Content to show when access is denied or subscriber is not resolved. */
  fallback?: React.ReactNode;
  /** Content to show while access is being resolved. */
  loadingFallback?: React.ReactNode;
  /** Called when access resolution completes. */
  onAccessResolved?: (result: AccessResult) => void;
  /** Optional CSS class for the wrapper element. */
  className?: string;
}

/**
 * Conditionally renders children based on subscriber access to gated content.
 *
 * - While loading: renders `loadingFallback` if provided, otherwise `null`.
 * - When `canView === true`: renders `children`.
 * - When `canView === false`: renders `fallback` if provided, otherwise `null`.
 *
 * The wrapper `<div>` always includes `data-audience` and `data-access`
 * attributes for styling and testing convenience.
 *
 * @param props - Component props
 * @returns A React element wrapping the appropriate content
 *
 * @example
 * ```tsx
 * <GatedContent
 *   audience="premium"
 *   subscriberEmail="user@example.com"
 *   fallback={<p>Upgrade to premium to read this.</p>}
 *   loadingFallback={<p>Checking access...</p>}
 * >
 *   <PremiumArticleBody />
 * </GatedContent>
 * ```
 */
export function GatedContent(props: GatedContentProps): React.JSX.Element {
  const {
    audience,
    subscriberEmail,
    subscriberId,
    children,
    fallback,
    loadingFallback,
    onAccessResolved,
    className,
  } = props;

  const accessResult = useSubscriberAccess({
    email: subscriberEmail,
    id: subscriberId,
    audience,
  });

  const { canView, isLoading } = accessResult;

  // Track whether we've already fired the callback
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
  } else {
    content = fallback ?? null;
  }

  return (
    <div
      className={className}
      data-audience={audience}
      data-access={canView ? 'granted' : 'denied'}
    >
      {content}
    </div>
  );
}
