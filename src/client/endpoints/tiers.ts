/**
 * Tiers endpoint for the beehiiv API client.
 * Manages publication tier operations including listing with cursor-based
 * pagination, fetching by ID, creating new tiers, and updating existing ones.
 * @module client/endpoints/tiers
 */

import type {
  TierType,
  ListTiersResponse,
  GetTierResponse,
  CreateTierRequest,
  CreateTierResponse,
  UpdateTierRequest,
  UpdateTierResponse,
} from '../../types/tier.js';
import type { BeehiivHttpClient } from '../index.js';
import { requireObjectPayload } from './signature-validation.js';

/** Options for listing tiers with cursor-based pagination and optional filters */
export interface ListTiersOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter tiers by type (free or premium) */
  type?: TierType;
  /** Filter tiers by active status */
  active?: boolean;
}

/**
 * Client for the `/publications/{publicationId}/tiers` endpoints.
 * Handles listing, fetching, creating, and updating subscription tiers.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const tiers = new TiersEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const list = await tiers.list({ type: 'premium' });
 * const tier = await tiers.get('tier_123');
 *
 * // Or pass one explicitly to override
 * const list2 = await tiers.list('pub_other', { type: 'free' });
 * ```
 */
export class TiersEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new TiersEndpoint instance.
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
   * @param publicationId - An explicitly provided publication ID, or undefined
   * @returns The resolved publication ID
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
   * List tiers for a publication with cursor-based pagination and optional filters.
   *
   * Calls `GET /v2/publications/{publicationId}/tiers` with optional
   * filtering by type and active status, and pagination via cursor tokens.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or filtering/pagination options when using the default publication ID
   * @param options - Optional filtering and pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of tiers with cursor metadata
   *
   * @example
   * ```ts
   * // Using default publication ID
   * const result = await tiers.list({ type: 'premium', limit: 10 });
   *
   * // With explicit publication ID
   * const result2 = await tiers.list('pub_abc', { active: true });
   * ```
   */
  async list(
    publicationIdOrOptions?: string | ListTiersOptions,
    options?: ListTiersOptions,
  ): Promise<ListTiersResponse> {
    let publicationId: string;
    let listOptions: ListTiersOptions | undefined;

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
    if (listOptions?.cursor) {
      params.set('cursor', listOptions.cursor);
    }
    if (listOptions?.type) {
      params.set('type', listOptions.type);
    }
    if (listOptions?.active !== undefined) {
      params.set('active', String(listOptions.active));
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/tiers${query ? `?${query}` : ''}`;
    return this._http.get<ListTiersResponse>(path);
  }

  /**
   * Get a tier by its unique ID.
   *
   * Calls `GET /v2/publications/{publicationId}/tiers/{tierId}`.
   *
   * @param publicationIdOrTierId - Either the publication ID (when called with 2 args) or the tier ID (when using default publication ID)
   * @param tierId - The tier ID (starts with "tier_") when publicationId is passed explicitly
   * @returns The tier record
   *
   * @example
   * ```ts
   * // Using default publication ID
   * const tier = await tiers.get('tier_123');
   *
   * // With explicit publication ID
   * const tier2 = await tiers.get('pub_abc', 'tier_123');
   * ```
   */
  async get(
    publicationIdOrTierId: string,
    tierId?: string,
  ): Promise<GetTierResponse> {
    let publicationId: string;
    let resolvedTierId: string;

    if (tierId !== undefined) {
      publicationId = publicationIdOrTierId;
      resolvedTierId = tierId;
    } else {
      publicationId = this._resolvePublicationId();
      resolvedTierId = publicationIdOrTierId;
    }

    const path = `/publications/${publicationId}/tiers/${resolvedTierId}`;
    return this._http.get<GetTierResponse>(path);
  }

  /**
   * Create a new tier on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/tiers`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the tier creation data when using the default publication ID
   * @param data - Tier creation data including name, type, and optional pricing (when publicationId is passed explicitly)
   * @returns The newly created tier
   *
   * @example
   * ```ts
   * // Using default publication ID
   * const created = await tiers.create({
   *   name: 'Gold',
   *   type: 'premium',
   *   price_in_cents: 999,
   *   currency: 'USD',
   * });
   *
   * // With explicit publication ID
   * const created2 = await tiers.create('pub_abc', {
   *   name: 'Basic',
   *   type: 'free',
   * });
   * ```
   */
  create(publicationId: string, data: CreateTierRequest): Promise<CreateTierResponse>;
  create(data: CreateTierRequest): Promise<CreateTierResponse>;
  async create(
    publicationIdOrData: string | CreateTierRequest,
    data?: CreateTierRequest,
  ): Promise<CreateTierResponse> {
    let publicationId: string;
    let requestData: CreateTierRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = requireObjectPayload('TiersEndpoint.create', data);
    } else {
      publicationId = this._resolvePublicationId();
      requestData = requireObjectPayload(
        'TiersEndpoint.create',
        publicationIdOrData,
      );
    }

    return this._http.post<CreateTierResponse>(
      `/publications/${publicationId}/tiers`,
      requestData,
    );
  }

  /**
   * Update an existing tier by its unique ID.
   *
   * Calls `PATCH /v2/publications/{publicationId}/tiers/{tierId}`.
   *
   * @param publicationIdOrTierId - Either the publication ID (when called with 3 args) or the tier ID (when using default publication ID)
   * @param tierIdOrData - The tier ID (when publicationId is passed explicitly) or the update data
   * @param data - The fields to update (when publicationId is passed explicitly)
   * @returns The updated tier record
   *
   * @example
   * ```ts
   * // Using default publication ID
   * const updated = await tiers.update('tier_123', { name: 'Platinum' });
   *
   * // With explicit publication ID
   * const updated2 = await tiers.update('pub_abc', 'tier_123', { active: false });
   * ```
   */
  update(publicationId: string, tierId: string, data: UpdateTierRequest): Promise<UpdateTierResponse>;
  update(tierId: string, data: UpdateTierRequest): Promise<UpdateTierResponse>;
  async update(
    publicationIdOrTierId: string,
    tierIdOrData: string | UpdateTierRequest,
    data?: UpdateTierRequest,
  ): Promise<UpdateTierResponse> {
    let publicationId: string;
    let resolvedTierId: string;
    let updateData: UpdateTierRequest;

    if (typeof tierIdOrData === 'string') {
      publicationId = publicationIdOrTierId;
      resolvedTierId = tierIdOrData;
      updateData = requireObjectPayload('TiersEndpoint.update', data);
    } else {
      publicationId = this._resolvePublicationId();
      resolvedTierId = publicationIdOrTierId;
      updateData = requireObjectPayload('TiersEndpoint.update', tierIdOrData);
    }

    return this._http.patch<UpdateTierResponse>(
      `/publications/${publicationId}/tiers/${resolvedTierId}`,
      updateData,
    );
  }
}
