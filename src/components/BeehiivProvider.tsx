/**
 * BeehiivProvider - React context provider for beehiiv configuration.
 *
 * Wrap your application (or a subtree) with this provider to enable
 * all beehiiv React hooks (`useBeehiiv`, `useSubscribe`, `useSubscription`,
 * `useCustomFields`).
 *
 * @module components/BeehiivProvider
 */

import React, { createContext, useMemo } from 'react';

/**
 * The shape of the value exposed by the BeehiivProvider context.
 *
 * Consumers can read this via the `useBeehiiv()` hook.
 */
export interface BeehiivContextValue {
  /** Base URL for client-side API calls (e.g. '/api/beehiiv') */
  apiUrl: string;
  /** The beehiiv publication ID (starts with "pub_") */
  publicationId: string;
  /** Whether a global operation is in progress */
  isLoading: boolean;
  /** The most recent global error, if any */
  error: Error | null;
}

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
 * React context that holds the current {@link BeehiivContextValue}.
 *
 * Use the `useBeehiiv()` hook instead of consuming this context directly.
 */
export const BeehiivContext = createContext<BeehiivContextValue | null>(null);
BeehiivContext.displayName = 'BeehiivContext';

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
