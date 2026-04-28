/**
 * PostContent - renders the body content of a beehiiv post.
 * Supports HTML (via `dangerouslySetInnerHTML`), JSON, and fallback modes.
 * Users should provide their own `sanitizeHtml` implementation (e.g.,
 * `DOMPurify.sanitize`) to prevent XSS. The component does not bundle a
 * sanitizer to keep the package lightweight.
 * @module components/PostContent
 */

import React from 'react';

/**
 * Represents structured post content with a known format.
 *
 * When `format` is `'html'`, `body` contains an HTML string.
 * When `format` is `'json'`, `body` contains a parsed JSON document.
 */
export interface PostContentData {
  /** The serialisation format of the content body */
  format: 'html' | 'json';
  /** The content body — HTML string or JSON document */
  body: string | Record<string, unknown>;
}

/**
 * Props for the {@link PostContent} component.
 *
 * **Security note:** When rendering HTML content the component uses
 * `dangerouslySetInnerHTML`. You should always provide a `sanitizeHtml`
 * callback (e.g. wrapping `DOMPurify.sanitize`) to prevent XSS attacks.
 * The component intentionally does not bundle a sanitizer to keep the
 * package dependency-free and lightweight.
 */
export interface PostContentProps {
  /** The post content object, or `null` when content is unavailable */
  content: PostContentData | null;

  /** Additional CSS class for the content wrapper element */
  className?: string;

  /**
   * Optional sanitiser called with the raw HTML string before rendering.
   * Return the sanitised HTML string.
   *
   * @example
   * ```tsx
   * import DOMPurify from 'dompurify';
   * <PostContent content={content} sanitizeHtml={DOMPurify.sanitize} />
   * ```
   */
  sanitizeHtml?: (html: string) => string;

  /**
   * Custom renderer for JSON-format content.
   * Receives the parsed JSON document and should return React nodes.
   */
  renderJsonContent?: (document: Record<string, unknown>) => React.ReactNode;

  /**
   * Fallback UI rendered when `content` is `null` or the format is
   * unrecognised.
   */
  fallback?: React.ReactNode;
}

/**
 * Renders the body content of a beehiiv post.
 *
 * Supports two content formats:
 * - **HTML** — rendered via `dangerouslySetInnerHTML` with an optional
 *   `sanitizeHtml` callback for XSS prevention.
 * - **JSON** — rendered via `renderJsonContent` or a `<pre>` debug fallback.
 *
 * When `content` is `null` or the format is unrecognised, the optional
 * `fallback` prop is rendered (or nothing).
 *
 * A `data-format` attribute is added to the wrapper for CSS targeting.
 *
 * @example
 * ```tsx
 * import DOMPurify from 'dompurify';
 *
 * <PostContent
 *   content={{ format: 'html', body: post.content_html }}
 *   sanitizeHtml={DOMPurify.sanitize}
 *   className="prose"
 * />
 * ```
 */
export function PostContent(props: PostContentProps): React.JSX.Element {
  const {
    content,
    className,
    sanitizeHtml,
    renderJsonContent,
    fallback,
  } = props;

  // Null / missing content
  if (content === null || content === undefined) {
    return <>{fallback ?? null}</>;
  }

  // HTML format
  if (content.format === 'html') {
    const rawHtml = typeof content.body === 'string' ? content.body : '';
    const html = sanitizeHtml ? sanitizeHtml(rawHtml) : rawHtml;

    return (
      <div
        className={className ? `beehiiv-post-content ${className}` : 'beehiiv-post-content'}
        data-format="html"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // JSON format
  if (content.format === 'json') {
    const doc =
      typeof content.body === 'object' && content.body !== null
        ? (content.body as Record<string, unknown>)
        : {};

    if (renderJsonContent) {
      return (
        <div
          className={className ? `beehiiv-post-content ${className}` : 'beehiiv-post-content'}
          data-format="json"
        >
          {renderJsonContent(doc)}
        </div>
      );
    }

    return (
      <div
        className={className ? `beehiiv-post-content ${className}` : 'beehiiv-post-content'}
        data-format="json"
      >
        <pre>{JSON.stringify(doc, null, 2)}</pre>
      </div>
    );
  }

  // Unrecognised format — render fallback
  return <>{fallback ?? null}</>;
}
