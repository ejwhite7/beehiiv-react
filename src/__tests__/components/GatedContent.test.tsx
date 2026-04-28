/**
 * Tests for the GatedContent component.
 *
 * Validates that:
 * - Renders children when canView=true
 * - Renders fallback when canView=false
 * - Renders loadingFallback while loading
 * - Calls onAccessResolved after resolution
 * - data-access attribute is set correctly
 *
 * @module __tests__/components/GatedContent
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { GatedContent } from '../../components/GatedContent.js';
import type { AccessResult } from '../../types/access.js';

// ---------------------------------------------------------------------------
// Mock useSubscriberAccess hook
// ---------------------------------------------------------------------------

let mockAccessResult: AccessResult = {
  canView: false,
  tier: null,
  status: null,
  isActive: false,
  isLoading: true,
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

describe('GatedContent', () => {
  beforeEach(() => {
    setMockAccess({ isLoading: true });
  });

  it('renders loadingFallback while loading', () => {
    setMockAccess({ isLoading: true });

    render(
      <GatedContent
        audience="premium"
        loadingFallback={<p>Loading...</p>}
      >
        <p>Secret content</p>
      </GatedContent>,
    );

    expect(screen.getByText('Loading...')).toBeDefined();
    expect(screen.queryByText('Secret content')).toBeNull();
  });

  it('renders null when loading and no loadingFallback provided', () => {
    setMockAccess({ isLoading: true });

    const { container } = render(
      <GatedContent audience="premium">
        <p>Secret content</p>
      </GatedContent>,
    );

    expect(screen.queryByText('Secret content')).toBeNull();
    // The wrapper div should be present but empty
    const wrapper = container.firstElementChild;
    expect(wrapper?.textContent).toBe('');
  });

  it('renders children when canView=true', () => {
    setMockAccess({ canView: true, tier: 'premium', status: 'active', isActive: true });

    render(
      <GatedContent
        audience="premium"
        fallback={<p>No access</p>}
      >
        <p>Secret content</p>
      </GatedContent>,
    );

    expect(screen.getByText('Secret content')).toBeDefined();
    expect(screen.queryByText('No access')).toBeNull();
  });

  it('renders fallback when canView=false', () => {
    setMockAccess({ canView: false, tier: 'free', status: 'active', isActive: true });

    render(
      <GatedContent
        audience="premium"
        fallback={<p>Upgrade required</p>}
      >
        <p>Secret content</p>
      </GatedContent>,
    );

    expect(screen.getByText('Upgrade required')).toBeDefined();
    expect(screen.queryByText('Secret content')).toBeNull();
  });

  it('renders null when canView=false and no fallback provided', () => {
    setMockAccess({ canView: false });

    const { container } = render(
      <GatedContent audience="free">
        <p>Secret content</p>
      </GatedContent>,
    );

    expect(screen.queryByText('Secret content')).toBeNull();
    const wrapper = container.firstElementChild;
    expect(wrapper?.textContent).toBe('');
  });

  it('sets data-access="granted" when canView=true', () => {
    setMockAccess({ canView: true });

    const { container } = render(
      <GatedContent audience="free">
        <p>Content</p>
      </GatedContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-access')).toBe('granted');
  });

  it('sets data-access="denied" when canView=false', () => {
    setMockAccess({ canView: false });

    const { container } = render(
      <GatedContent audience="premium">
        <p>Content</p>
      </GatedContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-access')).toBe('denied');
  });

  it('sets data-audience to the audience prop value', () => {
    setMockAccess({ canView: true });

    const { container } = render(
      <GatedContent audience="free">
        <p>Content</p>
      </GatedContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('data-audience')).toBe('free');
  });

  it('applies className to the wrapper div', () => {
    setMockAccess({ canView: true });

    const { container } = render(
      <GatedContent audience="all" className="my-gated-section">
        <p>Content</p>
      </GatedContent>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toBe('my-gated-section');
  });

  it('calls onAccessResolved after first resolution', () => {
    const onResolved = vi.fn();
    setMockAccess({ canView: true, tier: 'premium', status: 'active', isActive: true });

    render(
      <GatedContent
        audience="premium"
        onAccessResolved={onResolved}
      >
        <p>Content</p>
      </GatedContent>,
    );

    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith(
      expect.objectContaining({
        canView: true,
        tier: 'premium',
        status: 'active',
      }),
    );
  });

  it('does not call onAccessResolved while loading', () => {
    const onResolved = vi.fn();
    setMockAccess({ isLoading: true });

    render(
      <GatedContent
        audience="premium"
        onAccessResolved={onResolved}
      >
        <p>Content</p>
      </GatedContent>,
    );

    expect(onResolved).not.toHaveBeenCalled();
  });
});
