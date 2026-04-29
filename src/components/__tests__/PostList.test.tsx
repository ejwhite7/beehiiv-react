/**
 * Tests for the PostList component.
 * Covers list rendering, loading state, empty state, load more button,
 * and custom render props.
 * @module components/__tests__/PostList.test
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostList } from '../PostList';
import type { PostInfo } from '../../types/post';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Create a minimal PostInfo object for testing.
 *
 * @param id - Unique identifier suffix
 * @param title - Post title
 * @returns A complete PostInfo fixture
 */
function makePost(id: string, title: string): PostInfo {
  return {
    id,
    publication_id: 'pub_test',
    title,
    status: 'confirmed',
    audience: 'free',
    created_at: 1700000000,
    publish_date: 1700000000,
  };
}

/** A small set of posts for list tests */
const samplePosts: PostInfo[] = [
  makePost('post_1', 'First Post'),
  makePost('post_2', 'Second Post'),
  makePost('post_3', 'Third Post'),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PostList', () => {
  // ---- List Rendering ----
  describe('list rendering', () => {
    it('renders a list of posts', () => {
      render(<PostList posts={samplePosts} />);

      const list = screen.getByRole('list');
      expect(list).toBeDefined();

      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(3);

      expect(screen.getByText('First Post')).toBeDefined();
      expect(screen.getByText('Second Post')).toBeDefined();
      expect(screen.getByText('Third Post')).toBeDefined();
    });

    it('renders posts using custom renderPost', () => {
      render(
        <PostList
          posts={samplePosts}
          renderPost={(post) => (
            <div key={post.id} data-testid={`custom-${post.id}`}>
              {post.title} (custom)
            </div>
          )}
        />,
      );

      expect(screen.getByTestId('custom-post_1')).toBeDefined();
      expect(screen.getByText('First Post (custom)')).toBeDefined();
    });
  });

  // ---- Loading State ----
  describe('loading state', () => {
    it('shows loading skeleton when isLoading=true and posts is empty', () => {
      const { container } = render(
        <PostList posts={[]} isLoading={true} />,
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('renders custom loading UI via renderLoading', () => {
      render(
        <PostList
          posts={[]}
          isLoading={true}
          renderLoading={() => <p>Loading custom...</p>}
        />,
      );

      expect(screen.getByText('Loading custom...')).toBeDefined();
    });

    it('does not show loading state when posts are present', () => {
      const { container } = render(
        <PostList posts={samplePosts} isLoading={true} />,
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(0);
      expect(screen.getByRole('list')).toBeDefined();
    });
  });

  // ---- Empty State ----
  describe('empty state', () => {
    it('shows empty message when posts=[] and not loading', () => {
      render(<PostList posts={[]} />);

      expect(screen.getByText('No posts found.')).toBeDefined();
    });

    it('shows custom empty label', () => {
      render(<PostList posts={[]} emptyLabel="Nothing here yet." />);

      expect(screen.getByText('Nothing here yet.')).toBeDefined();
    });

    it('renders custom empty UI via renderEmpty', () => {
      render(
        <PostList
          posts={[]}
          renderEmpty={() => <p>No content available</p>}
        />,
      );

      expect(screen.getByText('No content available')).toBeDefined();
    });
  });

  // ---- Load More ----
  describe('load more button', () => {
    it('shows load more button when hasMore=true', () => {
      render(<PostList posts={samplePosts} hasMore={true} />);

      const button = screen.getByRole('button', { name: 'Load more' });
      expect(button).toBeDefined();
    });

    it('does not show load more button when hasMore=false', () => {
      render(<PostList posts={samplePosts} hasMore={false} />);

      expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    });

    it('disables button and shows loading label when isLoadingMore=true', () => {
      render(
        <PostList
          posts={samplePosts}
          hasMore={true}
          isLoadingMore={true}
        />,
      );

      const button = screen.getByRole('button', { name: 'Loading...' });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('calls onLoadMore when button is clicked', async () => {
      const user = userEvent.setup();
      const handleLoadMore = vi.fn();

      render(
        <PostList
          posts={samplePosts}
          hasMore={true}
          onLoadMore={handleLoadMore}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Load more' }));
      expect(handleLoadMore).toHaveBeenCalledTimes(1);
    });

    it('uses custom loadMoreLabel', () => {
      render(
        <PostList
          posts={samplePosts}
          hasMore={true}
          loadMoreLabel="Show more posts"
        />,
      );

      expect(screen.getByRole('button', { name: 'Show more posts' })).toBeDefined();
    });
  });

  // ---- className Props ----
  describe('className props', () => {
    it('applies className to the wrapper element', () => {
      const { container } = render(
        <PostList posts={samplePosts} className="my-list-wrapper" />,
      );

      expect(container.firstElementChild?.classList.contains('my-list-wrapper')).toBe(true);
    });

    it('applies listClassName to the ul element', () => {
      render(<PostList posts={samplePosts} listClassName="my-list" />);

      const list = screen.getByRole('list');
      expect(list.classList.contains('my-list')).toBe(true);
    });
  });

  // ---- Tags in Post List ----
  describe('tags rendering', () => {
    it('renders tags for posts that include them', () => {
      const postsWithTags: PostInfo[] = [
        { ...makePost('post_t1', 'Tagged Post'), tags: ['React', 'TypeScript'] },
        { ...makePost('post_t2', 'Untagged Post') },
      ];

      render(<PostList posts={postsWithTags} />);

      expect(screen.getByText('React')).toBeDefined();
      expect(screen.getByText('TypeScript')).toBeDefined();
    });
  });

  // ---- dataLayer tracking ----
  describe('dataLayer tracking', () => {
    it('pushes beehiiv_load_more_clicked event when load more is clicked', async () => {
      const user = userEvent.setup();
      const handleLoadMore = vi.fn();

      // Reset dataLayer
      (window as unknown as Record<string, unknown>).dataLayer = [];

      render(
        <PostList
          posts={samplePosts}
          hasMore={true}
          onLoadMore={handleLoadMore}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Load more' }));

      const dataLayer = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer;
      const event = dataLayer.find(
        (e: Record<string, unknown>) => e.event === 'beehiiv_load_more_clicked',
      );
      expect(event).toBeDefined();
      expect(event).toHaveProperty('page', 2);
    });
  });

});
