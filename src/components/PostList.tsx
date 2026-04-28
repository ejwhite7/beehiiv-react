/**
 * PostList - a list component for rendering multiple beehiiv posts.
 * Renders a `<ul>` of {@link PostCard} components with support for loading,
 * empty, and "load more" states. Supports custom rendering of individual
 * posts, empty state, and loading state via render props.
 * @module components/PostList
 */

import React, { useCallback } from 'react';
import type { PostInfo } from '../types/post.js';
import { PostCard } from './PostCard.js';
import type { PostCardProps } from './PostCard.js';

/**
 * Props for the {@link PostList} component.
 */
export interface PostListProps {
  /** Array of posts to display */
  posts: PostInfo[];

  /** Whether the initial post data is loading */
  isLoading?: boolean;

  /** Whether there are more posts available to load */
  hasMore?: boolean;

  /** Callback fired when the "Load more" button is clicked */
  onLoadMore?: () => void;

  /** Whether additional posts are currently being fetched */
  isLoadingMore?: boolean;

  /** Additional CSS class for the outermost wrapper element */
  className?: string;

  /** CSS class applied to the `<ul>` list element */
  listClassName?: string;

  /** CSS class applied to each `<li>` list item element */
  itemClassName?: string;

  /** CSS class applied to the "Load more" button */
  loadMoreClassName?: string;

  /** Text label for the "Load more" button. @defaultValue 'Load more' */
  loadMoreLabel?: string;

  /** Text shown while posts are loading. @defaultValue 'Loading...' */
  loadingLabel?: string;

  /** Text shown when no posts are found. @defaultValue 'No posts found.' */
  emptyLabel?: string;

  /**
   * Props forwarded to each {@link PostCard} (excluding `post`).
   * Useful for setting shared className overrides, onClick, etc.
   */
  postCardProps?: Omit<PostCardProps, 'post'>;

  /**
   * Fully custom render function for each post item.
   * When provided, replaces the default `<PostCard>` rendering.
   */
  renderPost?: (post: PostInfo, index: number) => React.ReactNode;

  /** Custom render function for the empty state */
  renderEmpty?: () => React.ReactNode;

  /** Custom render function for the loading state */
  renderLoading?: () => React.ReactNode;
}

/**
 * A list component for rendering multiple beehiiv posts.
 *
 * Renders a `<ul>` containing a `<PostCard>` for each post. Supports
 * loading skeletons, empty state messaging, and a "Load more" button
 * for paginated data.
 *
 * All sub-states (loading, empty) and individual post items can be
 * customised via render props.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PostList
 *   posts={posts}
 *   isLoading={isLoading}
 *   hasMore={hasNextPage}
 *   onLoadMore={fetchNextPage}
 *   isLoadingMore={isFetchingNextPage}
 * />
 *
 * // With custom post rendering
 * <PostList
 *   posts={posts}
 *   renderPost={(post, index) => (
 *     <div key={post.id}>{post.title}</div>
 *   )}
 * />
 * ```
 */
export function PostList(props: PostListProps): React.JSX.Element {
  const {
    posts,
    isLoading = false,
    hasMore = false,
    onLoadMore,
    isLoadingMore = false,
    className,
    listClassName,
    itemClassName,
    loadMoreClassName,
    loadMoreLabel = 'Load more',
    loadingLabel = 'Loading...',
    emptyLabel = 'No posts found.',
    postCardProps,
    renderPost,
    renderEmpty,
    renderLoading,
  } = props;

  /**
   * Handle the "Load more" button click.
   */
  const handleLoadMore = useCallback(() => {
    if (onLoadMore) {
      onLoadMore();
    }
  }, [onLoadMore]);

  // Loading state: show skeleton or custom loading UI
  if (isLoading && posts.length === 0) {
    if (renderLoading) {
      return <div className={className}>{renderLoading()}</div>;
    }

    return (
      <div className={className} role="status" aria-label={loadingLabel}>
        <div className="beehiiv-post-skeleton animate-pulse" />
        <div className="beehiiv-post-skeleton animate-pulse" />
        <div className="beehiiv-post-skeleton animate-pulse" />
      </div>
    );
  }

  // Empty state: show message or custom empty UI
  if (posts.length === 0 && !isLoading) {
    if (renderEmpty) {
      return <div className={className}>{renderEmpty()}</div>;
    }

    return (
      <div className={className} role="status">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className={listClassName} role="list">
        {posts.map((post, index) => (
          <li key={post.id} className={itemClassName}>
            {renderPost
              ? renderPost(post, index)
              : <PostCard post={post} {...postCardProps} />}
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          className={loadMoreClassName}
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          aria-busy={isLoadingMore}
        >
          {isLoadingMore ? loadingLabel : loadMoreLabel}
        </button>
      )}
    </div>
  );
}
