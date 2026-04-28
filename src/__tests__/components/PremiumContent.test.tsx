/**
 * Tests for the PremiumContent component.
 *
 * Validates that:
 * - Renders children for premium subscriber
 * - Calls upgradePrompt with tier/status for non-premium
 * - Renders fallback when no upgradePrompt and canView=false
 *
 * @module __tests__/components/PremiumContent
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PremiumContent } from '../../components/PremiumContent.js';
import type { AccessResult } from '../../types/access.js';

// ---------------------------------------------------------------------------
// Mock useSubscriberAccess hook
// ---------------------------------------------------------------------------

let mockAccessResult: AccessResult = {
  canView: false,
  tier: null,
  status: null,
  isActive: false,
  isLoading: false,
  error: null,
};

vi.mock('../../hooks/useSubscriberAccess.js', () => ({
  useSubscriberAccess: () => mockAccessResult,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setMockAccess(partial: Partial<AccessResult>): void {
  mockAccessResult = {
    canView: false,
    tier: null,
    status: null,
    isActive: false,
    isLoading: false,
    error: null,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PremiumContent', () => {
  beforeEach(() => {
    setMockAccess({ isLoading: false, canView: false });
  });

  it('renders children for premium subscriber', () => {
    setMockAccess({ canView: true, tier: 'premium', status: 'active', isActive: true });

    render(
      <PremiumContent subscriberEmail="premium@example.com">
        <p>Premium article body</p>
      </PremiumContent>,
    );

    expect(screen.getByText('Premium article body')).toBeDefined();
  });

  it('calls upgradePrompt with tier and status when canView=false', () => {
    const upgradePrompt = vi.fn(
      (tier: string | null, status: string | null) => (
        <p>Upgrade from {tier ?? 'none'} ({status ?? 'unknown'})</p>
      ),
    );

    setMockAccess({ canView: false, tier: 'free', status: 'active', isActive: true });

    render(
      <PremiumContent
        subscriberEmail="user@example.com"
        upgradePrompt={upgradePrompt}
      >
        <p>Premium article body</p>
      </PremiumContent>,
    );

    expect(screen.queryByText('Premium article body')).toBeNull();
    expect(screen.getByText('Upgrade from free (active)')).toBeDefined();
    expect(upgradePrompt).toHaveBeenCalledWith('free', 'active');
  });

  it('renders fallback when no upgradePrompt and canView=false', () => {
    setMockAccess({ canView: false, tier: null, status: null });

    render(
      <PremiumContent
        subscriberEmail="user@example.com"
        fallback={<p>Subscribe for premium content</p>}
      >
        <p>Premium article body</p>
      </PremiumContent>,
    );

    expect(screen.queryByText('Premium article body')).toBeNull();
    expect(screen.getByText('Subscribe for premium content')).toBeDefined();
  });

  it('renders null when no upgradePrompt and no fallback and canView=false', () => {
    setMockAccess({ canView: false });

    const { container } = render(
      <PremiumContent subscriberEmail="user@example.com">
        <p>Premium article body</p>
      </PremiumContent>,
    );

    expect(screen.queryByText('Premium article body')).toBeNull();
    const wrapper = container.firstElementChild;
    expect(wrapper?.textContent).toBe('');
  });

  it('renders loadingFallback while loading', () => {
    setMockAccess({ isLoading: true });

    render(
      <PremiumContent
        subscriberEmail="user@example.com"
        loadingFallback={<p>Checking premium access...</p>}
      >
        <p>Premium article body</p>
      </PremiumContent>,
    );

    expect(screen.getByText('Checking premium access...')).toBeDefined();
    expect(screen.queryByText('Premium article body')).toBeNull();
  });

  it('sets data-audience="premium" on the wrapper', () => {
    setMockAccess({ canView: true });

    const { container } = render(
      <PremiumContent>
        <p>Content</p>
      </PremiumContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-audience')).toBe('premium');
  });

  it('sets data-access="granted" for premium subscriber', () => {
    setMockAccess({ canView: true });

    const { container } = render(
      <PremiumContent>
        <p>Content</p>
      </PremiumContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-access')).toBe('granted');
  });

  it('sets data-access="denied" for non-premium subscriber', () => {
    setMockAccess({ canView: false });

    const { container } = render(
      <PremiumContent>
        <p>Content</p>
      </PremiumContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-access')).toBe('denied');
  });

  it('calls onAccessResolved after resolution', () => {
    const onResolved = vi.fn();
    setMockAccess({ canView: true, tier: 'premium', status: 'active', isActive: true });

    render(
      <PremiumContent onAccessResolved={onResolved}>
        <p>Content</p>
      </PremiumContent>,
    );

    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith(
      expect.objectContaining({
        canView: true,
        tier: 'premium',
      }),
    );
  });

  it('applies className to the wrapper', () => {
    setMockAccess({ canView: true });

    const { container } = render(
      <PremiumContent className="premium-section">
        <p>Content</p>
      </PremiumContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toBe('premium-section');
  });
});
