"use client";

/**
 * Core beehiiv context hook.
 *
 * Provides type-safe access to the beehiiv configuration values
 * set by the nearest {@link BeehiivProvider}.
 *
 * @module hooks/useBeehiiv
 */

import { useContext } from 'react';

import {
  BeehiivContext,
  type BeehiivContextValue,
} from '../components/BeehiivProvider.js';

// Re-export so consumers can import the type from the hooks barrel.
export type { BeehiivContextValue } from '../components/BeehiivProvider.js';

/**
 * Hook to access the beehiiv context from within a `<BeehiivProvider>`.
 *
 * @returns The current {@link BeehiivContextValue}
 * @throws {Error} If called outside of a `<BeehiivProvider>`
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { apiUrl, publicationId } = useBeehiiv();
 *   // ...
 * }
 * ```
 */
export function useBeehiiv(): BeehiivContextValue {
  const context = useContext(BeehiivContext);

  if (context === null) {
    throw new Error(
      'useBeehiiv must be used within a <BeehiivProvider>. ' +
        'Wrap your component tree with <BeehiivProvider publicationId="...">.',
    );
  }

  return context;
}
