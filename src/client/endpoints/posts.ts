/**
 * Posts endpoint for the beehiiv API client.
 * Manages newsletter post CRUD operations including listing with
 * cursor-based pagination, creation, updates, deletion, and aggregate stats.
 * @module client/endpoints/posts
 */

import type {
  PostStatus,
  PostAudience,
  PostListResponse,
  PostResponse,
  CreatePostRequest,
  UpdatePostRequest,
  PostAggregateStatsResponse,
} from '../../types/post.js';
import type { BeehiivHttpClient } from '../index.js';

/** Options for listing posts with cursor-based pagination */
export interface ListPostsOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter posts by their publication status */
  status?: PostStatus;
  /** Filter posts by their intended audience */
  audience?: PostAudience;
  /** Field to order results by */
  orderBy?: 'publish_date' | 'created_at';
  /** Sort direction for the ordered results */
  direction?: 'asc' | 'desc';
}

/** Options for querying aggregate post statistics */
export interface AggregateStatsOptions {
  /** Filter by post status */
  status?: PostStatus;
  /** Filter by post audience */
  audience?: PostAudience;
}

/**
 * Client for the `/publications/{publicationId}/posts` endpoints.
 * Handles creating, reading, updating, deleting newsletter posts, and
 * fetching aggregate statistics.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const posts = new PostsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const list = await posts.list({ status: 'confirmed' });
 * const post = await posts.get('post_123');
 *
 * // Or pass one explicitly to override
 * const list2 = await posts.list('pub_other', { status: 'confirmed' });
 * ```
 */
export class PostsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new PostsEndpoint instance.
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
   * List posts for a publication with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/posts` with optional
   * filtering by status, audience, and cursor-based pagination.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or filtering/pagination options when using the default publication ID
   * @param options - Optional filtering and pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of posts with cursor metadata
   */
  async list(
    publicationIdOrOptions?: string | ListPostsOptions,
    options?: ListPostsOptions
  ): Promise<PostListResponse> {
    let publicationId: string;
    let listOptions: ListPostsOptions | undefined;

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
    if (listOptions?.status) {
      params.set('status', listOptions.status);
    }
    if (listOptions?.audience) {
      params.set('audience', listOptions.audience);
    }
    if (listOptions?.orderBy) {
      params.set('order_by', listOptions.orderBy);
    }
    if (listOptions?.direction) {
      params.set('direction', listOptions.direction);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/posts${query ? `?${query}` : ''}`;
    return this._http.get<PostListResponse>(path);
  }

  /**
   * Get a single post by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/posts/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the post ID (when using default publication ID)
   * @param id - The post ID (starts with "post_") when publicationId is passed explicitly
   * @returns The post record
   */
  async get(publicationIdOrId: string, id?: string): Promise<PostResponse> {
    let publicationId: string;
    let postId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      postId = id;
    } else {
      publicationId = this._resolvePublicationId();
      postId = publicationIdOrId;
    }

    return this._http.get<PostResponse>(
      `/publications/${publicationId}/posts/${postId}`
    );
  }

  /**
   * Create a new post on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/posts`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the post data when using the default publication ID
   * @param data - The post data to create (when publicationId is passed explicitly)
   * @returns The newly created post
   */
  async create(
    publicationIdOrData: string | CreatePostRequest,
    data?: CreatePostRequest
  ): Promise<PostResponse> {
    let publicationId: string;
    let requestData: CreatePostRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      requestData = publicationIdOrData;
    }

    return this._http.post<PostResponse>(
      `/publications/${publicationId}/posts`,
      requestData
    );
  }

  /**
   * Update an existing post.
   *
   * Calls `PATCH /v2/publications/{publicationId}/posts/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 3 args) or the post ID (when using default publication ID)
   * @param idOrData - The post ID (when publicationId is passed explicitly) or the update data
   * @param data - The fields to update (when publicationId is passed explicitly)
   * @returns The updated post record
   */
  async update(
    publicationIdOrId: string,
    idOrData: string | UpdatePostRequest,
    data?: UpdatePostRequest
  ): Promise<PostResponse> {
    let publicationId: string;
    let postId: string;
    let updateData: UpdatePostRequest;

    if (typeof idOrData === 'string') {
      publicationId = publicationIdOrId;
      postId = idOrData;
      updateData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      postId = publicationIdOrId;
      updateData = idOrData;
    }

    return this._http.patch<PostResponse>(
      `/publications/${publicationId}/posts/${postId}`,
      updateData
    );
  }

  /**
   * Delete a post by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/posts/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the post ID (when using default publication ID)
   * @param id - The post ID to delete (starts with "post_") when publicationId is passed explicitly
   */
  async delete(publicationIdOrId: string, id?: string): Promise<void> {
    let publicationId: string;
    let postId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      postId = id;
    } else {
      publicationId = this._resolvePublicationId();
      postId = publicationIdOrId;
    }

    await this._http.delete(
      `/publications/${publicationId}/posts/${postId}`
    );
  }

  /**
   * Get aggregate statistics for posts on a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/posts/aggregate_stats`
   * with optional filtering by status and audience.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or filtering options when using the default publication ID
   * @param options - Optional filtering parameters (when publicationId is passed explicitly)
   * @returns Aggregate post statistics
   */
  async aggregateStats(
    publicationIdOrOptions?: string | AggregateStatsOptions,
    options?: AggregateStatsOptions
  ): Promise<PostAggregateStatsResponse> {
    let publicationId: string;
    let statsOptions: AggregateStatsOptions | undefined;

    if (typeof publicationIdOrOptions === 'string') {
      publicationId = publicationIdOrOptions;
      statsOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      statsOptions = publicationIdOrOptions;
    }

    const params = new URLSearchParams();

    if (statsOptions?.status) {
      params.set('status', statsOptions.status);
    }
    if (statsOptions?.audience) {
      params.set('audience', statsOptions.audience);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/posts/aggregate_stats${query ? `?${query}` : ''}`;
    return this._http.get<PostAggregateStatsResponse>(path);
  }
}
