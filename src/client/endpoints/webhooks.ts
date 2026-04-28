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
 * @example
 * ```ts
 * const wh = new WebhooksEndpoint(httpClient);
 * const list = await wh.list('pub_abc');
 * const created = await wh.create('pub_abc', {
 *   url: 'https://example.com/hook',
 *   event_types: ['subscription.created'],
 * });
 * ```
 */
export class WebhooksEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new WebhooksEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * List all webhooks for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/webhooks`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @returns List of webhook records
   */
  async list(publicationId: string): Promise<WebhookListResponse> {
    return this._http.get<WebhookListResponse>(
      `/publications/${publicationId}/webhooks`
    );
  }

  /**
   * Get a specific webhook by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/webhooks/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The webhook endpoint ID
   * @returns The webhook record
   */
  async get(publicationId: string, id: string): Promise<WebhookResponse> {
    return this._http.get<WebhookResponse>(
      `/publications/${publicationId}/webhooks/${id}`
    );
  }

  /**
   * Create a new webhook for a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/webhooks`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param data - The webhook configuration including URL and event types
   * @returns The newly created webhook
   */
  async create(
    publicationId: string,
    data: CreateWebhookRequest
  ): Promise<WebhookResponse> {
    return this._http.post<WebhookResponse>(
      `/publications/${publicationId}/webhooks`,
      data
    );
  }

  /**
   * Update an existing webhook.
   *
   * Calls `PATCH /v2/publications/{publicationId}/webhooks/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The webhook endpoint ID to update
   * @param data - The fields to update (event_types, url, active)
   * @returns The updated webhook record
   */
  async update(
    publicationId: string,
    id: string,
    data: UpdateWebhookRequest
  ): Promise<WebhookResponse> {
    return this._http.patch<WebhookResponse>(
      `/publications/${publicationId}/webhooks/${id}`,
      data
    );
  }

  /**
   * Delete a webhook by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/webhooks/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The webhook endpoint ID to delete
   */
  async delete(publicationId: string, id: string): Promise<void> {
    await this._http.delete(
      `/publications/${publicationId}/webhooks/${id}`
    );
  }

  /**
   * Send a test event to a webhook endpoint.
   *
   * Calls `POST /v2/publications/{publicationId}/webhooks/{id}/test`.
   * This triggers a test payload to be sent to the webhook's configured URL,
   * allowing verification that the endpoint is reachable and working.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The webhook endpoint ID to test
   */
  async test(publicationId: string, id: string): Promise<void> {
    await this._http.post<void>(
      `/publications/${publicationId}/webhooks/${id}/test`,
      {}
    );
  }
}
