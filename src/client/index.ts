/**
 * BeehiivClient - the main API client for interacting with beehiiv.
 * All API calls are server-side only (requires API key).
 *
 * This module defines the core HTTP client interface, the API error class,
 * and the main BeehiivClient class that orchestrates rate-limited requests
 * across all endpoint namespaces.
 * @module client
 */

import type { BeehiivApiConfig, BeehiivErrorDetail } from '../types/common.js';
import { RateLimiter } from './rate-limiter.js';
import { SubscriptionsEndpoint } from './endpoints/subscriptions.js';
import { CustomFieldsEndpoint } from './endpoints/custom-fields.js';
import { PublicationsEndpoint } from './endpoints/publications.js';
import { PostsEndpoint } from './endpoints/posts.js';
import { WebhooksEndpoint } from './endpoints/webhooks.js';
import { SegmentsEndpoint } from './endpoints/segments.js';
import { AutomationsEndpoint } from './endpoints/automations.js';
import { ReferralsEndpoint } from './endpoints/referrals.js';
import { AutomationJourneysEndpoint } from './endpoints/automation-journeys.js';

/**
 * Internal HTTP client interface used by endpoint classes to make API requests.
 * Each method prepends the base URL, sets auth headers, handles timeouts,
 * and routes through the rate limiter.
 */
export interface BeehiivHttpClient {
  /**
   * Perform a GET request.
   *
   * @typeParam T - The expected response body type
   * @param path - API path relative to the base URL (e.g. "/publications")
   * @returns The parsed JSON response body
   */
  get<T>(path: string): Promise<T>;

  /**
   * Perform a POST request with a JSON body.
   *
   * @typeParam T - The expected response body type
   * @param path - API path relative to the base URL
   * @param body - The request body to serialize as JSON
   * @returns The parsed JSON response body
   */
  post<T>(path: string, body: unknown): Promise<T>;

  /**
   * Perform a PUT request with a JSON body.
   *
   * @typeParam T - The expected response body type
   * @param path - API path relative to the base URL
   * @param body - The request body to serialize as JSON
   * @returns The parsed JSON response body
   */
  put<T>(path: string, body: unknown): Promise<T>;

  /**
   * Perform a PATCH request with a JSON body.
   *
   * @typeParam T - The expected response body type
   * @param path - API path relative to the base URL
   * @param body - The request body to serialize as JSON
   * @returns The parsed JSON response body
   */
  patch<T>(path: string, body: unknown): Promise<T>;

  /**
   * Perform a DELETE request.
   *
   * @param path - API path relative to the base URL
   */
  delete(path: string): Promise<void>;
}

/**
 * Custom error class for beehiiv API errors.
 *
 * Thrown when the API returns a non-2xx HTTP status code. Contains the
 * HTTP status, a human-readable message, and optional granular error details.
 */
export class BeehiivApiError extends Error {
  /** HTTP status code returned by the API */
  public readonly status: number;

  /** Granular error details, if provided by the API */
  public readonly errors?: BeehiivErrorDetail[];

