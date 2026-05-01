/**
 * Subscriptions endpoint for the beehiiv API client.
 * Manages subscriber CRUD operations including creation, listing with
 * cursor-based pagination, updates by ID or email, deletion, and tag management.
 * @module client/endpoints/subscriptions
 */

import type {
  SubscriptionStatus,
  SubscriptionTier,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionListResponse,
  SubscriptionResponse,
} from '../../types/subscription.js';
import type { BeehiivHttpClient } from '../index.js';

/** Options for listing subscriptions with cursor-based pagination */
export interface ListSubscriptionsOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter subscriptions by email address */
  email?: string;
  /** Filter subscriptions by status */
  status?: SubscriptionStatus;
  /** Filter subscriptions by tier */
  tier?: SubscriptionTier;
}

/** Response returned after adding tags to a subscription */
export interface AddTagsResponse {
  /** The tags that were successfully added to the subscription */
  tags: string[];
}

/**
 * Client for the `/publications/{publicationId}/subscriptions` endpoints.
 * Handles creating, reading, updating, and deleting subscriptions.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const subs = new SubscriptionsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const created = await subs.create({ email: 'user@example.com' });
 * const list = await subs.list({ limit: 10 });
 *
 * // Or pass one explicitly to override
 * const created2 = await subs.create('pub_other', { email: 'user@example.com' });
 * ```
 */
