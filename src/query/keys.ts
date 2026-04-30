/**
 * TanStack Query key factory for beehiiv API resources.
 *
 * Provides a structured, type-safe key hierarchy that follows
 * the recommended TanStack Query key factory pattern.
 * Each key is a `readonly` tuple so that TanStack Query can
 * perform exact or fuzzy matching for invalidation and cache look-ups.
 *
 * @module query/keys
 */

/**
 * Options used to filter a paginated list of posts.
 */
export interface PostListKeyOptions {
  /** Filter by publication status */
  status?: string;
  /** Filter by target audience */
  audience?: string;
  /** Maximum results per page */
  limit?: number;
}

/**
 * Options used to filter a paginated list of subscribers.
 */
export interface SubscriberListKeyOptions {
  /** Filter by subscriber email */
  email?: string;
  /** Filter by subscriber status */
  status?: string;
  /** Maximum results per page */
  limit?: number;
}

/**
 * Options used to filter a paginated list of publications.
 */
export interface PublicationListKeyOptions {
  /** Expandable fields (e.g. "stats") */
  expand?: string[];
}

/**
 * Options used to filter a paginated list of automations.
 */
export interface AutomationListKeyOptions {
  /** Filter by automation status */
  status?: string;
}

/**
 * Options used to filter a paginated list of tiers.
 */
export interface TierListKeyOptions {
  /** Filter by tier type (free or premium) */
  type?: string;
  /** Filter by active status */
  active?: boolean;
  /** Maximum results per page */
  limit?: number;
}

/**
 * Query key factory for all beehiiv API resources.
 *
 * Keys follow the hierarchical `[scope, entity, ...params]` convention
 * recommended by TanStack Query so that `queryClient.invalidateQueries`
 * can target broad scopes (e.g. all posts) or specific entries.
 *
 * @example
 * ```ts
 * // Invalidate every post-related query
 * queryClient.invalidateQueries({ queryKey: beehiivKeys.posts.all });
 *
 * // Invalidate only the filtered list
 * queryClient.invalidateQueries({
 *   queryKey: beehiivKeys.posts.list({ status: 'confirmed' }),
 * });
 * ```
 */
export const beehiivKeys = {
  /**
   * Keys for post-related queries.
   */
  posts: {
    /** Root key that matches every post query. */
    all: ['beehiiv', 'posts'] as const,

    /**
     * Key for a filtered/paginated post list.
     *
     * @param options - Optional filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: PostListKeyOptions) =>
      ['beehiiv', 'posts', 'list', options ?? {}] as const,

    /**
     * Key for a single post by ID.
     *
     * @param id - The post identifier (starts with "post_")
     * @returns A readonly query key tuple
     */
    detail: (id: string) =>
      ['beehiiv', 'posts', 'detail', id] as const,
  },

  /**
   * Keys for subscriber-related queries.
   */
  subscribers: {
    /** Root key that matches every subscriber query. */
    all: ['beehiiv', 'subscribers'] as const,

    /**
     * Key for a filtered/paginated subscriber list.
     *
     * @param options - Optional filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: SubscriberListKeyOptions) =>
      ['beehiiv', 'subscribers', 'list', options ?? {}] as const,
  },

  /**
   * Keys for subscription look-up queries.
   */
  subscriptions: {
    /**
     * Key for a single subscription by email or ID.
     *
     * @param emailOrId - The subscriber email address or subscription ID
     * @returns A readonly query key tuple
     */
    detail: (emailOrId: string) =>
      ['beehiiv', 'subscriptions', 'detail', emailOrId] as const,
  },

  /**
   * Keys for publication-related queries.
   */
  publications: {
    /** Root key that matches every publication query. */
    all: ['beehiiv', 'publications'] as const,

    /**
     * Key for a filtered/paginated publication list.
     *
     * @param options - Optional filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: PublicationListKeyOptions) =>
      ['beehiiv', 'publications', 'list', options ?? {}] as const,
  },

  /**
   * Keys for custom-field queries.
   */
  customFields: {
    /** Root key that matches every custom-field query. */
    all: ['beehiiv', 'customFields'] as const,

    /**
     * Key for the full custom-field list.
     *
     * @returns A readonly query key tuple
     */
    list: () =>
      ['beehiiv', 'customFields', 'list'] as const,
  },

  /**
   * Keys for webhook queries.
   */
  webhooks: {
    /** Root key that matches every webhook query. */
    all: ['beehiiv', 'webhooks'] as const,

    /**
     * Key for the full webhook list.
     *
     * @returns A readonly query key tuple
     */
    list: () =>
      ['beehiiv', 'webhooks', 'list'] as const,
  },

  /**
   * Keys for segment queries.
   */
  segments: {
    /** Root key that matches every segment query. */
    all: ['beehiiv', 'segments'] as const,

    /**
     * Key for the full segment list.
     *
     * @returns A readonly query key tuple
     */
    list: () =>
      ['beehiiv', 'segments', 'list'] as const,
  },

  /**
   * Keys for automation queries.
   */
  automations: {
    /** Root key that matches every automation query. */
    all: ['beehiiv', 'automations'] as const,

    /**
     * Key for a filtered/paginated automation list.
     *
     * @param options - Optional filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: AutomationListKeyOptions) =>
      ['beehiiv', 'automations', 'list', options ?? {}] as const,
  },

  /**
   * Keys for referral-related queries.
   */
  referrals: {
    /**
     * Key for the referral program details.
     *
     * @returns A readonly query key tuple
     */
    program: () =>
      ['beehiiv', 'referrals', 'program'] as const,

    /**
     * Key for a specific subscriber's referral statistics.
     *
     * @param subscriberId - The subscriber identifier
     * @returns A readonly query key tuple
     */
    subscriberStats: (subscriberId: string) =>
      ['beehiiv', 'referrals', 'subscriberStats', subscriberId] as const,
  },

  /**
   * Keys for tier-related queries.
   */
  tiers: {
    /** Root key that matches every tier query. */
    all: ['beehiiv', 'tiers'] as const,

    /**
     * Key for a filtered/paginated tier list.
     *
     * @param options - Optional filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: TierListKeyOptions) =>
      ['beehiiv', 'tiers', 'list', options ?? {}] as const,

    /**
     * Key for a single tier by ID.
     *
     * @param id - The tier identifier (starts with "tier_")
     * @returns A readonly query key tuple
     */
    detail: (id: string) =>
      ['beehiiv', 'tiers', 'detail', id] as const,
  },
} as const;
