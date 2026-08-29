/**
 * Tests for the access utility functions.
 *
 * Validates that:
 * - canViewContent correctly resolves access for all audience/tier/status combinations
 * - getAudienceLabel returns correct human-readable labels
 * - getTierLabel returns correct human-readable labels
 *
 * @module __tests__/utils/access
 */

import { describe, expect, it } from 'vitest';

import { canViewContent, getAudienceLabel, getTierLabel } from '../../utils/access.js';
import type {
  PostAudience,
  SubscriptionStatus,
  SubscriptionTier,
} from '../../types/index.js';

describe('canViewContent', () => {
  const audiences: PostAudience[] = ['all', 'free', 'both', 'premium'];
  const tiers: (SubscriptionTier | null)[] = [null, 'free', 'premium'];
  const statuses: (SubscriptionStatus | null)[] = [
    null,
    'validating',
    'invalid',
    'pending',
    'active',
    'inactive',
    'needs_attention',
  ];
  const matrix = audiences.flatMap((audience) =>
    tiers.flatMap((tier) =>
      statuses.flatMap((status) =>
        [false, true].map((enforceGatedContent) => ({
          audience,
          tier,
          status,
          enforceGatedContent,
        })),
      ),
    ),
  );

  it.each(matrix)(
    'resolves $audience for tier=$tier status=$status gated=$enforceGatedContent',
    ({ audience, tier, status, enforceGatedContent }) => {
      const expected =
        audience === 'all' ||
        (audience === 'premium'
          ? tier === 'premium' && status === 'active'
          : !enforceGatedContent || status === 'active');

      expect(
        canViewContent(tier, status, audience, enforceGatedContent),
      ).toBe(expected);
    },
  );

  it('fails closed when the gate flag is unavailable', () => {
    expect(canViewContent(null, null, 'free')).toBe(false);
    expect(canViewContent(null, null, 'both')).toBe(false);
  });

  describe('audience = "all"', () => {
    it('returns true for active premium subscriber', () => {
      expect(canViewContent('premium', 'active', 'all')).toBe(true);
    });

    it('returns true for active free subscriber', () => {
      expect(canViewContent('free', 'active', 'all')).toBe(true);
    });

    it('returns true for inactive subscriber', () => {
      expect(canViewContent('free', 'inactive', 'all')).toBe(true);
    });

    it('returns true for pending subscriber', () => {
      expect(canViewContent('free', 'pending', 'all')).toBe(true);
    });

    it('returns true for validating subscriber', () => {
      expect(canViewContent('free', 'validating', 'all')).toBe(true);
    });

    it('returns true for null tier and null status (non-subscriber)', () => {
      expect(canViewContent(null, null, 'all')).toBe(true);
    });
  });

  describe('audience = "free"', () => {
    it('returns true for active free subscriber', () => {
      expect(canViewContent('free', 'active', 'free')).toBe(true);
    });

    it('returns true for active premium subscriber', () => {
      expect(canViewContent('premium', 'active', 'free')).toBe(true);
    });

    it('returns false for inactive free subscriber', () => {
      expect(canViewContent('free', 'inactive', 'free')).toBe(false);
    });

    it('returns false for pending subscriber', () => {
      expect(canViewContent('free', 'pending', 'free')).toBe(false);
    });

    it('returns false for validating subscriber', () => {
      expect(canViewContent('free', 'validating', 'free')).toBe(false);
    });

    it('returns false for null tier and null status (non-subscriber)', () => {
      expect(canViewContent(null, null, 'free')).toBe(false);
    });

    it('returns false for inactive premium subscriber', () => {
      expect(canViewContent('premium', 'inactive', 'free')).toBe(false);
    });
  });

  describe('audience = "both"', () => {
    it('returns true for active free subscriber', () => {
      expect(canViewContent('free', 'active', 'both')).toBe(true);
    });

    it('returns true for active premium subscriber', () => {
      expect(canViewContent('premium', 'active', 'both')).toBe(true);
    });

    it('returns false for inactive free subscriber', () => {
      expect(canViewContent('free', 'inactive', 'both')).toBe(false);
    });

    it('returns false for pending subscriber', () => {
      expect(canViewContent('free', 'pending', 'both')).toBe(false);
    });

    it('returns false for null tier and null status (non-subscriber)', () => {
      expect(canViewContent(null, null, 'both')).toBe(false);
    });
  });

  describe('audience = "premium"', () => {
    it('returns true for active premium subscriber', () => {
      expect(canViewContent('premium', 'active', 'premium')).toBe(true);
    });

    it('returns false for active free subscriber', () => {
      expect(canViewContent('free', 'active', 'premium')).toBe(false);
    });

    it('returns false for inactive premium subscriber', () => {
      expect(canViewContent('premium', 'inactive', 'premium')).toBe(false);
    });

    it('returns false for pending premium subscriber', () => {
      expect(canViewContent('premium', 'pending', 'premium')).toBe(false);
    });

    it('returns false for validating premium subscriber', () => {
      expect(canViewContent('premium', 'validating', 'premium')).toBe(false);
    });

    it('returns false for null tier and null status (non-subscriber)', () => {
      expect(canViewContent(null, null, 'premium')).toBe(false);
    });

    it('returns false for null tier with active status', () => {
      expect(canViewContent(null, 'active', 'premium')).toBe(false);
    });
  });
});

describe('getAudienceLabel', () => {
  it('returns "Everyone" for "all"', () => {
    expect(getAudienceLabel('all')).toBe('Everyone');
  });

  it('returns "Members Only" for "both"', () => {
    expect(getAudienceLabel('both')).toBe('Members Only');
  });

  it('returns "Free" for "free"', () => {
    expect(getAudienceLabel('free')).toBe('Free');
  });

  it('returns "Premium" for "premium"', () => {
    expect(getAudienceLabel('premium')).toBe('Premium');
  });
});

describe('getTierLabel', () => {
  it('returns "Free Subscriber" for "free"', () => {
    expect(getTierLabel('free')).toBe('Free Subscriber');
  });

  it('returns "Premium Subscriber" for "premium"', () => {
    expect(getTierLabel('premium')).toBe('Premium Subscriber');
  });

  it('returns "Non-subscriber" for null', () => {
    expect(getTierLabel(null)).toBe('Non-subscriber');
  });
});
