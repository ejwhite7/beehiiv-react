/**
 * Posts endpoint for the beehiiv API client.
 * Manages newsletter post CRUD operations.
 * @module client/endpoints/posts
 */

import type { BeehiivApiConfig } from '../../types/common.js';
import type {
  PostInfo,
  PostListResponse,
  PostResponse,
  CreatePostRequest,
  UpdatePostRequest,
} from '../../types/post.js';

/** Options for listing posts */
export interface ListPostsOptions {
  /** Cursor for pagination */
  cursor?: string;
  /** Number of results per page */
  limit?: number;
  /** Filter by post status */
  status?: string;
}

/**
 * Client for the /publications/:pubId/posts endpoints.
 * Handles creating, reading, updating, and deleting posts.
 */
export class PostsEndpoint {
  private readonly _config: BeehiivApiConfig;

  constructor(config: BeehiivApiConfig) {
    this._config = config;
  }

  /** List posts with optional filtering and pagination */
  async list(_options?: ListPostsOptions): Promise<PostListResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Get a single post by ID */
  async get(_id: string): Promise<PostResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Create a new post */
  async create(_data: CreatePostRequest): Promise<PostInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Update an existing post */
  async update(_id: string, _data: UpdatePostRequest): Promise<PostInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Delete a post by ID */
  async delete(_id: string): Promise<void> {
    void this._config;
    throw new Error('Not yet implemented');
  }
}
