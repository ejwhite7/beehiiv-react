/**
 * PostContentRenderer - renders the body content of a beehiiv post.
 * Reads from the `free.web` (or `free.rss`) field of the API response.
 * Users should provide their own `sanitizeHtml` implementation (e.g.,
 * `DOMPurify.sanitize`) to prevent XSS. The component does not bundle a
 * sanitizer to keep the package lightweight.
 * @module components/PostContentRenderer
 */

import React from 'react';
import type { PostContent } from '../types/post.js';

/**
 * Props for the {@link PostContentRenderer} component.
 *
 * **Security note:** When rendering HTML content the component uses
 * `dangerouslySetInnerHTML`. You should always provide a `sanitizeHtml`
 * callback (e.g. wrapping `DOMPurify.sanitize`) to prevent XSS attacks.
 * The component intentionally does not bundle a sanitizer to keep the
 * package dependency-free and lightweight.
 */
export interface PostContentRendererProps {
  /** The post content object, or `null` when content is unavailable */
  content: PostContent | null;

  /** Additional CSS class for the content wrapper element */
  className?: string;

  /**
   * Which content field to render.
   * - `'web'` — the web-optimised HTML (default)
   * - `'rss'` — the RSS / email HTML
   * @defaultValue 'web'
   */
  variant?: 'web' | 'rss';

  /**
   * Which audience tier to render.
   * - `'free'` — free subscriber content (default)
   * - `'premium'` — premium subscriber content
   * @defaultValue 'free'
   */
  tier?: 'free' | 'premium';

  /**
   * Optional sanitiser called with the raw HTML string before rendering.
   * Return the sanitised HTML string.
   *
   * @example
   * ```tsx
   * import DOMPurify from 'dompurify';
   * <PostContentRenderer content={content} sanitizeHtml={DOMPurify.sanitize} />
   * ```
   */
  sanitizeHtml?: (html: string) => string;

  /**
   * Fallback UI rendered when `content` is `null` or the requested
   * tier/variant is unavailable.
   */
  fallback?: React.ReactNode;
}

/**
 * Renders the body content of a beehiiv post.
 *
 * Reads from the beehiiv API content shape `{ free: { web, rss }, premium?: { web, rss } }`.
 * By default renders `content.free.web`. Use the `tier` and `variant` props
 * to select a different field.
 *
 * When `content` is `null` or the selected tier is unavailable, the optional
 * `fallback` prop is rendered (or nothing).
 *
 * @example
 * ```tsx
 * import DOMPurify from 'dompurify';
 *
 * <PostContentRenderer
 *   content={post.content}
 *   sanitizeHtml={DOMPurify.sanitize}
 *   className="prose"
 * />
 * ```
 */
export function PostContentRenderer(props: PostContentRendererProps): React.JSX.Element {
  const {
    content,
    className,
    variant = 'web',
    tier = 'free',
    sanitizeHtml,
    fallback,
  } = props;

  // Null / missing content
  if (content === null || content === undefined) {
    return <>{fallback ?? null}</>;
  }

  // Resolve the tier data
  const tierData = content[tier];
  if (!tierData) {
    return <>{fallback ?? null}</>;
  }

  // Get the raw HTML from the selected variant
  const rawHtml = tierData[variant] ?? '';
  const html = sanitizeHtml ? sanitizeHtml(rawHtml) : rawHtml;

  return (
    <div
      className={className ? `beehiiv-post-content ${className}` : 'beehiiv-post-content'}
      data-tier={tier}
      data-variant={variant}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
