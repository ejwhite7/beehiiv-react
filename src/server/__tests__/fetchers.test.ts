/**
 * Unit tests for the server fetcher functions.
 *
 * Each test mocks the relevant BeehiivClient endpoint method, calls the
 * corresponding fetcher, and asserts that:
 *   1. The correct endpoint method was invoked with the right arguments.
 *   2. The return value is the unwrapped `data` (not the response envelope).
 *
 * Also tests email-vs-ID detection in fetchSubscription and the wired-up
 * behaviour of fetchWebhooks / fetchSegments.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BeehiivClient } from '../../client/index.js';
import {
  fetchPosts,
  fetchPost,
  fetchPostBySlug,
  fetchAllPostSlugs,
  fetchAllPosts,
  fetchSubscribers,
  fetchSubscription,
  fetchPublications,
  fetchCustomFields,
  fetchWebhooks,
  fetchSegments,
} from '../fetchers.js';

/** Build a mocked posts.list page response. */
function postsPage(
  data: Array<Record<string, unknown>>,
  pagination: { page: number; total_pages: number },
) {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: 100,
      total_results: data.length,
      total_pages: pagination.total_pages,
    },
  } as never;
}

/**
 * Create a mock BeehiivClient with all endpoint namespaces stubbed.
 *
 * Each namespace method is a vi.fn() that can be configured per-test.
 */
function createMockClient(): BeehiivClient {
  return {
    posts: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscriptions: {
      list: vi.fn(),
      getByEmail: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      updateByEmail: vi.fn(),
      delete: vi.fn(),
    },
    publications: {
      list: vi.fn(),
      get: vi.fn(),
    },
    customFields: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    webhooks: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      test: vi.fn(),
    },
    segments: {
      list: vi.fn(),
      get: vi.fn(),
      listMembers: vi.fn(),
    },
  } as unknown as BeehiivClient;
}

