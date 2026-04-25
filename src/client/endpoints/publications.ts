/**
 * Publications endpoint for the beehiiv API client.
 * Retrieves publication information and statistics.
 * @module client/endpoints/publications
 */

import type { BeehiivApiConfig } from '../../types/common.js';
import type {
  PublicationsListResponse,
  PublicationResponse,
  PublicationsRequestExpand,
} from '../../types/publication.js';

/** Options for listing publications */
export interface ListPublicationsOptions {
  /** Fields to expand (e.g. "stats") */
  expand?: PublicationsRequestExpand[];
}

/**
 * Client for the /publications endpoints.
 * Handles reading publication data and stats.
 */
export class PublicationsEndpoint {
  private readonly _config: BeehiivApiConfig;

  constructor(config: BeehiivApiConfig) {
    this._config = config;
  }

  /** List all publications accessible with the current API key */
  async list(_options?: ListPublicationsOptions): Promise<PublicationsListResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Get a single publication by ID */
  async get(_id?: string): Promise<PublicationResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }
}
