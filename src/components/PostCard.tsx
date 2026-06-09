/**
 * PostCard - a card component for displaying a beehiiv post summary.
 * Renders thumbnail, title, subtitle, audience badge, and publish date.
 * Supports headless rendering via the `renderPost` render prop for fully
 * custom UIs and full className-based style overrides.
 * @module components/PostCard
 */

import React, { useCallback, useMemo } from 'react';
import type { PostInfo, PostAudience } from '../types/post.js';

/**
 * Map of audience values to human-readable badge labels.
 */
const AUDIENCE_LABELS: Record<PostAudience, string> = {
  free: 'Free',
  premium: 'Premium',
  both: 'Members Only',
  all: 'Everyone',
};

/**
 * Props passed to the `renderPost` render prop for headless rendering.
 * Provides the post data along with pre-computed display values.
 */
export interface RenderPostCardProps {
  /** The full post object */
  post: PostInfo;
  /** Human-readable audience badge label ('Free' | 'Premium' | 'Members Only') */
  audienceBadgeLabel: string;
  /** Publish date formatted as "Month DD, YYYY", or `null` if unavailable */
  formattedPublishDate: string | null;
  /** Tag names associated with this post (empty array when tags are not expanded) */
  tags: string[];
}

/**
 * Props for the {@link PostCard} component.
 */
export interface PostCardProps {
  /** The post data to display */
  post: PostInfo;

  /** Additional CSS class for the card wrapper element */
  className?: string;

  /** CSS class applied to the title element */
  titleClassName?: string;

  /** CSS class applied to the subtitle element */
  subtitleClassName?: string;

  /** CSS class applied to the thumbnail image element */
  thumbnailClassName?: string;

  /** CSS class applied to the metadata container (date, badge) */
  metaClassName?: string;

  /** CSS class applied to the audience badge element */
  audienceBadgeClassName?: string;

  /** CSS class applied to the tags container element */
  tagsClassName?: string;

  /** Callback fired when the card is clicked */
  onClick?: (post: PostInfo) => void;

  /**
   * Render prop for headless mode. When provided, the default UI is not
   * rendered. Instead, this function receives pre-computed display data
   * for full custom rendering.
   */
  renderPost?: (props: RenderPostCardProps) => React.ReactNode;

  /** Whether to show the audience badge (Free/Premium/Members Only). @defaultValue true */
  showAudienceBadge?: boolean;

  /** Whether to show the publish date. @defaultValue true */
  showPublishDate?: boolean;

  /** Whether to show post tags when available. @defaultValue true */
  showTags?: boolean;

  /**
   * The HTML heading element to use for the post title.
   * @defaultValue 'h2'
   */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Format a Unix timestamp (seconds) into a human-readable date string.
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string in "Month DD, YYYY" format
 */
function formatPublishDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * A card component for displaying a beehiiv post summary.
 *
 * Renders thumbnail, title, subtitle, audience badge, and publish date
 * by default. Supports headless rendering via the `renderPost` prop.
 *
 * When an `onClick` handler is provided the card becomes interactive
 * with `role="button"`, `tabIndex={0}`, and keyboard support (Enter/Space).
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PostCard post={post} onClick={(p) => router.push(`/posts/${p.slug}`)} />
 *
 * // Headless mode
 * <PostCard
 *   post={post}
 *   renderPost={({ post, audienceBadgeLabel, formattedPublishDate }) => (
 *     <div>
 *       <h3>{post.title}</h3>
 *       <span>{audienceBadgeLabel}</span>
 *       {formattedPublishDate && <time>{formattedPublishDate}</time>}
 *     </div>
 *   )}
 * />
 * ```
 */
export function PostCard(props: PostCardProps): React.JSX.Element {
  const {
    post,
    className,
    titleClassName,
    subtitleClassName,
    thumbnailClassName,
    metaClassName,
    audienceBadgeClassName,
    tagsClassName,
    onClick,
    renderPost,
    showAudienceBadge = true,
    showPublishDate = true,
    showTags = true,
    titleAs: TitleTag = 'h2',
  } = props;

  /** Pre-compute the audience badge label */
  const audienceBadgeLabel = useMemo(
    () => AUDIENCE_LABELS[post.audience] ?? 'Free',
    [post.audience],
  );

  /** Pre-compute the formatted publish date and its ISO equivalent */
  const publishDate = useMemo(
    () =>
      post.publish_date != null
        ? {
            label: formatPublishDate(post.publish_date),
            iso: new Date(post.publish_date * 1000).toISOString(),
          }
        : null,
    [post.publish_date],
  );
  const formattedPublishDate = publishDate?.label ?? null;

  /**
   * Handle click events on the card.
   */
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(post);
    }
  }, [onClick, post]);

  /**
   * Handle keyboard events for accessibility.
   * Triggers onClick on Enter or Space key press.
   *
   * @param e - The keyboard event
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(post);
      }
    },
    [onClick, post],
  );

  // Headless mode: delegate all rendering to the consumer
  if (renderPost) {
    return (
      <>
        {renderPost({
          post,
          audienceBadgeLabel,
          formattedPublishDate,
          tags: post.tags ?? [],
        })}
      </>
    );
  }

  /** Interactive props applied when the card has an onClick handler */
  const interactiveProps = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        style: { cursor: 'pointer' },
      }
    : {};

  return (
    <div
      className={className}
      role={onClick ? 'button' : 'article'}
      aria-label={post.title}
      {...interactiveProps}
    >
      {/* Thumbnail */}
      {post.thumbnail_url && (
        <img
          src={post.thumbnail_url}
          alt={`Thumbnail for ${post.title}`}
          className={thumbnailClassName}
          loading="lazy"
        />
      )}

      {/* Audience badge */}
      {showAudienceBadge && (
        <span className={audienceBadgeClassName} aria-label="Audience">
          {audienceBadgeLabel}
        </span>
      )}

      {/* Title */}
      <TitleTag className={titleClassName}>{post.title}</TitleTag>

      {/* Subtitle */}
      {post.subtitle && (
        <p className={subtitleClassName}>{post.subtitle}</p>
      )}

      {/* Tags */}
      {showTags && post.tags && post.tags.length > 0 && (
        <div className={tagsClassName} role="list" aria-label="Tags">
          {post.tags.map((tag) => (
            <span key={tag} role="listitem" className="beehiiv-post-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      {showPublishDate && publishDate && (
        <div className={metaClassName}>
          <time dateTime={publishDate.iso}>{publishDate.label}</time>
        </div>
      )}
    </div>
  );
}
