/**
 * Tests for the TierBadge component.
 *
 * Validates that:
 * - Renders the tier name in default mode
 * - Applies the className prop to the wrapper
 * - Sets data-tier-type attribute correctly for free and premium tiers
 * - Sets data-tier-badge attribute for styling hooks
 * - Sets the correct aria-label for accessibility
 * - Uses the headless render prop when provided
 * - Render prop receives the full Tier object
 *
 * @module __tests__/components/TierBadge
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TierBadge } from '../../components/TierBadge.js';
import type { Tier } from '../../types/tier.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const freeTier: Tier = {
  id: 'tier_free',
  publication_id: 'pub_test',
  name: 'Free',
  type: 'free',
  active: true,
  created_at: 1700000000,
};

const premiumTier: Tier = {
  id: 'tier_premium',
  publication_id: 'pub_test',
  name: 'Gold',
  description: 'Premium access',
  type: 'premium',
  price_in_cents: 999,
  currency: 'USD',
  active: true,
  created_at: 1700000000,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TierBadge', () => {
  it('renders the tier name in default mode', () => {
    render(<TierBadge tier={freeTier} />);

    expect(screen.getByText('Free')).toBeDefined();
  });

  it('renders premium tier name', () => {
    render(<TierBadge tier={premiumTier} />);

    expect(screen.getByText('Gold')).toBeDefined();
  });

  it('applies the className prop to the wrapper', () => {
    const { container } = render(
      <TierBadge tier={freeTier} className="my-badge-class" />
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toBe('my-badge-class');
  });

  it('sets data-tier-type to "free" for free tiers', () => {
    const { container } = render(<TierBadge tier={freeTier} />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-tier-type')).toBe('free');
  });

  it('sets data-tier-type to "premium" for premium tiers', () => {
    const { container } = render(<TierBadge tier={premiumTier} />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-tier-type')).toBe('premium');
  });

  it('sets data-tier-badge attribute for styling hooks', () => {
    const { container } = render(<TierBadge tier={freeTier} />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.hasAttribute('data-tier-badge')).toBe(true);
  });

  it('sets the correct aria-label for accessibility', () => {
    const { container } = render(<TierBadge tier={premiumTier} />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('aria-label')).toBe('Gold tier (premium)');
  });

  it('uses the headless render prop when provided', () => {
    render(
      <TierBadge
        tier={premiumTier}
        render={(t) => (
          <div data-testid="custom-badge">
            {t.name} - {t.type}
          </div>
        )}
      />
    );

    expect(screen.getByTestId('custom-badge')).toBeDefined();
    expect(screen.getByText('Gold - premium')).toBeDefined();
  });

  it('render prop receives the full Tier object', () => {
    render(
      <TierBadge
        tier={premiumTier}
        render={(t) => (
          <span data-testid="tier-details">
            {t.id}|{t.price_in_cents}|{t.currency}
          </span>
        )}
      />
    );

    expect(screen.getByTestId('tier-details').textContent).toBe(
      'tier_premium|999|USD'
    );
  });

  it('does not render default UI when render prop is provided', () => {
    const { container } = render(
      <TierBadge
        tier={premiumTier}
        render={() => <span>Custom</span>}
      />
    );

    // The wrapper should NOT have data-tier-badge (default UI)
    const badgeElements = container.querySelectorAll('[data-tier-badge]');
    expect(badgeElements).toHaveLength(0);
  });
});
