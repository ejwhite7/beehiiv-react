/**
 * Tests for the SubscriberBadge component.
 *
 * Validates that:
 * - Renders "Premium" badge for premium subscriber
 * - Renders "Free" badge for free subscriber
 * - Renders "Free" badge (default) for non-subscriber
 * - Renders loadingFallback while loading
 * - Renders custom fallback when provided and subscriber not active
 * - renderBadge prop receives full SubscriberProfile and renders custom UI
 * - data-tier attribute set correctly
 * - data-subscriber-badge attribute present
 * - aria-label set correctly
 *
 * @module __tests__/components/SubscriberBadge
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SubscriberBadge } from '../../components/SubscriberBadge.js';
import type { SubscriberProfile } from '../../types/access.js';

// ---------------------------------------------------------------------------
// Mock useSubscriberProfile hook
// ---------------------------------------------------------------------------

const mockRefetch = vi.fn().mockResolvedValue(undefined);

let mockProfile: SubscriberProfile = {
  subscription: null,
  tier: null,
  status: null,
  isPremium: false,
  isActive: false,
  isLoading: true,
  error: null,
  refetch: mockRefetch,
};

vi.mock('../../hooks/useSubscriberProfile.js', () => ({
  useSubscriberProfile: () => mockProfile,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setMockProfile(partial: Partial<SubscriberProfile>): void {
  mockProfile = {
    subscription: null,
    tier: null,
    status: null,
    isPremium: false,
    isActive: false,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriberBadge', () => {
  beforeEach(() => {
    setMockProfile({ isLoading: true });
  });

  it('renders "Premium" badge for premium subscriber', () => {
    setMockProfile({
      isPremium: true,
      isActive: true,
      tier: 'premium',
      status: 'active',
    });

    render(<SubscriberBadge subscriberEmail="user@example.com" />);

    expect(screen.getByText('Premium')).toBeDefined();
  });

  it('renders "Free" badge for free subscriber', () => {
    setMockProfile({
      isPremium: false,
      isActive: true,
      tier: 'free',
      status: 'active',
    });

    render(<SubscriberBadge subscriberEmail="user@example.com" />);

    expect(screen.getByText('Free')).toBeDefined();
  });

  it('renders "Free" badge (default) for non-subscriber', () => {
    setMockProfile({
      isPremium: false,
      isActive: false,
      tier: null,
      status: null,
    });

    render(<SubscriberBadge subscriberEmail="unknown@example.com" />);

    expect(screen.getByText('Free')).toBeDefined();
  });

  it('renders loadingFallback while loading', () => {
    setMockProfile({ isLoading: true });

    render(
      <SubscriberBadge
        subscriberEmail="user@example.com"
        loadingFallback={<span>Loading badge...</span>}
      />,
    );

    expect(screen.getByText('Loading badge...')).toBeDefined();
  });

  it('renders null while loading when no loadingFallback provided', () => {
    setMockProfile({ isLoading: true });

    const { container } = render(
      <SubscriberBadge subscriberEmail="user@example.com" />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders custom fallback when provided and subscriber not active', () => {
    setMockProfile({
      isPremium: false,
      isActive: false,
      tier: null,
      status: null,
    });

    render(
      <SubscriberBadge
        subscriberEmail="user@example.com"
        fallback={<span>Not subscribed</span>}
      />,
    );

    expect(screen.getByText('Not subscribed')).toBeDefined();
  });

  it('renderBadge prop receives full SubscriberProfile and renders custom UI', () => {
    setMockProfile({
      isPremium: true,
      isActive: true,
      tier: 'premium',
      status: 'active',
    });

    render(
      <SubscriberBadge
        subscriberEmail="user@example.com"
        renderBadge={(profile) => (
          <div data-testid="custom-badge">
            {profile.isPremium ? 'VIP' : 'Regular'}
          </div>
        )}
      />,
    );

    expect(screen.getByTestId('custom-badge')).toBeDefined();
    expect(screen.getByText('VIP')).toBeDefined();
  });

  it('data-tier attribute set correctly', () => {
    setMockProfile({
      isPremium: true,
      isActive: true,
      tier: 'premium',
      status: 'active',
    });

    const { container } = render(
      <SubscriberBadge subscriberEmail="user@example.com" />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-tier')).toBe('premium');
  });

  it('data-subscriber-badge attribute present', () => {
    setMockProfile({
      isPremium: false,
      isActive: true,
      tier: 'free',
      status: 'active',
    });

    const { container } = render(
      <SubscriberBadge subscriberEmail="user@example.com" />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.hasAttribute('data-subscriber-badge')).toBe(true);
  });

  it('aria-label set correctly', () => {
    setMockProfile({
      isPremium: true,
      isActive: true,
      tier: 'premium',
      status: 'active',
    });

    const { container } = render(
      <SubscriberBadge subscriberEmail="user@example.com" />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('aria-label')).toBe('premium subscriber');
  });
});
