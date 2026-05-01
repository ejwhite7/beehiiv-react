/**
 * Authors endpoint for the beehiiv API client.
 * Provides methods for listing and retrieving publication authors
 * with page-based (offset) pagination.
 *
 * @module client/endpoints/authors
 */

import type { ListAuthorsResponse, GetAuthorResponse } from '../../types/author.js';
import type { BeehiivHttpClient } from '../index.js';

// ---------------------------------------------------------------------------
// Option interfaces
// ---------------------------------------------------------------------------

/**
 * Options for listing authors with page-based pagination.
 *
 * Passed as the second argument to {@link AuthorsEndpoint.list} when the
 * first argument is a publication ID, or as the sole argument when the
 * default publication ID is configured.
 */
export interface ListAuthorsOptions {
  /** Maximum number of results to return per page */
  limit?: number;

  /** Page number for pagination (1-indexed) */
  page?: number;
}

// ---------------------------------------------------------------------------
// Endpoint class
// ---------------------------------------------------------------------------

/**
 * Client for the `/publications/{publicationId}/authors` endpoints.
 * Handles listing and retrieving publication authors.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const authors = new AuthorsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const list = await authors.list({ limit: 10 });
 * const author = await authors.get('author_123');
 *
 * // Or pass one explicitly to override
 * const list2 = await authors.list('pub_other', { limit: 10 });
 * ```
 */
export class AuthorsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new AuthorsEndpoint instance.
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
   *
   * @param publicationId - An explicitly provided publication ID, if any
   * @returns The resolved publication ID string
   * @throws {Error} If no publication ID is available
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
   * List authors for a publication with page-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/authors` with optional
   * pagination parameters.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or pagination options when using the default publication ID
   * @param options - Optional pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of authors with page metadata
   *
   * @example
   * ```ts
   * // With default publication ID
   * const response = await authors.list({ limit: 20, page: 2 });
   *
   * // With explicit publication ID
   * const response = await authors.list('pub_abc', { limit: 20 });
   * ```
   */
  async list(
    publicationIdOrOptions?: string | ListAuthorsOptions,
    options?: ListAuthorsOptions,
  ): Promise<ListAuthorsResponse> {
    let publicationId: string;
    let listOptions: ListAuthorsOptions | undefined;

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
    const path = `/publications/${publicationId}/authors${query ? `?${query}` : ''}`;
    return this._http.get<ListAuthorsResponse>(path);
  }

  /**
   * Get a single author by their ID.
   *
   * Calls `GET /v2/publications/{publicationId}/authors/{authorId}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the author ID (when using default publication ID)
   * @param id - The author ID (when publicationId is passed explicitly)
   * @returns The author record wrapped in a response envelope
   *
   * @example
   * ```ts
   * // With default publication ID
   * const response = await authors.get('author_123');
   *
   * // With explicit publication ID
   * const response = await authors.get('pub_abc', 'author_123');
   * ```
   */
  async get(
    publicationIdOrId: string,
    id?: string,
  ): Promise<GetAuthorResponse> {
    let publicationId: string;
    let authorId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      authorId = id;
    } else {
      publicationId = this._resolvePublicationId();
      authorId = publicationIdOrId;
    }

    return this._http.get<GetAuthorResponse>(
      `/publications/${publicationId}/authors/${authorId}`,
    );
  }
}
