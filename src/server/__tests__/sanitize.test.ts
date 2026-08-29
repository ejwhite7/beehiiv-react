/** Security regressions for server-side beehiiv HTML sanitization. */

import { describe, expect, it } from 'vitest';
import {
  sanitizeBeehiivHtml,
  sanitizeBeehiivPostContent,
} from '../sanitize.js';

describe('sanitizeBeehiivHtml', () => {
  it.each([
    ['scripts', '<p>safe</p><script>alert(1)</script>', '<p>safe</p>'],
    [
      'event handlers',
      '<img src="https://example.com/a.png" onerror="alert(1)">',
      '<img src="https://example.com/a.png" />',
    ],
    ['dangerous URLs', '<a href="javascript:alert(1)">link</a>', '<a>link</a>'],
    ['SVG payloads', '<svg><script>alert(1)</script><circle /></svg>', ''],
    [
      'malformed markup',
      '<p><img src=x onerror=alert(1)><strong>safe',
      '<p><img src="x" /><strong>safe</strong></p>',
    ],
    ['inline styles', '<p style="background:url(javascript:alert(1))">safe</p>', '<p>safe</p>'],
  ])('removes %s', (_label, input, expected) => {
    expect(sanitizeBeehiivHtml(input)).toBe(expected);
  });

  it('adds rel protection to links that open a new browsing context', () => {
    expect(
      sanitizeBeehiivHtml(
        '<a href="https://example.com" target="_blank">safe</a>',
      ),
    ).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">safe</a>',
    );
  });

  it('sanitizes free and premium web and RSS content', () => {
    const result = sanitizeBeehiivPostContent({
      free: {
        web: '<p onclick="x">free</p>',
        rss: '<script>x</script><p>rss</p>',
      },
      premium: {
        web: '<a href="javascript:x">paid</a>',
        rss: '<svg onload="x"></svg><p>paid rss</p>',
      },
    });

    expect(result).toEqual({
      free: { web: '<p>free</p>', rss: '<p>rss</p>' },
      premium: { web: '<a>paid</a>', rss: '<p>paid rss</p>' },
    });
  });
});
