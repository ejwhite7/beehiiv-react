/**
 * Custom fields endpoint for the beehiiv API client.
 * Manages custom field definitions on a publication.
 * @module client/endpoints/custom-fields
 */

import type {
  CustomFieldKind,
  CustomFieldIndexResponse,
  CustomFieldResponse,
} from '../../types/custom-field.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/custom_fields` endpoints.
 * Handles creating, reading, updating, and deleting custom field definitions.
 *
 * @example
 * ```ts
 * const cf = new CustomFieldsEndpoint(httpClient);
 * const fields = await cf.list('pub_abc123');
 * const created = await cf.create('pub_abc123', { kind: 'string', display: 'Company' });
 * ```
 */
export class CustomFieldsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new CustomFieldsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * List all custom fields for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/custom_fields` with optional
   * offset-based pagination parameters.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param options - Optional pagination parameters
   * @returns Paginated list of custom field definitions
   */
  async list(
    publicationId: string,
    options?: { limit?: number; page?: number }
  ): Promise<CustomFieldIndexResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.page !== undefined) {
      params.set('page', String(options.page));
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/custom_fields${query ? `?${query}` : ''}`;
    return this._http.get<CustomFieldIndexResponse>(path);
  }

  /**
   * Get a single custom field by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/custom_fields/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The custom field ID
   * @returns The custom field definition
   */
  async get(publicationId: string, id: string): Promise<CustomFieldResponse> {
    return this._http.get<CustomFieldResponse>(
      `/publications/${publicationId}/custom_fields/${id}`
    );
  }

  /**
   * Create a new custom field on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/custom_fields`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param data - The custom field definition to create
   * @returns The newly created custom field
   */
  async create(
    publicationId: string,
    data: { kind: CustomFieldKind; display: string }
  ): Promise<CustomFieldResponse> {
    return this._http.post<CustomFieldResponse>(
      `/publications/${publicationId}/custom_fields`,
      data
    );
  }

  /**
   * Update an existing custom field's display name.
   *
   * Calls `PUT /v2/publications/{publicationId}/custom_fields/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The custom field ID to update
   * @param data - The fields to update
   * @returns The updated custom field
   */
  async update(
    publicationId: string,
    id: string,
    data: { display: string }
  ): Promise<CustomFieldResponse> {
    return this._http.put<CustomFieldResponse>(
      `/publications/${publicationId}/custom_fields/${id}`,
      data
    );
  }

  /**
   * Delete a custom field by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/custom_fields/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The custom field ID to delete
   */
  async delete(publicationId: string, id: string): Promise<void> {
    await this._http.delete(
      `/publications/${publicationId}/custom_fields/${id}`
    );
  }
}
