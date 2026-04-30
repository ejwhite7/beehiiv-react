/**
 * Bulk subscriptions endpoint for the beehiiv API client.
 * Handles creating multiple subscriptions in a single API call.
 * @module client/endpoints/bulkSubscriptions
 */

import type {
  BulkCreateSubscriptionsRequest,
  BulkCreateSubscriptionsResponse,
} from '../../types/bulk-subscriptions.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/bulk_subscriptions` endpoint.
 * Provides a method for creating multiple subscriptions in bulk.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), methods can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const bulk = new BulkSubscriptionsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const result = await bulk.create({
 *   subscriptions: [
 *     { email: 'user1@example.com' },
 *     { email: 'user2@example.com', utm_source: 'campaign' },
 *   ],
 * });
 *
 * // Or pass one explicitly to override
 * const result2 = await bulk.create('pub_other', {
 *   subscriptions: [{ email: 'user3@example.com' }],
 * });
 * ```
 */
export class BulkSubscriptionsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new BulkSubscriptionsEndpoint instance.
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
   * Create multiple subscriptions in a single bulk operation.
   *
   * Calls `POST /v2/publications/{publicationId}/bulk_subscriptions`.
   * The API processes the request asynchronously and returns a job ID
   * that can be polled for completion.
   *
   * @param publicationIdOrBody - Either the publication ID (starts with "pub_") or the bulk create request body when using the default publication ID
   * @param body - The bulk create request body (when publicationId is passed explicitly)
   * @returns A response containing the job ID and initial status
   */
  async create(
    publicationIdOrBody: string | BulkCreateSubscriptionsRequest,
    body?: BulkCreateSubscriptionsRequest
  ): Promise<BulkCreateSubscriptionsResponse> {
    let publicationId: string;
    let requestBody: BulkCreateSubscriptionsRequest;

    if (typeof publicationIdOrBody === 'string') {
      publicationId = publicationIdOrBody;
      requestBody = body!;
    } else {
      publicationId = this._resolvePublicationId();
      requestBody = publicationIdOrBody;
    }

    return this._http.post<BulkCreateSubscriptionsResponse>(
      `/publications/${publicationId}/bulk_subscriptions`,
      requestBody
    );
  }
}
