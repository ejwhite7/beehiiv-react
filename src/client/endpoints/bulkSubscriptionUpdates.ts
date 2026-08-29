/**
 * Bulk subscription updates endpoint for the beehiiv API client.
 * Manages listing and retrieving bulk update jobs, as well as
 * performing bulk field and status updates on subscriptions.
 * @module client/endpoints/bulkSubscriptionUpdates
 */

import type {
  ListBulkUpdateJobsResponse,
  GetBulkUpdateJobResponse,
  BulkUpdateFieldsRequest,
  BulkUpdateFieldsResponse,
  BulkUpdateStatusRequest,
} from '../../types/bulk-subscriptions.js';
import type { BeehiivHttpClient } from '../index.js';
import { requireObjectPayload } from './signature-validation.js';

/** Options for listing bulk subscription update jobs */
export interface ListBulkUpdateJobsOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Page number for paginated results */
  page?: number;
}

/**
 * Client for the bulk subscription update endpoints.
 * Provides methods to list and retrieve asynchronous bulk update jobs,
 * as well as bulk update subscription fields and statuses.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const updates = new BulkSubscriptionUpdatesEndpoint(httpClient, 'pub_abc');
 *
 * // List all bulk update jobs
 * const jobs = await updates.list();
 *
 * // Get a specific job
 * const job = await updates.get('job_123');
 *
 * // Bulk update fields
 * await updates.bulkUpdateFields({
 *   subscriptions: [
 *     { subscription_id: 'sub_1', tier: 'premium' },
 *     { subscription_id: 'sub_2', custom_fields: [{ name: 'Plan', value: 'pro' }] },
 *   ],
 * });
 *
 * // Bulk update status (resolves with no value — the API returns 204)
 * await updates.bulkUpdateStatus({
 *   subscription_ids: ['sub_1', 'sub_2'],
 *   new_status: 'active',
 * });
 * ```
 */
export class BulkSubscriptionUpdatesEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new BulkSubscriptionUpdatesEndpoint instance.
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
   * List bulk subscription update jobs for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/bulk_subscription_updates`
   * with optional pagination parameters.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or listing options when using the default publication ID
   * @param options - Optional pagination parameters (when publicationId is passed explicitly)
   * @returns A list of bulk update job records
   */
  async list(
    publicationIdOrOptions?: string | ListBulkUpdateJobsOptions,
    options?: ListBulkUpdateJobsOptions
  ): Promise<ListBulkUpdateJobsResponse> {
    let publicationId: string;
    let listOptions: ListBulkUpdateJobsOptions | undefined;

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
    const path = `/publications/${publicationId}/bulk_subscription_updates${query ? `?${query}` : ''}`;
    return this._http.get<ListBulkUpdateJobsResponse>(path);
  }

  /**
   * Get a single bulk subscription update job by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/bulk_subscription_updates/{id}`.
   *
   * @param publicationIdOrJobId - Either the publication ID (when called with 2 args) or the job ID (when using default publication ID)
   * @param jobId - The bulk update job ID (when publicationId is passed explicitly)
   * @returns The bulk update job record
   */
  async get(
    publicationIdOrJobId: string,
    jobId?: string
  ): Promise<GetBulkUpdateJobResponse> {
    let publicationId: string;
    let resolvedJobId: string;

    if (jobId !== undefined) {
      publicationId = publicationIdOrJobId;
      resolvedJobId = jobId;
    } else {
      publicationId = this._resolvePublicationId();
      resolvedJobId = publicationIdOrJobId;
    }

    return this._http.get<GetBulkUpdateJobResponse>(
      `/publications/${publicationId}/bulk_subscription_updates/${resolvedJobId}`
    );
  }

  /**
   * Bulk update custom fields on multiple subscriptions.
   *
   * Calls `PUT /v2/publications/{publicationId}/subscriptions/bulk_actions`.
   *
   * @param publicationIdOrBody - Either the publication ID (starts with "pub_") or the bulk update request body when using the default publication ID
   * @param body - The bulk update fields request body (when publicationId is passed explicitly)
   * @returns A response containing the subscription update job reference
   */
  bulkUpdateFields(publicationId: string, body: BulkUpdateFieldsRequest): Promise<BulkUpdateFieldsResponse>;
  bulkUpdateFields(body: BulkUpdateFieldsRequest): Promise<BulkUpdateFieldsResponse>;
  async bulkUpdateFields(
    publicationIdOrBody: string | BulkUpdateFieldsRequest,
    body?: BulkUpdateFieldsRequest
  ): Promise<BulkUpdateFieldsResponse> {
    let publicationId: string;
    let requestBody: BulkUpdateFieldsRequest;

    if (typeof publicationIdOrBody === 'string') {
      publicationId = publicationIdOrBody;
      requestBody = requireObjectPayload(
        'BulkSubscriptionUpdatesEndpoint.bulkUpdateFields',
        body,
      );
    } else {
      publicationId = this._resolvePublicationId();
      requestBody = requireObjectPayload(
        'BulkSubscriptionUpdatesEndpoint.bulkUpdateFields',
        publicationIdOrBody,
      );
    }

    return this._http.put<BulkUpdateFieldsResponse>(
      `/publications/${publicationId}/subscriptions/bulk_actions`,
      requestBody
    );
  }

  /**
   * Bulk update the status of multiple subscriptions.
   *
   * Calls `PUT /v2/publications/{publicationId}/subscriptions`.
   *
   * @param publicationIdOrBody - Either the publication ID (starts with "pub_") or the bulk status update request body when using the default publication ID
   * @param body - The bulk update status request body (when publicationId is passed explicitly)
   * @returns A promise that resolves with no value — the API returns 204 No Content
   */
  bulkUpdateStatus(publicationId: string, body: BulkUpdateStatusRequest): Promise<void>;
  bulkUpdateStatus(body: BulkUpdateStatusRequest): Promise<void>;
  async bulkUpdateStatus(
    publicationIdOrBody: string | BulkUpdateStatusRequest,
    body?: BulkUpdateStatusRequest
  ): Promise<void> {
    let publicationId: string;
    let requestBody: BulkUpdateStatusRequest;

    if (typeof publicationIdOrBody === 'string') {
      publicationId = publicationIdOrBody;
      requestBody = requireObjectPayload(
        'BulkSubscriptionUpdatesEndpoint.bulkUpdateStatus',
        body,
      );
    } else {
      publicationId = this._resolvePublicationId();
      requestBody = requireObjectPayload(
        'BulkSubscriptionUpdatesEndpoint.bulkUpdateStatus',
        publicationIdOrBody,
      );
    }

    await this._http.put<void>(
      `/publications/${publicationId}/subscriptions`,
      requestBody
    );
  }
}
