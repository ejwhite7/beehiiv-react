/**
 * Subscriptions endpoint for the beehiiv API client.
 * Manages subscriber CRUD operations.
 * @module client/endpoints/subscriptions
 */

import type { BeehiivApiConfig } from '../../types/common.js';
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionInfo,
  SubscriptionListResponse,
  SubscriptionResponse,
} from '../../types/subscription.js';

/** Options for listing subscriptions */
export interface ListSubscriptionsOptions {
  /** Cursor for pagination */
  cursor?: string;
  /** Number of results per page */
  limit?: number;
  /** Filter by email address */
  email?: string;
}

/**
 * Client for the /publications/:pubId/subscriptions endpoints.
 * Handles creating, reading, updating, and deleting subscriptions.
 */
export class SubscriptionsEndpoint {
  private readonly _config: BeehiivApiConfig;

  constructor(config: BeehiivApiConfig) {
    this._config = config;
  }

  /** Create a new subscription */
  async create(_data: CreateSubscriptionRequest): Promise<SubscriptionInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** List subscriptions with optional filtering and pagination */
  async list(_options?: ListSubscriptionsOptions): Promise<SubscriptionListResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Get a subscription by email address */
  async getByEmail(_email: string): Promise<SubscriptionResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Get a subscription by its ID */
  async getById(_id: string): Promise<SubscriptionResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Update a subscription by its ID */
  async updateById(_id: string, _data: UpdateSubscriptionRequest): Promise<SubscriptionInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Update a subscription by email address */
  async updateByEmail(_email: string, _data: UpdateSubscriptionRequest): Promise<SubscriptionInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Delete (unsubscribe) a subscription by ID */
  async delete(_id: string): Promise<void> {
    void this._config;
    throw new Error('Not yet implemented');
  }
}
