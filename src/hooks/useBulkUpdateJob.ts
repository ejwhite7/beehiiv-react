/**
 * Hook for polling a bulk subscription update job until completion.
 *
 * Periodically fetches the job status from the beehiiv API and stops
 * polling once the job reaches a terminal state ("completed" or "failed").
 *
 * @module hooks/useBulkUpdateJob
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { BulkSubscriptionUpdateJob } from '../types/bulk-subscriptions.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Options for configuring the {@link useBulkUpdateJob} hook.
 */
export interface UseBulkUpdateJobOptions {
  /**
   * Interval in milliseconds between polling requests.
   * @defaultValue 2000
   */
  pollInterval?: number;
}

/**
 * Return value of the {@link useBulkUpdateJob} hook.
 */
export interface UseBulkUpdateJobReturn {
  /** The most recently fetched job record, or `null` if not yet loaded */
  job: BulkSubscriptionUpdateJob | null;
  /** Whether the hook is actively polling for status updates */
  isPolling: boolean;
  /** Error from the most recent polling attempt, or `null` */
  error: Error | null;
}

/** Internal state managed by the hook */
interface BulkUpdateJobState {
  job: BulkSubscriptionUpdateJob | null;
  isPolling: boolean;
  error: Error | null;
}

/** Initial (idle) state before the first fetch */
const INITIAL_STATE: BulkUpdateJobState = {
  job: null,
  isPolling: true,
  error: null,
};

/** Job statuses that indicate the job has finished processing */
const TERMINAL_STATUSES = new Set<string>(['completed', 'failed']);

/**
 * Hook that polls a bulk subscription update job until it reaches
 * a terminal status ("completed" or "failed").
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl` and
 * `publicationId`, then fetches
 * `{apiUrl}/bulk_subscription_updates/{jobId}` on a recurring interval.
 *
 * Polling stops automatically when the job reaches a terminal status
 * or when the component unmounts.
 *
 * @param publicationId - The publication ID that owns the bulk job
 * @param jobId - The bulk update job ID to poll
 * @param options - Optional configuration (e.g. poll interval)
 * @returns The current job record, polling state, and any error
 *
 * @example
 * ```tsx
 * function BulkJobTracker({ jobId }: { jobId: string }) {
 *   const { job, isPolling, error } = useBulkUpdateJob(
 *     'pub_abc',
 *     jobId,
 *     { pollInterval: 3000 },
 *   );
 *
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!job) return <p>Loading...</p>;
 *
 *   return (
 *     <div>
 *       <p>Status: {job.status}</p>
 *       <p>Progress: {job.created + job.updated}/{job.total}</p>
 *       {isPolling && <p>Still processing...</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBulkUpdateJob(
  publicationId: string,
  jobId: string,
  options?: UseBulkUpdateJobOptions,
): UseBulkUpdateJobReturn {
  const { apiUrl } = useBeehiiv();
  const [state, setState] = useState<BulkUpdateJobState>(INITIAL_STATE);

  /** Resolved poll interval with default fallback */
  const pollInterval = options?.pollInterval ?? 2000;

  /** Ref to track the interval ID for cleanup */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Ref to prevent state updates after unmount */
  const mountedRef = useRef(true);

  /**
   * Fetch the current job status from the API.
   * Updates state with the result or any error encountered.
   */
  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiUrl}/publications/${publicationId}/bulk_subscription_updates/${jobId}`,
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch job status with status ${response.status}`;
        throw new Error(message);
      }

      const result = (await response.json()) as {
        data: BulkSubscriptionUpdateJob;
      };

      if (!mountedRef.current) return;

      const isTerminal = TERMINAL_STATUSES.has(result.data.status);

      setState({
        job: result.data,
        isPolling: !isTerminal,
        error: null,
      });

      /* Stop the interval when the job is done */
      if (isTerminal && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({ ...prev, error, isPolling: false }));

      /* Stop polling on error to avoid hammering a broken endpoint */
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [apiUrl, publicationId, jobId]);

  /**
   * Set up the polling interval on mount and clean up on unmount
   * or when dependencies change.
   */
  useEffect(() => {
    mountedRef.current = true;

    /* Perform an immediate fetch, then set up the interval */
    void fetchJobStatus();
    intervalRef.current = setInterval(fetchJobStatus, pollInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchJobStatus, pollInterval]);

  return {
    job: state.job,
    isPolling: state.isPolling,
    error: state.error,
  };
}

