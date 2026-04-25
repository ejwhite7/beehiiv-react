/**
 * Client-side rate limiter for beehiiv API requests.
 * Uses a rolling-window algorithm with a request queue to stay within API rate limits.
 * Enforces both per-minute request caps and concurrent request limits.
 * @module client/rate-limiter
 */

/** A queued request waiting to be dispatched */
interface QueuedRequest<T> {
  /** The async function to execute when this request is dispatched */
  fn: () => Promise<T>;
  /** Resolve callback for the outer Promise returned by throttle() */
  resolve: (value: T) => void;
  /** Reject callback for the outer Promise returned by throttle() */
  reject: (reason: unknown) => void;
}

/**
 * Rate limiter that throttles outgoing API requests using a rolling window.
 *
 * Ensures the client stays within beehiiv's rate limits (default 180 req/min)
 * by tracking request timestamps over a 60-second sliding window and limiting
 * the number of concurrent in-flight requests.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ requestsPerMinute: 180, maxConcurrent: 5 });
 * const result = await limiter.throttle(() => fetch('/api/data'));
 * ```
 */
export class RateLimiter {
  /** Maximum number of requests allowed within the rolling 60-second window */
  private readonly _requestsPerMinute: number;

  /** Maximum number of requests that can be in-flight simultaneously */
  private readonly _maxConcurrent: number;

  /** Minimum time (ms) between dispatching consecutive requests */
  private readonly _minSpacing: number;

  /**
   * Timestamps (ms) of requests dispatched within the current rolling window.
   * Entries older than 60 seconds are pruned before each dispatch decision.
   */
  private readonly _timestamps: number[] = [];

  /**
   * FIFO queue of requests waiting to be dispatched.
   * Requests are enqueued when the rate limit or concurrency limit would be exceeded.
   */
  private readonly _queue: QueuedRequest<unknown>[] = [];

  /** Current number of in-flight (started but not yet resolved) requests */
  private _inFlight = 0;

  /** Timestamp (ms) of the most recently dispatched request */
  private _lastDispatchTime = 0;

  /** Handle for the scheduled drain timer, if one is pending */
  private _drainTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Creates a new RateLimiter instance.
   *
   * @param options - Configuration options
   * @param options.requestsPerMinute - Maximum requests allowed per 60-second rolling window
   * @param options.maxConcurrent - Maximum concurrent in-flight requests (default: 5)
   */
  constructor(options: { requestsPerMinute: number; maxConcurrent?: number }) {
    this._requestsPerMinute = options.requestsPerMinute;
    this._maxConcurrent = options.maxConcurrent ?? 5;

    // Calculate minimum spacing between dispatched requests to spread load evenly.
    // E.g., 180 req/min -> Math.ceil(60000 / 180) = 334ms between requests.
    this._minSpacing = Math.ceil(60000 / this._requestsPerMinute);
  }

  /**
   * Execute an async function within the rate limit.
   *
   * If the rate limit or concurrency cap would be exceeded, the request is queued
   * and executed once capacity becomes available. The returned Promise resolves or
   * rejects with the same value as the underlying function.
   *
   * @typeParam T - The return type of the async function
   * @param fn - The async function to execute under rate limiting
   * @returns A Promise that resolves/rejects with the result of `fn`
   */
  throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Enqueue the request. All requests go through the queue for fair ordering.
      this._queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      // Attempt to drain the queue immediately — if capacity allows, the request
      // will be dispatched right away without waiting.
      this._drain();
    });
  }

  /**
   * Prune timestamps older than 60 seconds from the rolling window.
   * This keeps the _timestamps array from growing indefinitely and ensures
   * accurate rate-limit calculations.
   */
  private _pruneTimestamps(): void {
    const cutoff = Date.now() - 60000;
    // Remove all timestamps that fall outside the 60-second window.
    // Since timestamps are in chronological order, we remove from the front.
    while (this._timestamps.length > 0 && this._timestamps[0] <= cutoff) {
      this._timestamps.shift();
    }
  }

  /**
   * Attempt to dispatch queued requests, respecting rate and concurrency limits.
   *
   * This method is the core scheduling loop. It:
   * 1. Prunes stale timestamps from the rolling window
   * 2. Checks if we can dispatch (under rate limit AND under concurrency cap)
   * 3. Enforces minimum spacing between dispatches
   * 4. Dispatches the next request or schedules a retry timer
   */
  private _drain(): void {
    // Clear any pending drain timer — we're running now
    if (this._drainTimer !== null) {
      clearTimeout(this._drainTimer);
      this._drainTimer = null;
    }

    // Process as many queued requests as capacity allows
    while (this._queue.length > 0) {
      // Prune expired timestamps to get an accurate count for the rolling window
      this._pruneTimestamps();

      // Check concurrency limit: don't exceed maxConcurrent in-flight requests
      if (this._inFlight >= this._maxConcurrent) {
        // Can't dispatch now — a completion callback will re-trigger _drain()
        break;
      }

      // Check rate limit: don't exceed requestsPerMinute within the rolling window
      if (this._timestamps.length >= this._requestsPerMinute) {
        // We've hit the rate limit. Schedule a retry when the oldest timestamp
        // expires from the rolling window (falls outside the 60-second window).
        const oldestTimestamp = this._timestamps[0];
        const waitUntilExpiry = oldestTimestamp + 60000 - Date.now();
        const delay = Math.max(1, waitUntilExpiry);
        this._scheduleDrain(delay);
        break;
      }

      // Enforce minimum spacing between consecutive dispatches.
      // This smooths out request bursts to avoid hitting the API in spikes.
      const now = Date.now();
      const elapsed = now - this._lastDispatchTime;
      if (elapsed < this._minSpacing && this._lastDispatchTime > 0) {
        // Wait for the remaining spacing interval before dispatching
        const delay = this._minSpacing - elapsed;
        this._scheduleDrain(delay);
        break;
      }

      // All checks passed — dispatch the next request from the queue
      const request = this._queue.shift()!;
      this._dispatch(request);
    }
  }

  /**
   * Schedule a future _drain() call after `delayMs` milliseconds.
   * Only one drain timer can be active at a time.
   *
   * @param delayMs - Milliseconds to wait before draining
   */
  private _scheduleDrain(delayMs: number): void {
    if (this._drainTimer === null) {
      this._drainTimer = setTimeout(() => {
        this._drainTimer = null;
        this._drain();
      }, delayMs);
    }
  }

  /**
   * Dispatch a single queued request.
   *
   * Records the timestamp, increments the in-flight counter, executes the function,
   * and then decrements the counter and re-triggers drain on completion.
   *
   * @param request - The queued request to execute
   */
  private _dispatch(request: QueuedRequest<unknown>): void {
    const now = Date.now();

    // Record this dispatch in the rolling window
    this._timestamps.push(now);
    this._lastDispatchTime = now;
    this._inFlight++;

    // Execute the wrapped function and pipe the result to the caller's Promise
    request
      .fn()
      .then((result) => {
        request.resolve(result);
      })
      .catch((error: unknown) => {
        request.reject(error);
      })
      .finally(() => {
        // Free up a concurrency slot and try to dispatch more queued requests
        this._inFlight--;
        this._drain();
      });
  }
}
