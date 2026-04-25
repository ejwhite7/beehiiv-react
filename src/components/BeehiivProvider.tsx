/**
 * BeehiivProvider - React context provider for beehiiv configuration.
 * Wrap your app (or a subtree) with this provider to enable hooks.
 * @module components/BeehiivProvider
 */

import React from 'react';

/** Props for the BeehiivProvider component */
export interface BeehiivProviderProps {
  /** The publication ID (starts with "pub_") */
  publicationId: string;
  /** The API base URL for proxy requests (default: "/api/beehiiv") */
  apiBaseUrl?: string;
  /** Child components that can access the beehiiv context */
  children: React.ReactNode;
}

/**
 * Provides beehiiv configuration to descendant hooks and components.
 *
 * @example
 * ```tsx
 * <BeehiivProvider publicationId="pub_xxxxx">
 *   <SubscriptionForm />
 * </BeehiivProvider>
 * ```
 */
export function BeehiivProvider(_props: BeehiivProviderProps): React.JSX.Element {
  // TODO: Implement React context provider in Stage 2
  void _props;
  throw new Error('Not yet implemented');
}
