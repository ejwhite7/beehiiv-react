/**
 * Tests for the PostContent component.
 * Covers HTML rendering, sanitisation callback, JSON rendering,
 * fallback behaviour, and the data-format attribute.
 * @module components/__tests__/PostContent.test
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostContent } from '../PostContent';
import type { PostContentData } from '../PostContent';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PostContent', () => {
  // ---- HTML Content ----
  describe('HTML content', () => {
    it('renders HTML content via dangerouslySetInnerHTML', () => {
      const content: PostContentData = {
        format: 'html',
        body: '<p>Hello <strong>world</strong></p>',
      };

      const { container } = render(<PostContent content={content} />);

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper).not.toBeNull();
      expect(wrapper?.innerHTML).toBe('<p>Hello <strong>world</strong></p>');
    });

    it('calls sanitizeHtml when provided', () => {
      const sanitize = vi.fn((html: string) => html.replace(/<script.*?<\/script>/g, ''));

      const content: PostContentData = {
        format: 'html',
        body: '<p>Safe</p><script>alert("xss")</script>',
      };

      const { container } = render(
        <PostContent content={content} sanitizeHtml={sanitize} />,
      );

      expect(sanitize).toHaveBeenCalledTimes(1);
      expect(sanitize).toHaveBeenCalledWith('<p>Safe</p><script>alert("xss")</script>');

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.innerHTML).toBe('<p>Safe</p>');
    });

    it('sets data-format="html" on the wrapper', () => {
      const content: PostContentData = { format: 'html', body: '<p>Test</p>' };

      const { container } = render(<PostContent content={content} />);

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.getAttribute('data-format')).toBe('html');
    });
  });

  // ---- JSON Content ----
  describe('JSON content', () => {
    it('calls renderJsonContent for JSON format', () => {
      const doc = { type: 'doc', nodes: [] };
      const content: PostContentData = { format: 'json', body: doc };
      const renderJson = vi.fn((d: Record<string, unknown>) => (
        <div data-testid="json-render">{String(d.type)}</div>
      ));

      render(
        <PostContent content={content} renderJsonContent={renderJson} />,
      );

      expect(renderJson).toHaveBeenCalledTimes(1);
      expect(renderJson).toHaveBeenCalledWith(doc);
      expect(screen.getByTestId('json-render')).toBeDefined();
      expect(screen.getByText('doc')).toBeDefined();
    });

    it('renders a pre tag with JSON.stringify when renderJsonContent is not provided', () => {
      const doc = { key: 'value' };
      const content: PostContentData = { format: 'json', body: doc };

      const { container } = render(<PostContent content={content} />);

      const pre = container.querySelector('pre');
      expect(pre).not.toBeNull();
      expect(pre?.textContent).toBe(JSON.stringify(doc, null, 2));
    });

    it('sets data-format="json" on the wrapper', () => {
      const content: PostContentData = { format: 'json', body: {} };

      const { container } = render(<PostContent content={content} />);

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.getAttribute('data-format')).toBe('json');
    });
  });

  // ---- Null / Fallback ----
  describe('null content and fallback', () => {
    it('renders fallback when content is null', () => {
      render(
        <PostContent content={null} fallback={<p>No content available</p>} />,
      );

      expect(screen.getByText('No content available')).toBeDefined();
    });

    it('renders nothing when content is null and no fallback is provided', () => {
      const { container } = render(<PostContent content={null} />);

      expect(container.innerHTML).toBe('');
    });
  });

  // ---- className ----
  describe('className', () => {
    it('applies className alongside beehiiv-post-content', () => {
      const content: PostContentData = { format: 'html', body: '<p>Hi</p>' };

      const { container } = render(
        <PostContent content={content} className="prose" />,
      );

      const wrapper = container.querySelector('.beehiiv-post-content');
      expect(wrapper?.classList.contains('prose')).toBe(true);
      expect(wrapper?.classList.contains('beehiiv-post-content')).toBe(true);
    });
  });
});
