/**
 * Types for subscriber access resolution and content gating.
 *
 * These interfaces describe the inputs and outputs of access-related
 * hooks ({@link useSubscriberAccess}, {@link usePostAccess}) and the
 * gating components ({@link GatedContent}, {@link PremiumContent}).
 *
 * @module types/access
 */

import type { SubscriptionTier, SubscriptionStatus, PostAudience, BeehiivApiError } from './index.js';
import type { PostInfo } from './post.js';

/**
 * The resolved access state for a subscriber against a specific content audience.
 *
 * Returned by {@link useSubscriberAccess} after resolving the subscriber's
 * subscription and comparing it against the target audience level.
 */
export interface AccessResult {
  /** Whether the subscriber can view the content. */
  canView: boolean;
  /** The subscriber's current tier, or `null` if not subscribed / not yet resolved. */
  tier: SubscriptionTier | null;
  /** The subscriber's current status, or `null` if not subscribed / not yet resolved. */
  status: SubscriptionStatus | null;
  /** Whether the subscription is active (shorthand for `status === 'active'`). */
  isActive: boolean;
  /** Whether data is still being fetched. */
  isLoading: boolean;
  /** Error from the subscription lookup, if any. */
  error: BeehiivApiError | null;
}

/**
 * Options for the {@link useSubscriberAccess} hook.
 *
 * Provide either `email` or `id` to identify the subscriber, along with
 * the `audience` level to check access against.
 */
export interface UseSubscriberAccessOptions {
  /** Look up subscriber by email address. */
  email?: string;
  /** Look up subscriber by subscription ID. */
  id?: string;
  /** The audience/visibility level to check against. */
  audience: PostAudience;
  /**
   * If `false`, the hook does not fetch. Useful for conditional access checks.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Options for the {@link usePostAccess} hook.
 *
 * Identifies both the post and the subscriber so the hook can resolve
 * whether the subscriber has access to the post's content.
 */
export interface UsePostAccessOptions {
  /** The post ID to fetch and check access for. */
  postId: string;
  /** Look up subscriber by email address. */
  subscriberEmail?: string;
  /** Look up subscriber by subscription ID. */
  subscriberId?: string;
  /**
   * If `false`, the hook does not fetch.
   * @defaultValue true
   */
  enabled?: boolean;
}

/**
 * Return value of the {@link usePostAccess} hook.
 *
 * Combines the fetched post data with the resolved subscriber access state.
 */
export interface UsePostAccessReturn {
  /** The fetched post, or `null` if not yet loaded. */
  post: PostInfo | null;
  /** Whether the subscriber can view the post. */
  canView: boolean;
  /** The subscriber's current tier, or `null` if not subscribed / not yet resolved. */
  tier: SubscriptionTier | null;
  /** The subscriber's current status, or `null` if not subscribed / not yet resolved. */
  status: SubscriptionStatus | null;
  /** Whether the subscription is active (shorthand for `status === 'active'`). */
  isActive: boolean;
  /** Whether data is still being fetched (post or subscription). */
  isLoading: boolean;
  /** Error from post fetch or subscription lookup, if any. */
  error: BeehiivApiError | null;
  /** Manually re-trigger both the post and subscription fetches. */
  refetch: () => Promise<void>;
}
