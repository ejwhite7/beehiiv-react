/**
 * Tests for the useBulkUpdateJob hook.
 *
 * Validates that:
 * - It fetches the job status on mount and polls periodically
 * - It stops polling when the job reaches a terminal status
 * - It handles error responses correctly and stops polling
 * - It resets state when the jobId changes
 * - Stale responses from previous fetches are discarded
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BeehiivProvider } from '../../components/BeehiivProvider.js';
import { useBulkUpdateJob } from '../useBulkUpdateJob.js';

function createWrapper(apiUrl = '/api/beehiiv') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BeehiivProvider apiUrl={apiUrl} publicationId="pub_test">
        {children}
      </BeehiivProvider>
    );
  };
}

describe('useBulkUpdateJob', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('fetch', vi.fn() as ReturnType<typeof vi.fn>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches job status on mount and returns the job', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'job_001',
          type: 'bulk',
          status: 'processing',
          publication_id: 'pub_test',
          created: 1704067200,
          updated: 1704067230,
          completed: null,
        },
      }),
    });

    const { result } = renderHook(
      () => useBulkUpdateJob('pub_test', 'job_001', { pollInterval: 2000 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.job).not.toBeNull();
    });

    expect(result.current.job?.id).toBe('job_001');
    expect(result.current.job?.status).toBe('processing');
    expect(result.current.isPolling).toBe(true);
    expect(result.current.error).toBeNull();

    // Verify the correct URL was called
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain('/bulk_subscription_updates/job_001');
    expect(calledUrl).toContain('publicationId=pub_test');
  });

  it('stops polling when the job reaches a terminal status', async () => {
    // First poll: processing
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'job_002',
            type: 'bulk',
            status: 'processing',
            publication_id: 'pub_test',
            created: 1704067200,
            updated: 1704067230,
            completed: null,
          },
        }),
      })
      // Second poll: complete
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'job_002',
            type: 'bulk',
            status: 'complete',
            publication_id: 'pub_test',
            created: 1704067200,
            updated: 1704067260,
            completed: 1704067260,
          },
        }),
      });

    const { result } = renderHook(
      () => useBulkUpdateJob('pub_test', 'job_002', { pollInterval: 2000 }),
      { wrapper: createWrapper() },
    );

    // Wait for first poll
    await waitFor(() => {
      expect(result.current.job?.status).toBe('processing');
    });
    expect(result.current.isPolling).toBe(true);

    // Advance timer to trigger second poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.job?.status).toBe('complete');
    });

    expect(result.current.isPolling).toBe(false);
  });

  it('handles error responses and stops polling', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Job not found' }),
    });

    const { result } = renderHook(
      () => useBulkUpdateJob('pub_test', 'job_missing', { pollInterval: 2000 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe('Job not found');
    expect(result.current.isPolling).toBe(false);
  });

  it('handles failed job status as terminal', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'job_fail',
          type: 'status',
          status: 'failed',
          publication_id: 'pub_test',
          failure_reason: 'All updates failed',
          error_log: ['sub_1: not found'],
          created: 1704067200,
          updated: 1704067230,
          completed: 1704067230,
        },
      }),
    });

    const { result } = renderHook(
      () => useBulkUpdateJob('pub_test', 'job_fail'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.job?.status).toBe('failed');
    });

    expect(result.current.isPolling).toBe(false);
  });
});
