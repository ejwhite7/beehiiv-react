/**
 * Subscriptions endpoint for the beehiiv API client.
 * Manages subscriber CRUD operations including creation, listing with
 * cursor-based pagination, updates by ID or email, and deletion.
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
  /** Filter subscriptions by status */
  status?: SubscriptionStatus;
  /** Filter subscriptions by tier */
  tier?: SubscriptionTier;
}

/**
 * Client for the `/publications/{publicationId}/subscriptions` endpoints.
 * Handles creating, reading, updating, and deleting subscriptions.
 *
 * Supports both ID-based and email-based lookups and updates, as well as
 * cursor-based pagination for listing subscribers.
 *
 * @example
 * ```ts
 * const subs = new SubscriptionsEndpoint(httpClient);
 * const created = await subs.create('pub_abc', { email: 'user@example.com' });
 * const list = await subs.list('pub_abc', { limit: 10 });
 * const byEmail = await subs.getByEmail('pub_abc', 'user@example.com');
 * ```
 */
export class SubscriptionsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new SubscriptionsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * Create a new subscription (subscriber) on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/subscriptions`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param data - Subscription data including email and optional UTM/custom fields
   * @returns The newly created subscription
   */
  async create(
    publicationId: string,
    data: CreateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    return this._http.post<SubscriptionResponse>(
      `/publications/${publicationId}/subscriptions`,
      data
    );
  }

  /**
   * List subscriptions for a publication with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/subscriptions` with optional
   * filtering by status, tier, and pagination via cursor tokens.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param options - Optional filtering and pagination parameters
   * @returns Paginated list of subscriptions with cursor metadata
   */
  async list(
    publicationId: string,
    options?: ListSubscriptionsOptions
  ): Promise<SubscriptionListResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.status) {
      params.set('status', options.status);
    }
    if (options?.tier) {
      params.set('tier', options.tier);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/subscriptions${query ? `?${query}` : ''}`;
    return this._http.get<SubscriptionListResponse>(path);
  }

  /**
   * Get a subscription by the subscriber's email address.
   *
   * Calls `GET /v2/publications/{publicationId}/subscriptions/by_email/{email}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param email - The subscriber's email address
   * @param options - Optional parameters for expanding related data
   * @returns The subscription record for the given email
   */
  async getByEmail(
    publicationId: string,
    email: string,
    options?: { expand?: string[] }
  ): Promise<SubscriptionResponse> {
    const params = new URLSearchParams();

    if (options?.expand) {
      for (const field of options.expand) {
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
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The subscription ID (starts with "sub_")
   * @param options - Optional parameters for expanding related data
   * @returns The subscription record
   */
  async getById(
    publicationId: string,
    id: string,
    options?: { expand?: string[] }
  ): Promise<SubscriptionResponse> {
    const params = new URLSearchParams();

    if (options?.expand) {
      for (const field of options.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/subscriptions/${id}${query ? `?${query}` : ''}`;
    return this._http.get<SubscriptionResponse>(path);
  }

  /**
   * Update a subscription by its unique ID.
   *
   * Calls `PATCH /v2/publications/{publicationId}/subscriptions/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The subscription ID to update (starts with "sub_")
   * @param data - The fields to update (email, custom_fields, unsubscribe)
   * @returns The updated subscription record
   */
  async updateById(
    publicationId: string,
    id: string,
    data: UpdateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    return this._http.patch<SubscriptionResponse>(
      `/publications/${publicationId}/subscriptions/${id}`,
      data
    );
  }

  /**
   * Update a subscription by the subscriber's email address.
   *
   * Calls `PATCH /v2/publications/{publicationId}/subscriptions/by_email/{email}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param email - The subscriber's email address
   * @param data - The fields to update (email, custom_fields, unsubscribe)
   * @returns The updated subscription record
   */
  async updateByEmail(
    publicationId: string,
    email: string,
    data: UpdateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    const encodedEmail = encodeURIComponent(email);
    return this._http.patch<SubscriptionResponse>(
      `/publications/${publicationId}/subscriptions/by_email/${encodedEmail}`,
      data
    );
  }

  /**
   * Delete (unsubscribe) a subscription by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/subscriptions/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The subscription ID to delete (starts with "sub_")
   */
  async delete(publicationId: string, id: string): Promise<void> {
    await this._http.delete(
      `/publications/${publicationId}/subscriptions/${id}`
    );
  }
}
