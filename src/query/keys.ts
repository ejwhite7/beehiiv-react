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
  /** Publication owning the posts */
  publicationId?: string;
  /** Filter by publication status */
  status?: string;
  /** Filter by target audience */
  audience?: string;
  /** Maximum results per page */
  limit?: number;
  /** Related post fields expanded in the response */
  expand?: string[];
}

/**
 * Options used to filter a paginated list of subscribers.
 */
export interface SubscriberListKeyOptions {
  /** Publication owning the subscribers */
  publicationId?: string;
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
  /** Maximum results per page */
  limit?: number;
  /** Publication ID override (when not using the provider default) */
  publicationId?: string;
}

/**
 * Options used to scope a webhook list query.
 */
export interface WebhookListKeyOptions {
  /** Maximum results per page */
  limit?: number;
  /** Publication ID override (when not using the provider default) */
  publicationId?: string;
}

/**
 * Options used to filter a paginated list of segments.
 */
export interface SegmentListKeyOptions {
  /** Filter by segment type */
  type?: string;
  /** Filter by segment status */
  status?: string;
  /** Maximum results per page */
  limit?: number;
  /** Publication ID override (when not using the provider default) */
  publicationId?: string;
}

/**
 * Options used to scope a single-entity (detail) query.
 */
export interface DetailKeyOptions {
  /** Publication ID override (when not using the provider default) */
  publicationId?: string;
}

/**
 * Options used to scope and paginate a segment results query.
 */
export interface SegmentResultsKeyOptions {
  /** Publication ID override (when not using the provider default) */
  publicationId?: string;
  /** Maximum results per page */
  limit?: number;
  /** Page number to retrieve */
  page?: number;
}

/**
 * Options used to filter a paginated list of tiers.
 */
export interface TierListKeyOptions {
  /** Publication owning the tiers */
  publicationId?: string;
  /** Filter by tier type (free or premium) */
  type?: string;
  /** Filter by active status */
  active?: boolean;
  /** Maximum results per page */
  limit?: number;
}

/**
 * Options used to filter a paginated list of authors.
 */
export interface AuthorListKeyOptions {
  /** Publication owning the authors */
  publicationId?: string;
  /** Maximum results per page */
  limit?: number;
}

/**
 * Options used to filter engagement queries by date range.
 */