describe('server fetchers', () => {
  let client: BeehiivClient;

  beforeEach(() => {
    client = createMockClient();
  });

  // ---------- fetchPosts ----------

  describe('fetchPosts', () => {
    it('should call client.posts.list and return unwrapped data', async () => {
      const posts = [{ id: 'post_1', title: 'Hello' }];
      vi.mocked(client.posts.list).mockResolvedValue({
        data: posts,
        pagination: { page: 1, limit: 10, total_results: 1, total_pages: 1 },
      } as never);

      const result = await fetchPosts(client, 'pub_abc');

      expect(client.posts.list).toHaveBeenCalledWith('pub_abc', undefined);
      expect(result).toEqual(posts);
    });

    it('should forward options to client.posts.list', async () => {
      vi.mocked(client.posts.list).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      } as never);

      await fetchPosts(client, 'pub_abc', { status: 'confirmed', limit: 5 });

      expect(client.posts.list).toHaveBeenCalledWith('pub_abc', {
        status: 'confirmed',
        limit: 5,
      });
    });
  });

  // ---------- fetchPost ----------

  describe('fetchPost', () => {
    it('should call client.posts.get and return unwrapped data', async () => {
      const post = { id: 'post_123', title: 'My Post' };
      vi.mocked(client.posts.get).mockResolvedValue({ data: post } as never);

      const result = await fetchPost(client, 'pub_abc', 'post_123');

      expect(client.posts.get).toHaveBeenCalledWith('pub_abc', 'post_123', { expand: ['free_web_content', 'tags'] });
      expect(result).toEqual(post);
    });

    it('should return null (not an empty array) when the response has no data', async () => {
      vi.mocked(client.posts.get).mockResolvedValue({} as never);

      const result = await fetchPost(client, 'pub_abc', 'post_missing');

      expect(result).toBeNull();
    });
  });

  // ---------- fetchPostBySlug ----------

  describe('fetchPostBySlug', () => {
    it('finds a slug on a later page and loads its expanded content', async () => {
      vi.mocked(client.posts.list)
        .mockResolvedValueOnce(
          postsPage(
            Array.from({ length: 100 }, (_, i) => ({
              id: `post_${i}`,
              slug: `slug-${i}`,
            })),
            { page: 1, total_pages: 2 },
          ),
        )
        .mockResolvedValueOnce(
          postsPage([{ id: 'post_target', slug: 'wanted' }], {
            page: 2,
            total_pages: 2,
          }),
        );
      const expanded = { id: 'post_target', slug: 'wanted', title: 'Found' };
      vi.mocked(client.posts.get).mockResolvedValue({ data: expanded } as never);

      const result = await fetchPostBySlug(client, 'pub_abc', 'wanted');

      expect(client.posts.list).toHaveBeenCalledTimes(2);
      expect(client.posts.get).toHaveBeenCalledWith('pub_abc', 'post_target', {
        expand: ['free_web_content', 'tags'],
      });
      expect(result).toEqual(expanded);
    });

    it('returns null and stops scanning on a short (final) page when no match', async () => {
      vi.mocked(client.posts.list).mockResolvedValueOnce(
        postsPage([{ id: 'post_1', slug: 'other' }], { page: 1, total_pages: 1 }),
      );

      const result = await fetchPostBySlug(client, 'pub_abc', 'nope');

      expect(result).toBeNull();
      expect(client.posts.list).toHaveBeenCalledTimes(1);
      expect(client.posts.get).not.toHaveBeenCalled();
    });

    it('stops early as soon as a match is found', async () => {
      vi.mocked(client.posts.list).mockResolvedValue(
        postsPage(
          Array.from({ length: 100 }, (_, i) => ({
            id: `post_${i}`,
            slug: `slug-${i}`,
          })),
          { page: 1, total_pages: 5 },
        ),
      );
      vi.mocked(client.posts.get).mockResolvedValue({
        data: { id: 'post_3', slug: 'slug-3' },
      } as never);

      await fetchPostBySlug(client, 'pub_abc', 'slug-3');

      // Match is on page 1 — must not request further pages.
      expect(client.posts.list).toHaveBeenCalledTimes(1);
    });
  });

  // ---------- fetchAllPostSlugs / fetchAllPosts ----------

  describe('fetchAllPostSlugs', () => {
    it('paginates through all pages and collects slugs (skipping blanks)', async () => {
      vi.mocked(client.posts.list)
        .mockResolvedValueOnce(
          postsPage(
            Array.from({ length: 100 }, (_, i) => ({
              id: `post_${i}`,
              slug: `slug-${i}`,
            })),
            { page: 1, total_pages: 2 },
          ),
        )
        .mockResolvedValueOnce(
          postsPage(
            [
              { id: 'post_a', slug: 'a' },
              { id: 'post_b' }, // no slug — skipped
            ],
            { page: 2, total_pages: 2 },
          ),
        );

      const result = await fetchAllPostSlugs(client, 'pub_abc');

      expect(client.posts.list).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(101);
      expect(result).toContainEqual({ slug: 'a' });
      expect(result).not.toContainEqual({ slug: undefined });
    });
  });

  describe('fetchAllPosts', () => {
    it('returns every confirmed post across pages', async () => {
      vi.mocked(client.posts.list)
        .mockResolvedValueOnce(
          postsPage(
            Array.from({ length: 100 }, (_, i) => ({ id: `post_${i}` })),
            { page: 1, total_pages: 2 },
          ),
        )
        .mockResolvedValueOnce(
          postsPage([{ id: 'post_last' }], { page: 2, total_pages: 2 }),
        );

      const result = await fetchAllPosts(client, 'pub_abc');

      expect(result).toHaveLength(101);
      expect(client.posts.list).toHaveBeenCalledWith(
        'pub_abc',
        expect.objectContaining({ status: 'confirmed', limit: 100 }),
      );
    });
  });

  // ---------- fetchSubscribers ----------

  describe('fetchSubscribers', () => {
    it('should call client.subscriptions.list and return unwrapped data', async () => {
      const subs = [{ id: 'sub_1', email: 'a@b.com' }];
      vi.mocked(client.subscriptions.list).mockResolvedValue({
        data: subs,
        pagination: { page: 1, limit: 10, total_results: 1, total_pages: 1 },
      } as never);

      const result = await fetchSubscribers(client, 'pub_abc');

      expect(client.subscriptions.list).toHaveBeenCalledWith('pub_abc', undefined);
      expect(result).toEqual(subs);
    });

    it('should forward options to client.subscriptions.list', async () => {
      vi.mocked(client.subscriptions.list).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total_results: 0, total_pages: 0 },
      } as never);

      await fetchSubscribers(client, 'pub_abc', { tier: 'premium' });

      expect(client.subscriptions.list).toHaveBeenCalledWith('pub_abc', {
        tier: 'premium',
      });
    });
  });

  // ---------- fetchSubscription ----------

  describe('fetchSubscription', () => {
    it('should call getByEmail when the string contains @', async () => {
      const sub = { id: 'sub_1', email: 'user@example.com' };
      vi.mocked(client.subscriptions.getByEmail).mockResolvedValue({
        data: sub,
      } as never);

      const result = await fetchSubscription(
        client,
        'pub_abc',
        'user@example.com',
      );

      expect(client.subscriptions.getByEmail).toHaveBeenCalledWith(
        'pub_abc',
        'user@example.com',
      );
      expect(client.subscriptions.getById).not.toHaveBeenCalled();
      expect(result).toEqual(sub);
    });

    it('should call getById when the string does not contain @', async () => {
      const sub = { id: 'sub_xyz', email: 'someone@test.com' };
      vi.mocked(client.subscriptions.getById).mockResolvedValue({
        data: sub,
      } as never);

      const result = await fetchSubscription(client, 'pub_abc', 'sub_xyz');

      expect(client.subscriptions.getById).toHaveBeenCalledWith(
        'pub_abc',
        'sub_xyz',
      );
      expect(client.subscriptions.getByEmail).not.toHaveBeenCalled();
      expect(result).toEqual(sub);
    });

    it('returns null (not an empty array) when no subscriber is returned', async () => {
      vi.mocked(client.subscriptions.getById).mockResolvedValue({} as never);

      const result = await fetchSubscription(client, 'pub_abc', 'sub_missing');

      expect(result).toBeNull();
    });
  });

  // ---------- fetchPublications ----------

  describe('fetchPublications', () => {
    it('should call client.publications.list and return unwrapped data', async () => {
      const pubs = [{ id: 'pub_1', name: 'My Newsletter' }];
      vi.mocked(client.publications.list).mockResolvedValue({
        data: pubs,
      } as never);

      const result = await fetchPublications(client);

      expect(client.publications.list).toHaveBeenCalledOnce();
      expect(result).toEqual(pubs);
    });
  });

  // ---------- fetchCustomFields ----------

  describe('fetchCustomFields', () => {
    it('should call client.customFields.list and return unwrapped data', async () => {
      const fields = [{ id: 'cf_1', display: 'Company', kind: 'string' }];
      vi.mocked(client.customFields.list).mockResolvedValue({
        data: fields,
        pagination: { page: 1, limit: 100, total_results: 1, total_pages: 1 },
      } as never);

      const result = await fetchCustomFields(client, 'pub_abc');

      expect(client.customFields.list).toHaveBeenCalledWith('pub_abc');
      expect(result).toEqual(fields);
    });
  });

  // ---------- fetchWebhooks ----------

  describe('fetchWebhooks', () => {
    it('should call client.webhooks.list and return unwrapped data', async () => {
      const webhooks = [{ id: 'wh_1', url: 'https://example.com/hook' }];
      vi.mocked(client.webhooks.list).mockResolvedValue({
        data: webhooks,
      } as never);

      const result = await fetchWebhooks(client, 'pub_abc');

      expect(client.webhooks.list).toHaveBeenCalledWith('pub_abc');
      expect(result).toEqual(webhooks);
    });

    it('should return an empty array when no webhooks exist', async () => {
      vi.mocked(client.webhooks.list).mockResolvedValue({
        data: [],
      } as never);

      const result = await fetchWebhooks(client, 'pub_abc');

      expect(result).toEqual([]);
    });
  });

  // ---------- fetchSegments ----------

  describe('fetchSegments', () => {
    it('should call client.segments.list and return unwrapped data', async () => {
      const segments = [{ id: 'seg_1', name: 'Active Readers', type: 'dynamic' }];
      vi.mocked(client.segments.list).mockResolvedValue({
        data: segments,
        limit: 100,
        page: 1,
        total_results: 1,
        total_pages: 1,
      } as never);

      const result = await fetchSegments(client, 'pub_abc');

      expect(client.segments.list).toHaveBeenCalledWith('pub_abc');
      expect(result).toEqual(segments);
    });

    it('should return an empty array when no segments exist', async () => {
      vi.mocked(client.segments.list).mockResolvedValue({
        data: [],
        limit: 100,
        page: 1,
        total_results: 0,
        total_pages: 0,
      } as never);

      const result = await fetchSegments(client, 'pub_abc');

      expect(result).toEqual([]);
    });
  });
});
