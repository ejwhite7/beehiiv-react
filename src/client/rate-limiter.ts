/**
 * Client-side rate limiter for beehiiv API requests.
 * Uses a token-bucket algorithm to stay within API rate limits.
 * @module client/rate-limiter
 */

/** Options for configuring the rate limiter */
export interface RateLimiterOptions {
  /** Maximum number of requests per minute */
  maxRequestsPerMinute: number;
}

/**
 * Rate limiter that throttles outgoing API requests.
 * Ensures the client stays within beehiiv's rate limits (default 180 req/min).
 */
export class RateLimiter {
  private readonly _maxRequestsPerMinute: number;

  constructor(options: RateLimiterOptions) {
    this._maxRequestsPerMinute = options.maxRequestsPerMinute;
  }

  /**
   * Execute a function within the rate limit.
   * Will delay execution if the rate limit would be exceeded.
   * @param fn - The async function to execute
   * @returns The result of the function
   */
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    // TODO: Implement token-bucket rate limiting in Stage 2
    void this._maxRequestsPerMinute;
    return fn();
  }
}
