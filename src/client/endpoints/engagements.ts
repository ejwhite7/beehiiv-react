/**
 * Engagements endpoint for the beehiiv API client.
 * Retrieves aggregated email engagement metrics for a publication
 * over a specified date range.
 * @module client/endpoints/engagements
 */

import type { GetEngagementsResponse } from '../../types/engagement.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Parameters for fetching engagement metrics.
 */
export interface GetEngagementsParams {
  /** Start date for the engagement data range (ISO 8601 date string, e.g. "2024-01-01") */
  start_date: string;
  /** End date for the engagement data range (ISO 8601 date string, e.g. "2024-01-31") */
  end_date: string;
  /** Optional fields to expand in the response */
  expand?: string[];
}

/**
 * Client for the `/publications/{publicationId}/engagements` endpoint.
 * Retrieves daily engagement metrics (sends, opens, clicks, etc.) for a
 * publication within a given date range.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), the `get` method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const engagements = new EngagementsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const metrics = await engagements.get({
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-31',
 * });
 *
 * // Or pass one explicitly to override
 * const metrics2 = await engagements.get('pub_other', {
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-31',
 * });
 * ```
 */
export class EngagementsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new EngagementsEndpoint instance.
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
   * Get engagement metrics for a publication within a date range.
   *
   * Calls `GET /v2/publications/{publicationId}/engagements` with required
   * `start_date` and `end_date` query parameters, and optional `expand` fields.
   *
   * @param publicationIdOrParams - Either the publication ID (starts with "pub_") or the query parameters when using the default publication ID
   * @param params - Query parameters including date range and optional expand fields (when publicationId is passed explicitly)
   * @returns Engagement metrics for the requested date range
   */
  async get(
    publicationIdOrParams: string | GetEngagementsParams,
    params?: GetEngagementsParams
  ): Promise<GetEngagementsResponse> {
    let publicationId: string;
    let queryParams: GetEngagementsParams;

    if (typeof publicationIdOrParams === 'string') {
      publicationId = publicationIdOrParams;
      queryParams = params!;
    } else {
      publicationId = this._resolvePublicationId();
      queryParams = publicationIdOrParams;
    }

    const urlParams = new URLSearchParams();
    urlParams.set('start_date', queryParams.start_date);
    urlParams.set('end_date', queryParams.end_date);

    if (queryParams.expand) {
      for (const field of queryParams.expand) {
        urlParams.append('expand[]', field);
      }
    }

    const query = urlParams.toString();
    const path = `/publications/${publicationId}/engagements${query ? `?${query}` : ''}`;
    return this._http.get<GetEngagementsResponse>(path);
  }
}
