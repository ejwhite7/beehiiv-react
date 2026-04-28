/**
 * Tests for the useBeehiiv hook.
 *
 * Validates that:
 * - It throws a descriptive error when used outside a BeehiivProvider
 * - It returns the correct context value when used inside a BeehiivProvider
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useBeehiiv } from '../useBeehiiv.js';

describe('useBeehiiv', () => {
  it('throws when used outside a BeehiivProvider', () => {
    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useBeehiiv());
    }).toThrow('useBeehiiv must be used within a <BeehiivProvider>');

    spy.mockRestore();
  });

  it('returns context value when inside a BeehiivProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BeehiivProvider publicationId="pub_test" apiUrl="/my-api">
        {children}
      </BeehiivProvider>
    );

    const { result } = renderHook(() => useBeehiiv(), { wrapper });

    expect(result.current.apiUrl).toBe('/my-api');
    expect(result.current.publicationId).toBe('pub_test');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('uses default apiUrl when none is provided to the provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BeehiivProvider publicationId="pub_default">
        {children}
      </BeehiivProvider>
    );

    const { result } = renderHook(() => useBeehiiv(), { wrapper });

    expect(result.current.apiUrl).toBe('/api/beehiiv');
  });
});
