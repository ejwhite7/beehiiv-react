/**
 * Webhooks endpoint for the beehiiv API client.
 * Manages webhook CRUD operations including creation, listing,
 * updates, deletion, and testing for a publication.
 * @module client/endpoints/webhooks
 */

import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookResponse,
  WebhookListResponse,
} from '../../types/webhook.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/webhooks` endpoints.
 * Handles creating, reading, updating, deleting, and testing webhooks.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const wh = new WebhooksEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const list = await wh.list();
 * const created = await wh.create({
 *   url: 'https://example.com/hook',
 *   event_types: ['subscription.created'],
 * });
 *
 * // Or pass one explicitly to override
 * const list2 = await wh.list('pub_other');
 * ```
 */
export class WebhooksEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new WebhooksEndpoint instance.
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
   * List all webhooks for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/webhooks`.
   *
   * @param publicationId - Optional publication ID (uses default if omitted)
   * @returns List of webhook records
   */
  async list(publicationId?: string): Promise<WebhookListResponse> {
    const resolvedId = this._resolvePublicationId(publicationId);
    return this._http.get<WebhookListResponse>(
      `/publications/${resolvedId}/webhooks`
    );
  }

  /**
   * Get a specific webhook by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/webhooks/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the webhook endpoint ID (when using default publication ID)
   * @param id - The webhook endpoint ID (when publicationId is passed explicitly)
   * @returns The webhook record
   */
  async get(publicationIdOrId: string, id?: string): Promise<WebhookResponse> {
    let publicationId: string;
    let webhookId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      webhookId = id;
    } else {
      publicationId = this._resolvePublicationId();
      webhookId = publicationIdOrId;
    }

    return this._http.get<WebhookResponse>(
      `/publications/${publicationId}/webhooks/${webhookId}`
    );
  }

  /**
   * Create a new webhook for a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/webhooks`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the webhook data when using the default publication ID
   * @param data - The webhook configuration including URL and event types (when publicationId is passed explicitly)
   * @returns The newly created webhook
   */
  async create(
    publicationIdOrData: string | CreateWebhookRequest,
    data?: CreateWebhookRequest
  ): Promise<WebhookResponse> {
    let publicationId: string;
    let requestData: CreateWebhookRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      requestData = publicationIdOrData;
    }

    return this._http.post<WebhookResponse>(
      `/publications/${publicationId}/webhooks`,
      requestData
    );
  }

  /**
   * Update an existing webhook.
   *
   * Calls `PATCH /v2/publications/{publicationId}/webhooks/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 3 args) or the webhook endpoint ID (when using default publication ID)
   * @param idOrData - The webhook endpoint ID (when publicationId is passed explicitly) or the update data
   * @param data - The fields to update (when publicationId is passed explicitly)
   * @returns The updated webhook record
   */
  async update(
    publicationIdOrId: string,
    idOrData: string | UpdateWebhookRequest,
    data?: UpdateWebhookRequest
  ): Promise<WebhookResponse> {
    let publicationId: string;
    let webhookId: string;
    let updateData: UpdateWebhookRequest;

    if (typeof idOrData === 'string') {
      publicationId = publicationIdOrId;
      webhookId = idOrData;
      updateData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      webhookId = publicationIdOrId;
      updateData = idOrData;
    }

    return this._http.patch<WebhookResponse>(
      `/publications/${publicationId}/webhooks/${webhookId}`,
      updateData
    );
  }

  /**
   * Delete a webhook by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/webhooks/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the webhook endpoint ID (when using default publication ID)
   * @param id - The webhook endpoint ID to delete (when publicationId is passed explicitly)
   */
  async delete(publicationIdOrId: string, id?: string): Promise<void> {
    let publicationId: string;
    let webhookId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      webhookId = id;
    } else {
      publicationId = this._resolvePublicationId();
      webhookId = publicationIdOrId;
    }

    await this._http.delete(
      `/publications/${publicationId}/webhooks/${webhookId}`
    );
  }

  /**
   * Send a test event to a webhook endpoint.
   *
   * Calls `POST /v2/publications/{publicationId}/webhooks/{id}/test`.
   * This triggers a test payload to be sent to the webhook's configured URL,
   * allowing verification that the endpoint is reachable and working.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the webhook endpoint ID (when using default publication ID)
   * @param id - The webhook endpoint ID to test (when publicationId is passed explicitly)
   */
  async test(publicationIdOrId: string, id?: string): Promise<void> {
    let publicationId: string;
    let webhookId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      webhookId = id;
    } else {
      publicationId = this._resolvePublicationId();
      webhookId = publicationIdOrId;
    }

    await this._http.post<void>(
      `/publications/${publicationId}/webhooks/${webhookId}/test`,
      {}
    );
  }
}
