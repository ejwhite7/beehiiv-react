/**
 * Core beehiiv context hook.
 * Provides access to the beehiiv configuration from the BeehiivProvider.
 * @module hooks/useBeehiiv
 */

/** The value provided by the BeehiivProvider context */
export interface BeehiivContextValue {
  /** The API base URL for proxy requests */
  apiBaseUrl: string;
  /** The publication ID */
  publicationId: string;
}

/**
 * Hook to access the beehiiv context from within a BeehiivProvider.
 * @returns The current beehiiv context value
 * @throws If used outside of a BeehiivProvider
 */
export function useBeehiiv(): BeehiivContextValue {
  // TODO: Implement React context consumption in Stage 2
  throw new Error('useBeehiiv must be used within a BeehiivProvider');
}
