/**
 * Tests for the beehiiv query key factory.
 *
 * Validates that every namespace in `beehiivKeys` produces
 * the expected readonly array shapes for use with TanStack Query.
 */

import { describe, expect, it } from 'vitest';

import { beehiivKeys } from '../keys.js';

describe('beehiivKeys', () => {
  // -----------------------------------------------------------------------
  // Posts
  // -----------------------------------------------------------------------
  describe('posts', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.posts.all).toEqual(['beehiiv', 'posts']);
    });

    it('.list() returns correct shape without options', () => {
      const key = beehiivKeys.posts.list();
      expect(key).toEqual(['beehiiv', 'posts', 'list', {}]);
    });

    it('.list(options) embeds options in the key', () => {
      const key = beehiivKeys.posts.list({ status: 'confirmed', limit: 10 });
      expect(key).toEqual([
        'beehiiv',
        'posts',
        'list',
        { status: 'confirmed', limit: 10 },
      ]);
    });

    it('.detail(id) returns correct shape', () => {
      const key = beehiivKeys.posts.detail('post_abc');
      expect(key).toEqual(['beehiiv', 'posts', 'detail', 'post_abc']);
    });
  });

  // -----------------------------------------------------------------------
  // Subscribers
  // -----------------------------------------------------------------------
  describe('subscribers', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.subscribers.all).toEqual(['beehiiv', 'subscribers']);
    });

    it('.list() returns correct shape without options', () => {
      expect(beehiivKeys.subscribers.list()).toEqual([
        'beehiiv',
        'subscribers',
        'list',
        {},
      ]);
    });

    it('.list(options) embeds options in the key', () => {
      const key = beehiivKeys.subscribers.list({ email: 'a@b.com' });
      expect(key).toEqual([
        'beehiiv',
        'subscribers',
        'list',
        { email: 'a@b.com' },
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------------------
  describe('subscriptions', () => {
    it('.detail(emailOrId) returns correct shape', () => {
      expect(beehiivKeys.subscriptions.detail('sub_123')).toEqual([
        'beehiiv',
        'subscriptions',
        'detail',
        'sub_123',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Publications
  // -----------------------------------------------------------------------
  describe('publications', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.publications.all).toEqual([
        'beehiiv',
        'publications',
      ]);
    });

    it('.list() returns correct shape', () => {
      expect(beehiivKeys.publications.list()).toEqual([
        'beehiiv',
        'publications',
        'list',
        {},
      ]);
    });

    it('.list(options) embeds options in the key', () => {
      const key = beehiivKeys.publications.list({ expand: ['stats'] });
      expect(key).toEqual([
        'beehiiv',
        'publications',
        'list',
        { expand: ['stats'] },
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Custom fields
  // -----------------------------------------------------------------------
  describe('customFields', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.customFields.all).toEqual([
        'beehiiv',
        'customFields',
      ]);
    });

    it('.list() returns correct shape', () => {
      expect(beehiivKeys.customFields.list()).toEqual([
        'beehiiv',
        'customFields',
        'list',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Webhooks
  // -----------------------------------------------------------------------
  describe('webhooks', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.webhooks.all).toEqual(['beehiiv', 'webhooks']);
    });

    it('.list() returns correct shape without options', () => {
      expect(beehiivKeys.webhooks.list()).toEqual([
        'beehiiv',
        'webhooks',
        'list',
        {},
      ]);
    });

    it('.list(options) embeds the publication scope', () => {
      expect(beehiivKeys.webhooks.list({ publicationId: 'pub_a' })).toEqual([
        'beehiiv',
        'webhooks',
        'list',
        { publicationId: 'pub_a' },
      ]);
    });

    it('.list keys differ across publication scopes', () => {
      expect(beehiivKeys.webhooks.list({ publicationId: 'pub_a' })).not.toEqual(
        beehiivKeys.webhooks.list({ publicationId: 'pub_b' }),
      );
    });

    it('.detail(id) stays a prefix of scoped detail keys', () => {
      expect(beehiivKeys.webhooks.detail('ep_1')).toEqual([
        'beehiiv',
        'webhooks',
        'detail',
        'ep_1',
      ]);
      expect(
        beehiivKeys.webhooks.detail('ep_1', { publicationId: 'pub_a' }),
      ).toEqual(['beehiiv', 'webhooks', 'detail', 'ep_1', { publicationId: 'pub_a' }]);
    });
  });

  // -----------------------------------------------------------------------
  // Segments
  // -----------------------------------------------------------------------
  describe('segments', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.segments.all).toEqual(['beehiiv', 'segments']);
    });

    it('.list() returns correct shape without options', () => {
      expect(beehiivKeys.segments.list()).toEqual([
        'beehiiv',
        'segments',
        'list',
        {},
      ]);
    });

    it('.list(options) embeds filters so different filters get different keys', () => {
      const dynamicKey = beehiivKeys.segments.list({ type: 'dynamic' });
      const staticKey = beehiivKeys.segments.list({ type: 'static' });
      expect(dynamicKey).toEqual([
        'beehiiv',
        'segments',
        'list',
        { type: 'dynamic' },
      ]);
      expect(dynamicKey).not.toEqual(staticKey);
    });

    it('.list(options) with equal filters produces equal keys', () => {
      expect(beehiivKeys.segments.list({ type: 'dynamic', limit: 10 })).toEqual(
        beehiivKeys.segments.list({ type: 'dynamic', limit: 10 }),
      );
    });

    it('.detail and .results stay prefixes of their scoped keys', () => {
      expect(beehiivKeys.segments.detail('seg_1')).toEqual([
        'beehiiv',
        'segments',
        'detail',
        'seg_1',
      ]);
      expect(
        beehiivKeys.segments.detail('seg_1', { publicationId: 'pub_a' }),
      ).toEqual(['beehiiv', 'segments', 'detail', 'seg_1', { publicationId: 'pub_a' }]);
      expect(beehiivKeys.segments.results('seg_1')).toEqual([
        'beehiiv',
        'segments',
        'results',
        'seg_1',
      ]);
      expect(beehiivKeys.segments.results('seg_1', { page: 2 })).toEqual([
        'beehiiv',
        'segments',
        'results',
        'seg_1',
        { page: 2 },
      ]);
      // Empty scope behaves like no scope
      expect(beehiivKeys.segments.results('seg_1', {})).toEqual(
        beehiivKeys.segments.results('seg_1'),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Automations
  // -----------------------------------------------------------------------
  describe('automations', () => {
    it('.all is a readonly tuple', () => {
      expect(beehiivKeys.automations.all).toEqual([
        'beehiiv',
        'automations',
      ]);
    });

    it('.list() returns correct shape without options', () => {
      expect(beehiivKeys.automations.list()).toEqual([
        'beehiiv',
        'automations',
        'list',
        {},
      ]);
    });

    it('.list(options) embeds options', () => {
      const key = beehiivKeys.automations.list({ status: 'active' });
      expect(key).toEqual([
        'beehiiv',
        'automations',
        'list',
        { status: 'active' },
      ]);
    });

    it('.list(options) supports limit and publicationId so factory keys match hook keys', () => {
      expect(
        beehiivKeys.automations.list({ status: 'active', limit: 50, publicationId: 'pub_a' }),
      ).toEqual([
        'beehiiv',
        'automations',
        'list',
        { status: 'active', limit: 50, publicationId: 'pub_a' },
      ]);
    });

    it('.detail(id) stays a prefix of scoped detail keys', () => {
      expect(beehiivKeys.automations.detail('aut_1')).toEqual([
        'beehiiv',
        'automations',
        'detail',
        'aut_1',
      ]);
      expect(
        beehiivKeys.automations.detail('aut_1', { publicationId: 'pub_a' }),
      ).toEqual(['beehiiv', 'automations', 'detail', 'aut_1', { publicationId: 'pub_a' }]);
    });
  });

  // -----------------------------------------------------------------------
  // Referrals
  // -----------------------------------------------------------------------
  describe('referrals', () => {
    it('.program() returns correct shape', () => {
      expect(beehiivKeys.referrals.program()).toEqual([
        'beehiiv',
        'referrals',
        'program',
      ]);
    });

    it('.subscriberStats(subscriberId) returns correct shape', () => {
      expect(beehiivKeys.referrals.subscriberStats('sub_xyz')).toEqual([
        'beehiiv',
        'referrals',
        'subscriberStats',
        'sub_xyz',
      ]);
    });
  });
});
