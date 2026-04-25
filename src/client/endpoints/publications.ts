/**
 * Publications endpoint for the beehiiv API client.
 * Retrieves publication information and statistics.
 * @module client/endpoints/publications
 */

import type { RequestDirection } from '../../types/common.js';
import type {
  PublicationsListResponse,
  PublicationResponse,
  PublicationsRequestExpand,
} from '../../types/publication.js';
import type { BeehiivHttpClient } from '../index.js';

/** Options for listing publications */
export interface ListPublicationsOptions {
  /** Fields to expand in the response (e.g. "stats") */
  expand?: PublicationsRequestExpand[];
  /** Maximum number of results to return per page */
  limit?: number;
  /** Page number for offset-based pagination (1-indexed) */
  page?: number;
  /** Sort direction for results */
  direction?: RequestDirection;
  /** Field to order results by */
  orderBy?: 'created' | 'name';
}

/**
 * Client for the `/publications` endpoints.
 * Handles reading publication data and aggregate statistics.
 *
 * @example
 * ```ts
 * const publications = new PublicationsEndpoint(httpClient);
 * const all = await publications.list({ expand: ['stats'] });
 * const single = await publications.get('pub_abc123');
 * ```
 */
export class PublicationsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new PublicationsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * List all publications accessible with the current API key.
   *
   * Calls `GET /v2/publications` with optional query parameters for
   * expansion, pagination, and sorting.
   *
   * @param options - Optional query parameters for filtering and pagination
   * @returns A list of publications matching the query
   */
  async list(options?: ListPublicationsOptions): Promise<PublicationsListResponse> {
    const params = new URLSearchParams();

    if (options?.expand) {
      for (const field of options.expand) {
        params.append('expand[]', field);
      }
    }
    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.page !== undefined) {
      params.set('page', String(options.page));
    }
    if (options?.direction) {
      params.set('direction', options.direction);
    }
    if (options?.orderBy) {
      params.set('order_by', options.orderBy);
    }

    const query = params.toString();
    const path = `/publications${query ? `?${query}` : ''}`;
    return this._http.get<PublicationsListResponse>(path);
  }

  /**
   * Get a single publication by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}` with optional expansion.
   *
   * @param publicationId - The ID of the publication to retrieve (starts with "pub_")
   * @param options - Optional parameters for expanding related data
   * @returns The publication record
   */
  async get(
    publicationId: string,
    options?: { expand?: PublicationsRequestExpand[] }
  ): Promise<PublicationResponse> {
    const params = new URLSearchParams();

    if (options?.expand) {
      for (const field of options.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const path = `/publications/${publicationId}${query ? `?${query}` : ''}`;
    return this._http.get<PublicationResponse>(path);
  }
}
