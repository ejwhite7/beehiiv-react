/**
 * BeehiivProvider - React context provider for beehiiv configuration.
 *
 * Wrap your application (or a subtree) with this provider to enable
 * all beehiiv React hooks.
 *
 * @module components/BeehiivProvider
 */

import React, { useMemo } from 'react';
import {
  BeehiivContext,
  type BeehiivContextValue,
} from './beehiiv-context.js';

export { BeehiivContext } from './beehiiv-context.js';
export type { BeehiivContextValue } from './beehiiv-context.js';

/**
 * Props accepted by the {@link BeehiivProvider} component.
 */
export interface BeehiivProviderProps {
  /** Child components that can access the beehiiv context */
  children: React.ReactNode;
  /**
   * The base URL for client-side API proxy requests.
   * @defaultValue '/api/beehiiv'
   */
  apiUrl?: string;
  /** The beehiiv publication ID (starts with "pub_") */
  publicationId: string;
}

/**
 * Provides beehiiv configuration to all descendant hooks and components.
 *
 * @param props - Provider props including `publicationId` and optional `apiUrl`
 * @returns A context provider wrapping the given children
 *
 * @example
 * ```tsx
 * import { BeehiivProvider } from 'beehiiv-react';
 *
 * function App() {
 *   return (
 *     <BeehiivProvider publicationId="pub_xxxxx">
 *       <SubscriptionForm />
 *     </BeehiivProvider>
 *   );
 * }
 * ```
 */
export function BeehiivProvider(props: BeehiivProviderProps): React.JSX.Element {
  const { children, apiUrl = '/api/beehiiv', publicationId } = props;

  const value = useMemo<BeehiivContextValue>(
    () => ({
      apiUrl,
      publicationId,
      isLoading: false,
      error: null,
    }),
    [apiUrl, publicationId],
  );

  return (
    <BeehiivContext.Provider value={value}>{children}</BeehiivContext.Provider>
  );
}
