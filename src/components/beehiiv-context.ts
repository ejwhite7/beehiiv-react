/** Shared beehiiv context definition without provider-rendering code. */

import { createContext } from 'react';

/** The shape of the value exposed by the BeehiivProvider context. */
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

/** React context shared by the provider, core hooks, and query adapter. */
export const BeehiivContext = createContext<BeehiivContextValue | null>(null);
BeehiivContext.displayName = 'BeehiivContext';
