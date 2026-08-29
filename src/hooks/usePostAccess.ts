/**
 * Hook for resolving subscriber access to a specific post.
 *
 * Fetches both the post (to determine its audience) and the subscriber's
 * subscription, then combines them via {@link canViewContent} to produce
 * a unified access result.
 *
 * @module hooks/usePostAccess
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PostInfo } from '../types/post.js';
import type { UsePostAccessOptions, UsePostAccessReturn } from '../types/access.js';
import type { BeehiivApiError } from '../types/common.js';
import { canViewContent } from '../utils/access.js';
import { useBeehiiv } from './useBeehiiv.js';
import { useSubscription } from './useSubscription.js';

/**
 * Resolves whether a subscriber has access to a specific post.
 *
 * The hook fetches the post from `{apiUrl}/posts/{postId}` and the
 * subscriber via {@link useSubscription}, then applies
 * {@link canViewContent} to determine the access decision.
 *
 * @param options - Post ID, subscriber identifier, and fetch options
 * @returns The fetched post, resolved access state, and a refetch handle
 *
 * @example
 * ```tsx
 * function PostPage({ postId }: { postId: string }) {
 *   const { post, canView, isLoading } = usePostAccess({
 *     postId,
 *     subscriberEmail: 'user@example.com',
 *   });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (!post) return <p>Post not found.</p>;
 *   if (!canView) return <p>Upgrade to read this post.</p>;
 *   return <h1>{post.title}</h1>;
 * }
 * ```
 */
export function usePostAccess(
  options: UsePostAccessOptions,
): UsePostAccessReturn {
  const { apiUrl } = useBeehiiv();
  const { postId, subscriberEmail, subscriberId, enabled = true } = options;

  const [post, setPost] = useState<PostInfo | null>(null);
  const [resolvedPostId, setResolvedPostId] = useState<string | null>(null);
  const [postLoading, setPostLoading] = useState<boolean>(false);
  const [postError, setPostError] = useState<Error | null>(null);

  // Track the current fetch so we can skip stale responses
  const fetchIdRef = useRef(0);

  /**
   * Fetch the post from the API.
   */
  const fetchPost = useCallback(async () => {
    if (!postId) return;

    const currentFetchId = ++fetchIdRef.current;
    setPost(null);
    setResolvedPostId(null);
    setPostLoading(true);
    setPostError(null);

    try {
      const url = `${apiUrl}/posts/${encodeURIComponent(postId)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch post (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: PostInfo };

      if (currentFetchId === fetchIdRef.current) {
        setPost(result.data);
        setResolvedPostId(postId);
        setPostLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setPost(null);
        setResolvedPostId(null);
        setPostError(err instanceof Error ? err : new Error(String(err)));
        setPostLoading(false);
      }
    }
  }, [apiUrl, postId]);

  // Fetch subscriber data via useSubscription
  const {
    subscription,
    isLoading: subLoading,
    error: subError,
    refetch: refetchSub,
  } = useSubscription({
    email: subscriberEmail,
    id: subscriberId,
    enabled: enabled && Boolean(subscriberEmail || subscriberId),
  });

  // Auto-fetch post on mount and when dependencies change
  useEffect(() => {
    if (enabled && postId) {
      void fetchPost();
      return () => {
        fetchIdRef.current += 1;
      };
    }

    fetchIdRef.current += 1;
    setPost(null);
    setResolvedPostId(null);
    setPostLoading(false);
    setPostError(null);
    return undefined;
  }, [enabled, postId, fetchPost]);

  // Derive access state
  const tier = subscription?.tier ?? null;
  const status = subscription?.status ?? null;
  const isActive = status === 'active';
  const isLoading = postLoading || subLoading;
  const combinedError = postError || subError;
  const canView =
    enabled &&
    !isLoading &&
    post !== null &&
    resolvedPostId === postId
      ? canViewContent(
          tier,
          status,
          post.audience,
          post.enforce_gated_content ?? true,
        )
      : false;

  /**
   * Manually re-trigger both the post and subscription fetches.
   */
  const refetch = useCallback(async () => {
    await fetchPost();
    refetchSub();
  }, [fetchPost, refetchSub]);

  return {
    post,
    canView,
    tier,
    status,
    isActive,
    isLoading,
    error: combinedError as BeehiivApiError | null,
    refetch,
  };
}