export class SubscriptionsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new SubscriptionsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   * @param defaultPublicationId - Optional default publication ID from client config
   */
  constructor(httpClient: BeehiivHttpClient, defaultPublicationId?: string) {
    this._http = httpClient;
    this._defaultPublicationId = defaultPublicationId;
  }

  /**
   * Resolve the publication ID from an explicit argument or the configured default.
   * Throws if neither is available.
   */
  private _resolvePublicationId(publicationId?: string): string {
    const id = publicationId ?? this._defaultPublicationId;
    if (!id) {
      throw new Error(
        'publicationId is required. Either pass it explicitly or set it in the BeehiivClient config.',
      );
    }
    return id;
  }

  /**
   * Create a new subscription (subscriber) on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/subscriptions`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the subscription data when using the default publication ID
   * @param data - Subscription data including email and optional UTM/custom fields (when publicationId is passed explicitly)
   * @returns The newly created subscription
   */
  async create(
    publicationIdOrData: string | CreateSubscriptionRequest,
    data?: CreateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    let publicationId: string;
    let requestData: CreateSubscriptionRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      requestData = publicationIdOrData;
    }

    return this._http.post<SubscriptionResponse>(
      `/publications/${publicationId}/subscriptions`,
      requestData
    );
  }

  /**
   * List subscriptions for a publication with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/subscriptions` with optional
   * filtering by status, tier, email, and pagination via cursor tokens.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or filtering/pagination options when using the default publication ID
   * @param options - Optional filtering and pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of subscriptions with cursor metadata
   */
  async list(
    publicationIdOrOptions?: string | ListSubscriptionsOptions,
    options?: ListSubscriptionsOptions
  ): Promise<SubscriptionListResponse> {
    let publicationId: string;
    let listOptions: ListSubscriptionsOptions | undefined;

    if (typeof publicationIdOrOptions === 'string') {
      publicationId = publicationIdOrOptions;
      listOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      listOptions = publicationIdOrOptions;
    }

    const params = new URLSearchParams();

    if (listOptions?.limit !== undefined) {
      params.set('limit', String(listOptions.limit));
    }
    if (listOptions?.cursor) {
      params.set('cursor', listOptions.cursor);
    }
    if (listOptions?.email) {
      params.set('email', listOptions.email);
    }
    if (listOptions?.status) {
      params.set('status', listOptions.status);
    }
    if (listOptions?.tier) {
      params.set('tier', listOptions.tier);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/subscriptions${query ? `?${query}` : ''}`;
    return this._http.get<SubscriptionListResponse>(path);
  }

  /**
   * Get a subscription by its unique ID.
   *
   * Convenience alias for {@link getById}. When called with a single argument,
   * uses the default publication ID from the client config.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the subscription ID (when using default publication ID)
   * @param id - The subscription ID (starts with "sub_") when publicationId is passed explicitly
   * @param options - Optional parameters for expanding related data
   * @returns The subscription record
   */
  async get(
    publicationIdOrId: string,
    id?: string,
    options?: { expand?: string[] }
  ): Promise<SubscriptionResponse> {
    if (id !== undefined) {
      return this.getById(publicationIdOrId, id, options);
    }
    return this.getById(publicationIdOrId, options);
  }

  /**
   * Get a subscription by the subscriber's email address.
   *
   * Calls `GET /v2/publications/{publicationId}/subscriptions/by_email/{email}`.
   *
   * @param publicationIdOrEmail - Either the publication ID (when called with 2+ args) or the email (when using default publication ID)
   * @param emailOrOptions - The email address (when publicationId is passed explicitly) or expand options
   * @param options - Optional parameters for expanding related data
   * @returns The subscription record for the given email
   */
  async getByEmail(
    publicationIdOrEmail: string,
    emailOrOptions?: string | { expand?: string[] },
    options?: { expand?: string[] }
  ): Promise<SubscriptionResponse> {
    let publicationId: string;
    let email: string;
    let expandOptions: { expand?: string[] } | undefined;

    if (typeof emailOrOptions === 'string') {
      publicationId = publicationIdOrEmail;
      email = emailOrOptions;
      expandOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      email = publicationIdOrEmail;
      expandOptions = emailOrOptions;
    }

    const params = new URLSearchParams();

    if (expandOptions?.expand) {
      for (const field of expandOptions.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const encodedEmail = encodeURIComponent(email);
    const path = `/publications/${publicationId}/subscriptions/by_email/${encodedEmail}${query ? `?${query}` : ''}`;
    return this._http.get<SubscriptionResponse>(path);
  }

  /**
   * Get a subscription by its unique ID.
   *
   * Calls `GET /v2/publications/{publicationId}/subscriptions/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2+ args) or the subscription ID (when using default publication ID)
   * @param idOrOptions - The subscription ID (when publicationId is passed explicitly) or expand options
   * @param options - Optional parameters for expanding related data
   * @returns The subscription record
   */
  async getById(
    publicationIdOrId: string,
    idOrOptions?: string | { expand?: string[] },
    options?: { expand?: string[] }
  ): Promise<SubscriptionResponse> {
    let publicationId: string;
    let subscriptionId: string;
    let expandOptions: { expand?: string[] } | undefined;

    if (typeof idOrOptions === 'string') {
      publicationId = publicationIdOrId;
      subscriptionId = idOrOptions;
      expandOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      subscriptionId = publicationIdOrId;
      expandOptions = idOrOptions;
    }

    const params = new URLSearchParams();

    if (expandOptions?.expand) {
      for (const field of expandOptions.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/subscriptions/${subscriptionId}${query ? `?${query}` : ''}`;
    return this._http.get<SubscriptionResponse>(path);
  }

  /**
   * Update a subscription by its unique ID.
   *
   * Calls `PATCH /v2/publications/{publicationId}/subscriptions/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 3 args) or the subscription ID (when using default publication ID)
   * @param idOrData - The subscription ID (when publicationId is passed explicitly) or the update data
   * @param data - The fields to update (when publicationId is passed explicitly)
   * @returns The updated subscription record
   */
  async updateById(
    publicationIdOrId: string,
    idOrData: string | UpdateSubscriptionRequest,
    data?: UpdateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    let publicationId: string;
    let subscriptionId: string;
    let updateData: UpdateSubscriptionRequest;

    if (typeof idOrData === 'string') {
      publicationId = publicationIdOrId;
      subscriptionId = idOrData;
      updateData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      subscriptionId = publicationIdOrId;
      updateData = idOrData;
    }

    return this._http.patch<SubscriptionResponse>(
      `/publications/${publicationId}/subscriptions/${subscriptionId}`,
      updateData
    );
  }

  /**
   * Update a subscription by the subscriber's email address.
   *
   * Calls `PATCH /v2/publications/{publicationId}/subscriptions/by_email/{email}`.
   *
   * @param publicationIdOrEmail - Either the publication ID (when called with 3 args) or the email (when using default publication ID)
   * @param emailOrData - The email address (when publicationId is passed explicitly) or the update data
   * @param data - The fields to update (when publicationId is passed explicitly)
   * @returns The updated subscription record
   */
  async updateByEmail(
    publicationIdOrEmail: string,
    emailOrData: string | UpdateSubscriptionRequest,
    data?: UpdateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    let publicationId: string;
    let email: string;
    let updateData: UpdateSubscriptionRequest;

    if (typeof emailOrData === 'string') {
      publicationId = publicationIdOrEmail;
      email = emailOrData;
      updateData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      email = publicationIdOrEmail;
      updateData = emailOrData;
    }

    const encodedEmail = encodeURIComponent(email);
    return this._http.patch<SubscriptionResponse>(
      `/publications/${publicationId}/subscriptions/by_email/${encodedEmail}`,
      updateData
    );
  }

  /**
   * Delete (unsubscribe) a subscription by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/subscriptions/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the subscription ID (when using default publication ID)
   * @param id - The subscription ID to delete (when publicationId is passed explicitly)
   */
  async delete(publicationIdOrId: string, id?: string): Promise<void> {
    let publicationId: string;
    let subscriptionId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      subscriptionId = id;
    } else {
      publicationId = this._resolvePublicationId();
      subscriptionId = publicationIdOrId;
    }

    await this._http.delete(
      `/publications/${publicationId}/subscriptions/${subscriptionId}`
    );
  }

  /**
   * Add tags to a subscription.
   *
   * Calls `POST /v2/publications/{publicationId}/subscriptions/{subscriptionId}/tags`
   * with a JSON body containing the tags to add.
   *
   * Supports dual-signature calling: pass the publication ID explicitly,
   * or omit it to use the `defaultPublicationId` from the client config.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param subscriptionId - The subscription ID to tag (starts with "sub_")
   * @param tags - Array of tag strings to add to the subscription
   * @returns The tags that were added
   *
   * @example
   * ```ts
   * // Explicit publication ID
   * const result = await client.subscriptions.addTags(
   *   'pub_abc',
   *   'sub_xyz',
   *   ['vip', 'early-adopter'],
   * );
   *
   * // Using defaultPublicationId
   * const result2 = await client.subscriptions.addTags(
   *   'sub_xyz',
   *   ['vip', 'early-adopter'],
   * );
   * ```
   */
  addTags(publicationId: string, subscriptionId: string, tags: string[]): Promise<AddTagsResponse>;
  addTags(subscriptionId: string, tags: string[]): Promise<AddTagsResponse>;
  async addTags(
    publicationIdOrSubscriptionId: string,
    subscriptionIdOrTags: string | string[],
    tags?: string[]
  ): Promise<AddTagsResponse> {
    let publicationId: string;
    let subscriptionId: string;
    let tagList: string[];

    if (typeof subscriptionIdOrTags === 'string') {
      publicationId = publicationIdOrSubscriptionId;
      subscriptionId = subscriptionIdOrTags;
      tagList = tags!;
    } else {
      publicationId = this._resolvePublicationId();
      subscriptionId = publicationIdOrSubscriptionId;
      tagList = subscriptionIdOrTags;
    }

    return this._http.post<AddTagsResponse>(
      `/publications/${publicationId}/subscriptions/${subscriptionId}/tags`,
      { tags: tagList }
    );
  }
}
