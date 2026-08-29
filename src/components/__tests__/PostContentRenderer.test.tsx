/**
 * Tests for the PostContentRenderer component.
 * Covers HTML rendering from the beehiiv API wire format
 * { free: { rss, web }, premium?: { rss, web } },
 * sanitisation callback, tier/variant selection,
 * fallback behaviour, and CSS class application.
 * @module components/__tests__/PostContentRenderer.test
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostContentRenderer } from '../PostContentRenderer';
import type { PostContent } from '../../types/post';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PostContentRenderer', () => {
  // ---- HTML Content (free.web) ----
  describe('HTML content', () => {
    it('fails closed when HTML has not been sanitized', () => {
      const content: PostContent = {
        free: {
          web: '<p>Hello <strong>world</strong></p>',
          rss: '<p>Hello world (rss)</p>',
        },
      };

      const { container } = render(<PostContentRenderer content={content} />);

      expect(container.innerHTML).toBe('');
    });

    it('renders content after an explicit sanitized assertion', () => {
      const content: PostContent = {
        free: { web: '<p>Sanitized</p>', rss: '' },
      };

      const { container } = render(
        <PostContentRenderer content={content} htmlIsSanitized />,
      );

      expect(container.querySelector('.beehiiv-post-content')?.innerHTML).toBe(
        '<p>Sanitized</p>',
      );
    });

    it('calls sanitizeHtml when provided', () => {
      const sanitize = vi.fn((html: string) => html.replace(/<script.*?<\/script>/g, ''));

      const content: PostContent = {
        free: {
          web: '<p>Safe</p><script>alert("xss")</script>',
          rss: '',
        },
      };

      const { container } = render(
        <PostContentRenderer content={content} sanitizeHtml={sanitize} />,
      );

      expect(sanitize).toHaveBeenCalledTimes(1);
      expect(sanitize).toHaveBeenCalledWith('<p>Safe</p><script>alert("xss")</script>');

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.innerHTML).toBe('<p>Safe</p>');
    });

    it('sets data-variant="web" and data-tier="free" on the wrapper', () => {
      const content: PostContent = {
        free: { web: '<p>Test</p>', rss: '' },
      };

      const { container } = render(
        <PostContentRenderer content={content} htmlIsSanitized />,
      );

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.getAttribute('data-variant')).toBe('web');
      expect(wrapper?.getAttribute('data-tier')).toBe('free');
    });
  });

  // ---- RSS variant ----
  describe('RSS variant', () => {
    it('renders free.rss when variant is rss', () => {
      const content: PostContent = {
        free: { web: '<p>Web content</p>', rss: '<p>RSS content</p>' },
      };

      const { container } = render(
        <PostContentRenderer content={content} variant="rss" htmlIsSanitized />,
      );

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.innerHTML).toBe('<p>RSS content</p>');
      expect(wrapper?.getAttribute('data-variant')).toBe('rss');
    });
  });

  // ---- Premium tier ----
  describe('Premium tier', () => {
    it('renders premium.web when tier is premium', () => {
      const content: PostContent = {
        free: { web: '<p>Free</p>', rss: '' },
        premium: { web: '<p>Premium content</p>', rss: '' },
      };

      const { container } = render(
        <PostContentRenderer content={content} tier="premium" htmlIsSanitized />,
      );

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.innerHTML).toBe('<p>Premium content</p>');
      expect(wrapper?.getAttribute('data-tier')).toBe('premium');
    });

    it('renders fallback when premium tier is unavailable', () => {
      const content: PostContent = {
        free: { web: '<p>Free only</p>', rss: '' },
      };

      render(
        <PostContentRenderer
          content={content}
          tier="premium"
          fallback={<p>No premium content</p>}
        />,
      );

      expect(screen.getByText('No premium content')).toBeDefined();
    });
  });

  // ---- Null / Fallback ----
  describe('null content and fallback', () => {
    it('renders fallback when content is null', () => {
      render(
        <PostContentRenderer content={null} fallback={<p>No content available</p>} />,
      );

      expect(screen.getByText('No content available')).toBeDefined();
    });

    it('renders nothing when content is null and no fallback is provided', () => {
      const { container } = render(<PostContentRenderer content={null} />);

      expect(container.innerHTML).toBe('');
    });
  });

  // ---- className ----
  describe('className', () => {
    it('applies className alongside beehiiv-post-content', () => {
      const content: PostContent = {
        free: { web: '<p>Hi</p>', rss: '' },
      };

      const { container } = render(
        <PostContentRenderer content={content} className="prose" htmlIsSanitized />,
      );

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.classList.contains('prose')).toBe(true);
      expect(wrapper?.classList.contains('beehiiv-post-content')).toBe(true);
    });
  });
});
