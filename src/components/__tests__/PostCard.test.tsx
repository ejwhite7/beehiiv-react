/**
 * Tests for the PostCard component.
 * Covers default rendering, audience badge labels, click/keyboard interaction,
 * headless mode, and visibility toggles for badge and date.
 * @module components/__tests__/PostCard.test
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostCard } from '../PostCard';
import type { PostInfo, PostAudience } from '../../types/post';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Create a minimal PostInfo object for testing.
 *
 * @param overrides - Partial PostInfo fields to override defaults
 * @returns A complete PostInfo fixture
 */
function makePost(overrides: Partial<PostInfo> = {}): PostInfo {
  return {
    id: 'post_test_001',
    publication_id: 'pub_test_001',
    title: 'Test Post Title',
    subtitle: 'A short subtitle for the post',
    slug: 'test-post-title',
    status: 'confirmed',
    audience: 'free',
    web_url: 'https://example.com/p/test-post-title',
    thumbnail_url: 'https://example.com/images/thumb.jpg',
    created_at: 1700000000,
    publish_date: 1700000000, // Nov 14, 2023
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PostCard', () => {
  // ---- Default Render ----
  describe('default render', () => {
    it('renders the title, subtitle, thumbnail, and publish date', () => {
      render(<PostCard post={makePost()} />);

      expect(screen.getByText('Test Post Title')).toBeDefined();
      expect(screen.getByText('A short subtitle for the post')).toBeDefined();

      const img = screen.getByRole('img');
      expect(img.getAttribute('src')).toBe('https://example.com/images/thumb.jpg');
      expect(img.getAttribute('loading')).toBe('lazy');

      // "November 14, 2023"
      expect(screen.getByText('November 14, 2023')).toBeDefined();
    });

    it('does not render thumbnail when thumbnail_url is absent', () => {
      render(<PostCard post={makePost({ thumbnail_url: undefined })} />);

      expect(screen.queryByRole('img')).toBeNull();
    });

    it('does not render subtitle when subtitle is absent', () => {
      render(<PostCard post={makePost({ subtitle: undefined })} />);

      expect(screen.queryByText('A short subtitle for the post')).toBeNull();
    });

    it('renders the title with the default h2 heading', () => {
      const { container } = render(<PostCard post={makePost()} />);

      const heading = container.querySelector('h2');
      expect(heading).not.toBeNull();
      expect(heading?.textContent).toBe('Test Post Title');
    });

    it('renders the title with a custom heading tag', () => {
      const { container } = render(<PostCard post={makePost()} titleAs="h3" />);

      const heading = container.querySelector('h3');
      expect(heading).not.toBeNull();
      expect(heading?.textContent).toBe('Test Post Title');
    });
  });

  // ---- Audience Badge Labels ----
  describe('audience badge', () => {
    it('shows "Free" for free audience', () => {
      render(<PostCard post={makePost({ audience: 'free' })} />);
      expect(screen.getByText('Free')).toBeDefined();
    });

    it('shows "Premium" for premium audience', () => {
      render(<PostCard post={makePost({ audience: 'premium' })} />);
      expect(screen.getByText('Premium')).toBeDefined();
    });

    it('shows "Members Only" for all audience', () => {
      render(<PostCard post={makePost({ audience: 'all' })} />);
      expect(screen.getByText('Members Only')).toBeDefined();
    });
  });

  // ---- Click & Keyboard Interaction ----
  describe('onClick interaction', () => {
    it('fires onClick when the card is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const post = makePost();

      render(<PostCard post={post} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(post);
    });

    it('fires onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const post = makePost();

      render(<PostCard post={post} onClick={handleClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(post);
    });

    it('fires onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const post = makePost();

      render(<PostCard post={post} onClick={handleClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(post);
    });

    it('renders role="article" when onClick is not provided', () => {
      render(<PostCard post={makePost()} />);

      expect(screen.getByRole('article')).toBeDefined();
    });

    it('renders role="button" with tabIndex when onClick is provided', () => {
      render(<PostCard post={makePost()} onClick={() => {}} />);

      const card = screen.getByRole('button');
      expect(card.getAttribute('tabindex')).toBe('0');
    });
  });

  // ---- Headless Mode ----
  describe('headless mode (renderPost)', () => {
    it('renders custom UI via renderPost', () => {
      const post = makePost({ audience: 'premium' });

      render(
        <PostCard
          post={post}
          renderPost={({ post: p, audienceBadgeLabel, formattedPublishDate }) => (
            <div data-testid="custom-card">
              <span>{p.title}</span>
              <span>{audienceBadgeLabel}</span>
              <span>{formattedPublishDate}</span>
            </div>
          )}
        />,
      );

      expect(screen.getByTestId('custom-card')).toBeDefined();
      expect(screen.getByText('Test Post Title')).toBeDefined();
      expect(screen.getByText('Premium')).toBeDefined();
      expect(screen.getByText('November 14, 2023')).toBeDefined();
    });

    it('does not render the default UI when renderPost is provided', () => {
      render(
        <PostCard
          post={makePost()}
          renderPost={() => <div>Custom</div>}
        />,
      );

      expect(screen.queryByRole('article')).toBeNull();
      expect(screen.queryByRole('img')).toBeNull();
    });
  });

  // ---- Visibility Toggles ----
  describe('visibility toggles', () => {
    it('hides the audience badge when showAudienceBadge=false', () => {
      render(<PostCard post={makePost()} showAudienceBadge={false} />);

      expect(screen.queryByText('Free')).toBeNull();
    });

    it('hides the publish date when showPublishDate=false', () => {
      render(<PostCard post={makePost()} showPublishDate={false} />);

      expect(screen.queryByText('November 14, 2023')).toBeNull();
    });
  });

  // ---- className Props ----
  describe('className props', () => {
    it('applies className to the card wrapper', () => {
      const { container } = render(
        <PostCard post={makePost()} className="my-card" />,
      );

      expect(container.firstElementChild?.classList.contains('my-card')).toBe(true);
    });

    it('applies titleClassName to the title element', () => {
      const { container } = render(
        <PostCard post={makePost()} titleClassName="my-title" />,
      );

      const heading = container.querySelector('h2');
      expect(heading?.classList.contains('my-title')).toBe(true);
    });
  });
});