export interface EngagementListKeyOptions {
  /** Publication owning the engagement metrics */
  publicationId?: string;
  /** Start date for the engagement data range (ISO 8601 date string) */
  start_date?: string;
  /** End date for the engagement data range (ISO 8601 date string) */
  end_date?: string;
  /** Related engagement fields expanded in the response */
  expand?: string[];
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
    detail: (id: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'posts', 'detail', id, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'posts', 'detail', id] as const),
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
    detail: (emailOrId: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'subscriptions', 'detail', emailOrId, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'subscriptions', 'detail', emailOrId] as const),
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
    list: (scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'customFields', 'list', { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'customFields', 'list'] as const),
  },

  /**
   * Keys for webhook queries.
   */
  webhooks: {
    /** Root key that matches every webhook query. */
    all: ['beehiiv', 'webhooks'] as const,

    /**
     * Key for a filtered/scoped webhook list.
     *
     * @param options - Optional filter/scope parameters
     * @returns A readonly query key tuple
     */
    list: (options?: WebhookListKeyOptions) =>
      ['beehiiv', 'webhooks', 'list', options ?? {}] as const,

    /**
     * Key for a single webhook by ID.
     *
     * The scope element is only appended when a publication override is
     * present, so `detail(id)` remains a fuzzy-match prefix of scoped keys.
     *
     * @param id - The webhook endpoint identifier
     * @param scope - Optional publication scope
     * @returns A readonly query key tuple
     */
    detail: (id: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'webhooks', 'detail', id, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'webhooks', 'detail', id] as const),
  },

  /**
   * Keys for segment queries.
   */
  segments: {
    /** Root key that matches every segment query. */
    all: ['beehiiv', 'segments'] as const,

    /**
     * Key for a filtered/scoped segment list.
     *
     * @param options - Optional filter/scope parameters
     * @returns A readonly query key tuple
     */
    list: (options?: SegmentListKeyOptions) =>
      ['beehiiv', 'segments', 'list', options ?? {}] as const,

    /**
     * Key for a single segment by ID.
     *
     * The scope element is only appended when a publication override is
     * present, so `detail(id)` remains a fuzzy-match prefix of scoped keys.
     *
     * @param id - The segment identifier (starts with "seg_")
     * @param scope - Optional publication scope
     * @returns A readonly query key tuple
     */
    detail: (id: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'segments', 'detail', id, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'segments', 'detail', id] as const),

    /**
     * Key for a segment's subscriber ID results.
     *
     * The scope element is only appended when scope options are present,
     * so `results(id)` remains a fuzzy-match prefix of scoped keys.
     *
     * @param segmentId - The segment identifier (starts with "seg_")
     * @param scope - Optional publication/pagination scope
     * @returns A readonly query key tuple
     */
    results: (segmentId: string, scope?: SegmentResultsKeyOptions) =>
      scope && Object.keys(scope).length > 0
        ? (['beehiiv', 'segments', 'results', segmentId, scope] as const)
        : (['beehiiv', 'segments', 'results', segmentId] as const),
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

    /**
     * Key for a single automation by ID.
     *
     * The scope element is only appended when a publication override is
     * present, so `detail(id)` remains a fuzzy-match prefix of scoped keys.
     *
     * @param id - The automation identifier (starts with "aut_")
     * @param scope - Optional publication scope
     * @returns A readonly query key tuple
     */
    detail: (id: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'automations', 'detail', id, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'automations', 'detail', id] as const),
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
    program: (scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'referrals', 'program', { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'referrals', 'program'] as const),

    /**
     * Key for a specific subscriber's referral statistics.
     *
     * @param subscriberId - The subscriber identifier
     * @returns A readonly query key tuple
     */
    subscriberStats: (subscriberId: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'referrals', 'subscriberStats', subscriberId, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'referrals', 'subscriberStats', subscriberId] as const),
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
    detail: (id: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'tiers', 'detail', id, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'tiers', 'detail', id] as const),
  },

  /**
   * Keys for author-related queries.
   */
  authors: {
    /** Root key that matches every author query. */
    all: ['beehiiv', 'authors'] as const,

    /**
     * Key for a filtered/paginated author list.
     *
     * @param options - Optional filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: AuthorListKeyOptions) =>
      ['beehiiv', 'authors', 'list', options ?? {}] as const,

    /**
     * Key for a single author by ID.
     *
     * @param id - The author identifier (starts with "author_")
     * @returns A readonly query key tuple
     */
    detail: (id: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'authors', 'detail', id, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'authors', 'detail', id] as const),
  },

  /**
   * Keys for bulk subscription creation queries.
   */
  bulkSubscriptions: {
    /** Root key that matches every bulk subscription query. */
    all: ['beehiiv', 'bulkSubscriptions'] as const,

    /**
     * Key for a specific bulk subscription job by ID.
     *
     * @param jobId - The bulk subscription job identifier
     * @returns A readonly query key tuple
     */
    detail: (jobId: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'bulkSubscriptions', 'detail', jobId, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'bulkSubscriptions', 'detail', jobId] as const),
  },

  /**
   * Keys for bulk subscription update job queries.
   */
  bulkSubscriptionUpdates: {
    /** Root key that matches every bulk subscription update query. */
    all: ['beehiiv', 'bulkSubscriptionUpdates'] as const,

    /**
     * Key for the list of bulk update jobs.
     *
     * @returns A readonly query key tuple
     */
    list: (scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'bulkSubscriptionUpdates', 'list', { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'bulkSubscriptionUpdates', 'list'] as const),

    /**
     * Key for a specific bulk update job by ID.
     *
     * @param jobId - The bulk update job identifier
     * @returns A readonly query key tuple
     */
    detail: (jobId: string, scope?: DetailKeyOptions) =>
      scope?.publicationId
        ? (['beehiiv', 'bulkSubscriptionUpdates', 'detail', jobId, { publicationId: scope.publicationId }] as const)
        : (['beehiiv', 'bulkSubscriptionUpdates', 'detail', jobId] as const),
  },

  /**
   * Keys for engagement queries.
   */
  engagements: {
    /** Root key that matches every engagement query. */
    all: ['beehiiv', 'engagements'] as const,

    /**
     * Key for engagement metrics filtered by date range.
     *
     * @param options - Optional date range filter parameters
     * @returns A readonly query key tuple
     */
    list: (options?: EngagementListKeyOptions) =>
      ['beehiiv', 'engagements', 'list', options ?? {}] as const,
  },
} as const;
