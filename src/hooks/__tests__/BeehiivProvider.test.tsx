/**
 * Tests for the BeehiivProvider component.
 *
 * Validates that:
 * - Context is provided to children with correct values
 * - The default apiUrl is '/api/beehiiv'
 * - Custom apiUrl is respected
 * - isLoading starts as false and error starts as null
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { BeehiivContext, BeehiivProvider } from '../../components/BeehiivProvider.js';

/**
 * Helper component that reads the BeehiivContext and renders its values
 * as text so we can assert on them.
 */
function ContextConsumer(): React.JSX.Element {
  const ctx = React.useContext(BeehiivContext);
  if (!ctx) return <span data-testid="ctx">null</span>;
  return (
    <span data-testid="ctx">
      {JSON.stringify({
        apiUrl: ctx.apiUrl,
        publicationId: ctx.publicationId,
        isLoading: ctx.isLoading,
        error: ctx.error,
      })}
    </span>
  );
}

describe('BeehiivProvider', () => {
  it('provides context values to children', () => {
    render(
      <BeehiivProvider publicationId="pub_test123">
        <ContextConsumer />
      </BeehiivProvider>,
    );

    const el = screen.getByTestId('ctx');
    const value = JSON.parse(el.textContent ?? '');
    expect(value.publicationId).toBe('pub_test123');
    expect(value.apiUrl).toBe('/api/beehiiv');
    expect(value.isLoading).toBe(false);
    expect(value.error).toBeNull();
  });

  it('uses default apiUrl of /api/beehiiv', () => {
    render(
      <BeehiivProvider publicationId="pub_abc">
        <ContextConsumer />
      </BeehiivProvider>,
    );

    const el = screen.getByTestId('ctx');
    const value = JSON.parse(el.textContent ?? '');
    expect(value.apiUrl).toBe('/api/beehiiv');
  });

  it('accepts a custom apiUrl', () => {
    render(
      <BeehiivProvider publicationId="pub_abc" apiUrl="/custom/api">
        <ContextConsumer />
      </BeehiivProvider>,
    );

    const el = screen.getByTestId('ctx');
    const value = JSON.parse(el.textContent ?? '');
    expect(value.apiUrl).toBe('/custom/api');
  });

  it('renders children', () => {
    render(
      <BeehiivProvider publicationId="pub_abc">
        <div data-testid="child">Hello</div>
      </BeehiivProvider>,
    );

    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByTestId('child').textContent).toBe('Hello');
  });
});
