/**
 * Segments endpoint for the beehiiv API client.
 * Manages segment operations including listing, retrieval, creation,
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
  CreateSegmentRequest,
} from '../../types/segment.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/segments` endpoints.
 * Handles listing, retrieving, creating, deleting, recalculating segments,
 * and listing segment members.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const seg = new SegmentsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const list = await seg.list({ limit: 20 });
 * const members = await seg.listMembers('seg_123');
 *
 * // Or pass one explicitly to override
 * const list2 = await seg.list('pub_other', { limit: 20 });
 * ```
 */
export class SegmentsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new SegmentsEndpoint instance.
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
   * List all segments for a publication with offset-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/segments` with optional
   * filtering by type, status, and pagination parameters.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or filtering/pagination options when using the default publication ID
   * @param options - Optional filtering, sorting, and pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of segments
   */
  async list(
    publicationIdOrOptions?: string | ListSegmentsOptions,
    options?: ListSegmentsOptions
  ): Promise<SegmentListResponse> {
    let publicationId: string;
    let listOptions: ListSegmentsOptions | undefined;

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
    if (listOptions?.type) {
      params.set('type', listOptions.type);
    }
    if (listOptions?.status) {
      params.set('status', listOptions.status);
    }
    if (listOptions?.orderBy) {
      params.set('order_by', listOptions.orderBy);
    }
    if (listOptions?.direction) {
      params.set('direction', listOptions.direction);
    }
    if (listOptions?.expand) {
      for (const field of listOptions.expand) {
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
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the segment ID (when using default publication ID)
   * @param id - The segment ID (when publicationId is passed explicitly)
   * @returns The segment record
   */
  async get(
    publicationIdOrId: string,
    id?: string
  ): Promise<SegmentResponse> {
    let publicationId: string;
    let segmentId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      segmentId = id;
    } else {
      publicationId = this._resolvePublicationId();
      segmentId = publicationIdOrId;
    }

    return this._http.get<SegmentResponse>(
      `/publications/${publicationId}/segments/${segmentId}`
    );
  }

  /**
   * Create a new segment on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/segments`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the segment data when using the default publication ID
   * @param data - Segment data including name and input definition (when publicationId is passed explicitly)
   * @returns The newly created segment
   */
  async create(
    publicationIdOrData: string | CreateSegmentRequest,
    data?: CreateSegmentRequest
  ): Promise<SegmentResponse> {
    let publicationId: string;
    let requestData: CreateSegmentRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      requestData = publicationIdOrData;
    }

    return this._http.post<SegmentResponse>(
      `/publications/${publicationId}/segments`,
      requestData
    );
  }

  /**
   * Delete a segment by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/segments/{id}`.
   * Deleting a segment does not affect the subscriptions in the segment.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the segment ID (when using default publication ID)
   * @param id - The segment ID to delete (when publicationId is passed explicitly)
   */
  async delete(publicationIdOrId: string, id?: string): Promise<void> {
    let publicationId: string;
    let segmentId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      segmentId = id;
    } else {
      publicationId = this._resolvePublicationId();
      segmentId = publicationIdOrId;
    }

    await this._http.delete(
      `/publications/${publicationId}/segments/${segmentId}`
    );
  }

  /**
   * Recalculate a segment.
   *
   * Calls `PUT /v2/publications/{publicationId}/segments/{id}/recalculate`.
   * Triggers a recalculation of the segment's membership.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the segment ID (when using default publication ID)
   * @param id - The segment ID to recalculate (when publicationId is passed explicitly)
   * @returns A confirmation message
   */
  async recalculate(
    publicationIdOrId: string,
    id?: string
  ): Promise<SegmentRecalculateResponse> {
    let publicationId: string;
    let segmentId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      segmentId = id;
    } else {
      publicationId = this._resolvePublicationId();
      segmentId = publicationIdOrId;
    }

    return this._http.put<SegmentRecalculateResponse>(
      `/publications/${publicationId}/segments/${segmentId}/recalculate`,
      {}
    );
  }

  /**
   * List members of a segment with full subscription data.
   *
   * Calls `GET /v2/publications/{publicationId}/segments/{id}/members`.
   * Returns subscription objects for each member in the segment.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 3 args) or the segment ID (when using default publication ID)
   * @param idOrOptions - The segment ID (when publicationId is passed explicitly) or pagination/expand options
   * @param options - Optional pagination and expand parameters (when publicationId is passed explicitly)
   * @returns Paginated list of segment members as subscription records
   */
  async listMembers(
    publicationIdOrId: string,
    idOrOptions?: string | ListSegmentMembersOptions,
    options?: ListSegmentMembersOptions
  ): Promise<SegmentMembersResponse> {
    let publicationId: string;
    let segmentId: string;
    let memberOptions: ListSegmentMembersOptions | undefined;

    if (typeof idOrOptions === 'string') {
      publicationId = publicationIdOrId;
      segmentId = idOrOptions;
      memberOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      segmentId = publicationIdOrId;
      memberOptions = idOrOptions;
    }

    const params = new URLSearchParams();

    if (memberOptions?.limit !== undefined) {
      params.set('limit', String(memberOptions.limit));
    }
    if (memberOptions?.page !== undefined) {
      params.set('page', String(memberOptions.page));
    }
    if (memberOptions?.expand) {
      for (const field of memberOptions.expand) {
        params.append('expand[]', field);
      }
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/segments/${segmentId}/members${query ? `?${query}` : ''}`;
    return this._http.get<SegmentMembersResponse>(path);
  }
}
