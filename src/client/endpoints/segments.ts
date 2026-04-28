/**
 * Segments endpoint for the beehiiv API client.
 * Manages segment operations including listing, retrieval,
 * deletion, recalculation, and member listing for a publication.
 * @module client/endpoints/segments
 */

import type {
  SegmentResponse,
  SegmentListResponse,
  SegmentMembersResponse,
  SegmentRecalculateResponse,
  ListSegmentsOptions,
  ListSegmentMembersOptions,
} from '../../types/segment.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/segments` endpoints.
 * Handles listing, retrieving, deleting, recalculating segments,
 * and listing segment members.
 *
 * @example
 * ```ts
 * const seg = new SegmentsEndpoint(httpClient);
 * const list = await seg.list('pub_abc', { limit: 20 });
 * const members = await seg.listMembers('pub_abc', 'seg_123');
 * ```
 */
export class SegmentsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new SegmentsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * List all segments for a publication with offset-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/segments` with optional
   * filtering by type, status, and pagination parameters.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param options - Optional filtering, sorting, and pagination parameters
   * @returns Paginated list of segments
   */
  async list(
    publicationId: string,
    options?: ListSegmentsOptions
  ): Promise<SegmentListResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.page !== undefined) {
      params.set('page', String(options.page));
    }
    if (options?.type) {
      params.set('type', options.type);
    }
    if (options?.status) {
      params.set('status', options.status);
    }
    if (options?.orderBy) {
      params.set('order_by', options.orderBy);
    }
    if (options?.direction) {
      params.set('direction', options.direction);
    }
    if (options?.expand) {
      for (const field of options.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/segments${query ? `?${query}` : ''}`;
    return this._http.get<SegmentListResponse>(path);
  }

  /**
   * Get a specific segment by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/segments/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The segment ID
   * @returns The segment record
   */
  async get(publicationId: string, id: string): Promise<SegmentResponse> {
    return this._http.get<SegmentResponse>(
      `/publications/${publicationId}/segments/${id}`
    );
  }

  /**
   * Delete a segment by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/segments/{id}`.
   * Deleting a segment does not affect the subscriptions in the segment.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The segment ID to delete
   */
  async delete(publicationId: string, id: string): Promise<void> {
    await this._http.delete(
      `/publications/${publicationId}/segments/${id}`
    );
  }

  /**
   * Recalculate a segment.
   *
   * Calls `PUT /v2/publications/{publicationId}/segments/{id}/recalculate`.
   * Triggers a recalculation of the segment's membership.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The segment ID to recalculate
   * @returns A confirmation message
   */
  async recalculate(
    publicationId: string,
    id: string
  ): Promise<SegmentRecalculateResponse> {
    return this._http.put<SegmentRecalculateResponse>(
      `/publications/${publicationId}/segments/${id}/recalculate`,
      {}
    );
  }

  /**
   * List members of a segment with full subscription data.
   *
   * Calls `GET /v2/publications/{publicationId}/segments/{id}/members`.
   * Returns subscription objects for each member in the segment.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The segment ID
   * @param options - Optional pagination and expand parameters
   * @returns Paginated list of segment members as subscription records
   */
  async listMembers(
    publicationId: string,
    id: string,
    options?: ListSegmentMembersOptions
  ): Promise<SegmentMembersResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.page !== undefined) {
      params.set('page', String(options.page));
    }
    if (options?.expand) {
      for (const field of options.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/segments/${id}/members${query ? `?${query}` : ''}`;
    return this._http.get<SegmentMembersResponse>(path);
  }
}
