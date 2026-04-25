/**
 * BeehiivClient - the main API client for interacting with beehiiv.
 * All API calls are server-side only (requires API key).
 * @module client
 */

import type { BeehiivApiConfig } from '../types/common.js';
import { RateLimiter } from './rate-limiter.js';
import { SubscriptionsEndpoint } from './endpoints/subscriptions.js';
import { CustomFieldsEndpoint } from './endpoints/custom-fields.js';
import { PublicationsEndpoint } from './endpoints/publications.js';
import { PostsEndpoint } from './endpoints/posts.js';

/**
 * The main beehiiv API client.
 *
 * @example
 * ```ts
 * const client = new BeehiivClient({
 *   apiKey: process.env.BEEHIIV_API_KEY!,
 *   publicationId: 'pub_xxxxx',
 * });
 *
 * const sub = await client.subscriptions.create({ email: 'user@example.com' });
 * ```
 */
export class BeehiivClient {
  /** Subscription management endpoints */
  public readonly subscriptions: SubscriptionsEndpoint;
  /** Custom field management endpoints */
  public readonly customFields: CustomFieldsEndpoint;
  /** Publication information endpoints */
  public readonly publications: PublicationsEndpoint;
  /** Post management endpoints */
  public readonly posts: PostsEndpoint;

  private readonly _config: BeehiivApiConfig;
  private readonly _rateLimiter: RateLimiter;

  constructor(config: BeehiivApiConfig) {
    this._config = {
      baseUrl: 'https://api.beehiiv.com/v2',
      timeout: 30_000,
      rateLimitPerMinute: 180,
      ...config,
    };

    this._rateLimiter = new RateLimiter({
      maxRequestsPerMinute: this._config.rateLimitPerMinute ?? 180,
    });

    this.subscriptions = new SubscriptionsEndpoint(this._config);
    this.customFields = new CustomFieldsEndpoint(this._config);
    this.publications = new PublicationsEndpoint(this._config);
    this.posts = new PostsEndpoint(this._config);

    // Ensure _rateLimiter is referenced to avoid unused warning
    void this._rateLimiter;
  }
}
