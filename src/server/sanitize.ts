/** Server-side sanitization for beehiiv post HTML. */

import sanitizeHtml from 'sanitize-html';
import type { PostContent } from '../types/post.js';

/**
 * Sanitize one beehiiv HTML fragment using a conservative rich-text policy.
 * Scripts, embedded documents, event handlers, inline styles, SVG, and unsafe
 * URL schemes are removed.
 */
export function sanitizeBeehiivHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: 'a',
        attribs:
          attributes.target === '_blank'
            ? { ...attributes, rel: 'noopener noreferrer' }
            : attributes,
      }),
    },
  });
}

/** Sanitize every available tier and variant in a post content object. */
export function sanitizeBeehiivPostContent(
  content: PostContent | null,
): PostContent | null {
  if (!content) return null;

  return {
    free: {
      web: sanitizeBeehiivHtml(content.free.web),
      rss: sanitizeBeehiivHtml(content.free.rss),
    },
    ...(content.premium
      ? {
          premium: {
            web: sanitizeBeehiivHtml(content.premium.web),
            rss: sanitizeBeehiivHtml(content.premium.rss),
          },
        }
      : {}),
  };
}
