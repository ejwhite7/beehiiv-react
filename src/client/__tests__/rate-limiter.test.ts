/**
 * Unit tests for the RateLimiter class.
 * Tests throttling behavior, concurrency limits, queue ordering,
 * and rolling-window rate limiting using fake timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute a single request immediately', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 60 });
    const fn = vi.fn().mockResolvedValue('result');

    const promise = limiter.throttle(fn);
    // Allow microtasks to flush
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should resolve with the underlying function result', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 180 });
    const data = { id: 'sub_123', email: 'test@example.com' };
    const fn = vi.fn().mockResolvedValue(data);

    const promise = limiter.throttle(fn);
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result).toEqual(data);
  });

  it('should reject with the underlying function error', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 180 });
    const error = new Error('API error');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = limiter.throttle(fn);
    // Catch the rejection immediately to avoid unhandled rejection warnings
    const resultPromise = promise.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(0);

    const caught = await resultPromise;
    expect(caught).toBe(error);
  });

  it('should respect maxConcurrent limit', async () => {
    // Use very high RPM so spacing is negligible (1ms)
    const limiter = new RateLimiter({
      requestsPerMinute: 60000,
      maxConcurrent: 2,
    });

    const createSlowFn = () => {
      return vi.fn().mockImplementation(() => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve('done');
          }, 500);
        });
      });
    };

    const fn1 = createSlowFn();
    const fn2 = createSlowFn();
    const fn3 = createSlowFn();

    const p1 = limiter.throttle(fn1);
    const p2 = limiter.throttle(fn2);
    const p3 = limiter.throttle(fn3);

    // Advance past the minimum spacing (1ms each) to let both dispatch
    await vi.advanceTimersByTimeAsync(10);

    // First 2 should be dispatched, 3rd queued due to maxConcurrent=2
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
    expect(fn3).not.toHaveBeenCalled();

    // Advance time to complete the first batch (500ms)
    await vi.advanceTimersByTimeAsync(500);

    // Third should now be dispatched
    expect(fn3).toHaveBeenCalledOnce();

    // Advance to complete the last one
    await vi.advanceTimersByTimeAsync(500);

    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual(['done', 'done', 'done']);
  });

  it('should default maxConcurrent to 5', async () => {
    // Use very high RPM so spacing is negligible (1ms)
    const limiter = new RateLimiter({ requestsPerMinute: 60000 });

    const createSlowFn = () => {
      return vi.fn().mockImplementation(() => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve('done');
          }, 500);
        });
      });
    };

    // Queue 8 requests -- only 5 should be in flight at once
    const fns = Array.from({ length: 8 }, createSlowFn);
    const promises = fns.map((fn) => limiter.throttle(fn));

    // Advance past spacing delays (1ms each * 5 = 5ms + buffer)
    await vi.advanceTimersByTimeAsync(20);

    // First 5 should start
    for (let i = 0; i < 5; i++) {
      expect(fns[i]).toHaveBeenCalledOnce();
    }

    // 6th, 7th, 8th should be queued
    for (let i = 5; i < 8; i++) {
      expect(fns[i]).not.toHaveBeenCalled();
    }

    // Complete the first batch
    await vi.advanceTimersByTimeAsync(500);

    // Now remaining should start
    for (let i = 5; i < 8; i++) {
      expect(fns[i]).toHaveBeenCalledOnce();
    }

    // Complete remaining
    await vi.advanceTimersByTimeAsync(500);

    const results = await Promise.all(promises);
    expect(results).toEqual(Array(8).fill('done'));
  });

  it('should enforce minimum spacing between requests', async () => {
    // 60 requests per minute = 1000ms minimum spacing
    const limiter = new RateLimiter({
      requestsPerMinute: 60,
      maxConcurrent: 10,
    });

    const timestamps: number[] = [];
    const createFn = () => {
      return vi.fn().mockImplementation(() => {
        timestamps.push(Date.now());
        return Promise.resolve('done');
      });
    };

    const fn1 = createFn();
    const fn2 = createFn();
    const fn3 = createFn();

    const p1 = limiter.throttle(fn1);
    const p2 = limiter.throttle(fn2);
    const p3 = limiter.throttle(fn3);

    // First request should fire immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).not.toHaveBeenCalled();

    // Advance by 1000ms (the spacing interval)
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn2).toHaveBeenCalledOnce();

    // Advance another 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn3).toHaveBeenCalledOnce();

    await Promise.all([p1, p2, p3]);

    // Verify spacing between timestamps is at least the minimum
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i] - timestamps[i - 1]).toBeGreaterThanOrEqual(1000);
    }
  });

  it('should enforce rolling window rate limit', async () => {
    // Allow only 2 requests per minute
    const limiter = new RateLimiter({
      requestsPerMinute: 2,
      maxConcurrent: 10,
    });

    const callOrder: number[] = [];
    const createFn = (id: number) => {
      return vi.fn().mockImplementation(() => {
        callOrder.push(id);
        return Promise.resolve(`result-${id}`);
      });
    };

    const fn1 = createFn(1);
    const fn2 = createFn(2);
    const fn3 = createFn(3);

    limiter.throttle(fn1);
    limiter.throttle(fn2);
    const p3 = limiter.throttle(fn3);

    // First request fires immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(fn1).toHaveBeenCalledOnce();

    // Second should be spaced by Math.ceil(60000/2) = 30000ms
    await vi.advanceTimersByTimeAsync(30000);
    expect(fn2).toHaveBeenCalledOnce();

    // Third would exceed the rolling window (2 requests already in the window)
    // It must wait until the oldest timestamp expires from the 60s window
    await vi.advanceTimersByTimeAsync(30000);
    expect(fn3).toHaveBeenCalledOnce();

    const result3 = await p3;
    expect(result3).toBe('result-3');
    expect(callOrder).toEqual([1, 2, 3]);
  });

  it('should process queue in FIFO order', async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 60000,
      maxConcurrent: 1,
    });

    const order: number[] = [];

    const createFn = (id: number) => {
      return vi.fn().mockImplementation(() => {
        order.push(id);
        return new Promise<void>((resolve) => {
          setTimeout(resolve, 50);
        });
      });
    };

    const fns = [createFn(1), createFn(2), createFn(3), createFn(4)];
    const promises = fns.map((fn) => limiter.throttle(fn));

    // Process all requests one at a time (each takes 50ms + 1ms spacing)
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(60);
    }

    await Promise.all(promises);
    expect(order).toEqual([1, 2, 3, 4]);
  });
});
