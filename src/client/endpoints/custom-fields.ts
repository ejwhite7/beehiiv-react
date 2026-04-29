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
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const cf = new CustomFieldsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const fields = await cf.list();
 * const created = await cf.create({ kind: 'string', display: 'Company' });
 *
 * // Or pass one explicitly to override
 * const fields2 = await cf.list('pub_other');
 * ```
 */
export class CustomFieldsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new CustomFieldsEndpoint instance.
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
   * List all custom fields for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/custom_fields` with optional
   * offset-based pagination parameters.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or pagination options when using the default publication ID
   * @param options - Optional pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of custom field definitions
   */
  async list(
    publicationIdOrOptions?: string | { limit?: number; page?: number },
    options?: { limit?: number; page?: number }
  ): Promise<CustomFieldIndexResponse> {
    let publicationId: string;
    let listOptions: { limit?: number; page?: number } | undefined;

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
    if (listOptions?.page !== undefined) {
      params.set('page', String(listOptions.page));
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
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the custom field ID (when using default publication ID)
   * @param id - The custom field ID (when publicationId is passed explicitly)
   * @returns The custom field definition
   */
  async get(publicationIdOrId: string, id?: string): Promise<CustomFieldResponse> {
    let publicationId: string;
    let fieldId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      fieldId = id;
    } else {
      publicationId = this._resolvePublicationId();
      fieldId = publicationIdOrId;
    }

    return this._http.get<CustomFieldResponse>(
      `/publications/${publicationId}/custom_fields/${fieldId}`
    );
  }

  /**
   * Create a new custom field on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/custom_fields`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the custom field data when using the default publication ID
   * @param data - The custom field definition to create (when publicationId is passed explicitly)
   * @returns The newly created custom field
   */
  async create(
    publicationIdOrData: string | { kind: CustomFieldKind; display: string },
    data?: { kind: CustomFieldKind; display: string }
  ): Promise<CustomFieldResponse> {
    let publicationId: string;
    let requestData: { kind: CustomFieldKind; display: string };

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      requestData = publicationIdOrData;
    }

    return this._http.post<CustomFieldResponse>(
      `/publications/${publicationId}/custom_fields`,
      requestData
    );
  }

  /**
   * Update an existing custom field's display name.
   *
   * Calls `PUT /v2/publications/{publicationId}/custom_fields/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 3 args) or the custom field ID (when using default publication ID)
   * @param idOrData - The custom field ID (when publicationId is passed explicitly) or the update data
   * @param data - The fields to update (when publicationId is passed explicitly)
   * @returns The updated custom field
   */
  async update(
    publicationIdOrId: string,
    idOrData: string | { display: string },
    data?: { display: string }
  ): Promise<CustomFieldResponse> {
    let publicationId: string;
    let fieldId: string;
    let updateData: { display: string };

    if (typeof idOrData === 'string') {
      publicationId = publicationIdOrId;
      fieldId = idOrData;
      updateData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      fieldId = publicationIdOrId;
      updateData = idOrData;
    }

    return this._http.put<CustomFieldResponse>(
      `/publications/${publicationId}/custom_fields/${fieldId}`,
      updateData
    );
  }

  /**
   * Delete a custom field by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/custom_fields/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the custom field ID (when using default publication ID)
   * @param id - The custom field ID to delete (when publicationId is passed explicitly)
   */
  async delete(publicationIdOrId: string, id?: string): Promise<void> {
    let publicationId: string;
    let fieldId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      fieldId = id;
    } else {
      publicationId = this._resolvePublicationId();
      fieldId = publicationIdOrId;
    }

    await this._http.delete(
      `/publications/${publicationId}/custom_fields/${fieldId}`
    );
  }
}