  /**
   * Creates a new BeehiivApiError.
   *
   * @param status - The HTTP status code
   * @param message - A human-readable error message
   * @param errors - Optional array of detailed error objects
   */
  constructor(status: number, message: string, errors?: BeehiivErrorDetail[]) {
    super(message);
    this.name = 'BeehiivApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * The main beehiiv API client.
 *
 * Creates rate-limited, authenticated HTTP connections to the beehiiv API v2.
 * Provides typed endpoint namespaces for subscriptions, publications,
 * custom fields, posts, automations, and referrals.
 *
 * When a `publicationId` is provided in the config, endpoint methods that
 * require a publication ID can be called without explicitly passing it --
 * the configured default will be used automatically.
 *
 * @example
 * ```ts
 * const client = new BeehiivClient({
 *   apiKey: process.env.BEEHIIV_API_KEY!,
 *   publicationId: 'pub_xxxxx',
 * });
 *
 * // publicationId is auto-injected from config
 * const subs = await client.subscriptions.list();
 *
 * // Or pass explicitly to override
 * const subs2 = await client.subscriptions.list('pub_other');
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
  /** Webhook management endpoints */
  public readonly webhooks: WebhooksEndpoint;
  /** Segment management endpoints */
  public readonly segments: SegmentsEndpoint;
  /** Automation workflow management endpoints */
  public readonly automations: AutomationsEndpoint;
  /** Referral program management endpoints */
  public readonly referrals: ReferralsEndpoint;
  /** Automation journey management endpoints */
  public readonly automationJourneys: AutomationJourneysEndpoint;

  /** Resolved configuration with defaults applied */
  private readonly _config: Required<
    Pick<BeehiivApiConfig, 'apiKey' | 'baseUrl' | 'timeout' | 'rateLimitPerMinute'>
  > &
    Pick<BeehiivApiConfig, 'publicationId'>;

  /** Rate limiter instance shared across all requests */
  private readonly _rateLimiter: RateLimiter;

  /**
   * Creates a new BeehiivClient instance.
   *
   * @param config - Client configuration including API key and optional defaults
   */
  constructor(config: BeehiivApiConfig) {
    this._config = {
      baseUrl: 'https://api.beehiiv.com/v2',
      timeout: 30_000,
      rateLimitPerMinute: 180,
      ...config,
    };

    // Create the rate limiter with the configured requests-per-minute cap
    this._rateLimiter = new RateLimiter({
      requestsPerMinute: this._config.rateLimitPerMinute,
    });

    // Build the internal HTTP client that all endpoints share
    const httpClient = this._createHttpClient();

    // Initialize endpoint namespaces, passing the default publication ID
    // so that methods can be called without explicitly providing it.
    this.subscriptions = new SubscriptionsEndpoint(httpClient, this._config.publicationId);
    this.customFields = new CustomFieldsEndpoint(httpClient, this._config.publicationId);
    this.publications = new PublicationsEndpoint(httpClient);
    this.posts = new PostsEndpoint(httpClient, this._config.publicationId);
    this.webhooks = new WebhooksEndpoint(httpClient, this._config.publicationId);
    this.segments = new SegmentsEndpoint(httpClient, this._config.publicationId);
    this.automations = new AutomationsEndpoint(httpClient, this._config.publicationId);
    this.referrals = new ReferralsEndpoint(httpClient, this._config.publicationId);
    this.automationJourneys = new AutomationJourneysEndpoint(httpClient, this._config.publicationId);
  }

  /**
   * Create the internal HTTP client implementation.
   *
   * The returned client prepends the base URL, sets auth and content-type
   * headers, enforces request timeouts via AbortController, routes all
   * requests through the rate limiter, and throws BeehiivApiError on
   * non-2xx responses.
   *
   * @returns A BeehiivHttpClient implementation
   */
  private _createHttpClient(): BeehiivHttpClient {
    const config = this._config;
    const rateLimiter = this._rateLimiter;

    /**
     * Core request function used by all HTTP methods.
     * Handles URL construction, headers, timeout, rate limiting, and error parsing.
     */
    const request = async <T>(
      method: string,
      path: string,
      body?: unknown
    ): Promise<T> => {
      return rateLimiter.throttle(async () => {
        // Build the full URL from the base URL and the relative path
        const url = `${config.baseUrl}${path}`;

        // Set up request timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        try {
          // Build request headers
          const headers: Record<string, string> = {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          };

          // Build fetch options
          const fetchOptions: RequestInit = {
            method,
            headers,
            signal: controller.signal,
          };

          // Attach body for methods that support it
          if (body !== undefined) {
            fetchOptions.body = JSON.stringify(body);
          }

          // Execute the fetch request
          const response = await fetch(url, fetchOptions);

          // Handle non-2xx responses by parsing the error body
          if (!response.ok) {
            let errorMessage = `beehiiv API error: ${response.status} ${response.statusText}`;
            let errorDetails: BeehiivErrorDetail[] | undefined;

            try {
              const errorBody = (await response.json()) as {
                message?: string;
                errors?: BeehiivErrorDetail[];
              };
              if (errorBody.message) {
                errorMessage = errorBody.message;
              }
              if (errorBody.errors) {
                errorDetails = errorBody.errors;
              }
            } catch {
              // If the error body can't be parsed as JSON, use the default message
            }

            throw new BeehiivApiError(response.status, errorMessage, errorDetails);
          }

          // For DELETE requests that return 204 No Content, return void
          if (response.status === 204 || response.headers.get('content-length') === '0') {
            return undefined as T;
          }

          // Parse and return the JSON response body
          return (await response.json()) as T;
        } finally {
          // Always clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);
        }
      });
    };

    return {
      get: <T>(path: string) => request<T>('GET', path),
      post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
      put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
      patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
      delete: (path: string) => request<void>('DELETE', path),
    };
  }
}
