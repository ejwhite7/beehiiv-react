"use client";

/**
 * Hook for fetching custom field definitions from a beehiiv publication.
 *
 * Automatically fetches on mount and exposes a `refetch` function
 * for manual re-triggering.
 *
 * @module hooks/useCustomFields
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CustomFieldInfo } from '../types/custom-field.js';
import { useBeehiiv } from './useBeehiiv.js';

/**
 * Return value of the {@link useCustomFields} hook.
 */
export interface UseCustomFieldsReturn {
  /** Array of custom field definitions for the publication */
  fields: CustomFieldInfo[];
  /** Whether the custom fields are currently being fetched */
  isLoading: boolean;
  /** Error from the most recent fetch attempt, or `null` */
  error: Error | null;
  /** Manually re-trigger the custom fields fetch */
  refetch: () => void;
}

/**
 * Hook for fetching the custom field definitions of the current publication.
 *
 * Uses the nearest `<BeehiivProvider>` to resolve `apiUrl`, then sends a
 * GET request to `{apiUrl}/custom-fields`.
 *
 * @returns Custom field data, loading state, error, and a refetch handle
 *
 * @example
 * ```tsx
 * function CustomFieldsList() {
 *   const { fields, isLoading, error, refetch } = useCustomFields();
 *
 *   if (isLoading) return <p>Loading custom fields...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {fields.map((f) => (
 *         <li key={f.id}>{f.display} ({f.kind})</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useCustomFields(): UseCustomFieldsReturn {
  const { apiUrl } = useBeehiiv();

  const [fields, setFields] = useState<CustomFieldInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current fetch so we can skip stale responses
  const fetchIdRef = useRef(0);

  /**
   * Execute the fetch request for custom fields.
   */
  const fetchCustomFields = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/custom-fields`);

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const message =
          typeof body.message === 'string'
            ? body.message
            : `Failed to fetch custom fields (status ${response.status})`;
        throw new Error(message);
      }

      const result = (await response.json()) as { data: CustomFieldInfo[] };

      if (currentFetchId === fetchIdRef.current) {
        setFields(result.data);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [apiUrl]);

  // Auto-fetch on mount
  useEffect(() => {
    void fetchCustomFields();
  }, [fetchCustomFields]);

  /**
   * Manually re-trigger the custom fields fetch.
   */
  const refetch = useCallback(() => {
    void fetchCustomFields();
  }, [fetchCustomFields]);

  return { fields, isLoading, error, refetch };
}
