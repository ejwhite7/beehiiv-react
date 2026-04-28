/**
 * Posts endpoint for the beehiiv API client.
 * Manages newsletter post CRUD operations including listing with
 * cursor-based pagination, creation, updates, and deletion.
 * @module client/endpoints/posts
 */

import type {
  PostStatus,
  PostAudience,
  PostListResponse,
  PostResponse,
  CreatePostRequest,
  UpdatePostRequest,
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

/**
 * Client for the `/publications/{publicationId}/posts` endpoints.
 * Handles creating, reading, updating, and deleting newsletter posts.
 *
 * @example
 * ```ts
 * const posts = new PostsEndpoint(httpClient);
 * const list = await posts.list('pub_abc', { status: 'confirmed' });
 * const post = await posts.get('pub_abc', 'post_123');
 * ```
 */
export class PostsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new PostsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * List posts for a publication with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/posts` with optional
   * filtering by status, audience, and cursor-based pagination.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param options - Optional filtering and pagination parameters
   * @returns Paginated list of posts with cursor metadata
   */
  async list(
    publicationId: string,
    options?: ListPostsOptions
  ): Promise<PostListResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.status) {
      params.set('status', options.status);
    }
    if (options?.audience) {
      params.set('audience', options.audience);
    }
    if (options?.orderBy) {
      params.set('order_by', options.orderBy);
    }
    if (options?.direction) {
      params.set('direction', options.direction);
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
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The post ID (starts with "post_")
   * @returns The post record
   */
  async get(publicationId: string, id: string): Promise<PostResponse> {
    return this._http.get<PostResponse>(
      `/publications/${publicationId}/posts/${id}`
    );
  }

  /**
   * Create a new post on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/posts`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param data - The post data to create
   * @returns The newly created post
   */
  async create(
    publicationId: string,
    data: CreatePostRequest
  ): Promise<PostResponse> {
    return this._http.post<PostResponse>(
      `/publications/${publicationId}/posts`,
      data
    );
  }

  /**
   * Update an existing post.
   *
   * Calls `PATCH /v2/publications/{publicationId}/posts/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The post ID to update (starts with "post_")
   * @param data - The fields to update
   * @returns The updated post record
   */
  async update(
    publicationId: string,
    id: string,
    data: UpdatePostRequest
  ): Promise<PostResponse> {
    return this._http.patch<PostResponse>(
      `/publications/${publicationId}/posts/${id}`,
      data
    );
  }

  /**
   * Delete a post by its ID.
   *
   * Calls `DELETE /v2/publications/{publicationId}/posts/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The post ID to delete (starts with "post_")
   */
  async delete(publicationId: string, id: string): Promise<void> {
    await this._http.delete(
      `/publications/${publicationId}/posts/${id}`
    );
  }
}
