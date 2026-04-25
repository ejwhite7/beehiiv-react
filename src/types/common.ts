/**
 * Common types shared across all beehiiv API modules.
 * @module types/common
 */

/** Detail of a single error returned by the beehiiv API */
export interface BeehiivErrorDetail {
  /** The field or parameter that caused the error */
  field?: string;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code?: string;
}

/** Structured error response from the beehiiv API */
export interface BeehiivApiError {
  /** HTTP status code */
  status: number;
  /** Top-level error message */
  message: string;
  /** Granular error details, if available */
  errors?: BeehiivErrorDetail[];
}

/** Cursor-based pagination metadata returned by list endpoints */
export interface CursorPaginationMeta {
  /** The cursor pointing to the next page of results (null if no more pages) */
  next_cursor: string | null;
  /** Whether there are more results after the current page */
  has_more: boolean;
  /** Total number of results matching the query */
  total_results: number;
}

/** Offset-based pagination metadata used by some endpoints */
export interface OffsetPaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total_results: number;
  /** Total number of pages */
  total_pages: number;
}

/**
 * Generic paginated response wrapper.
 * Most beehiiv list endpoints return data in this shape.
 */
export interface PaginatedResponse<T> {
  /** Array of result items for the current page */
  data: T[];
  /** Pagination metadata (cursor or offset based) */
  pagination: CursorPaginationMeta | OffsetPaginationMeta;
}

/** Sort direction for list queries */
export type RequestDirection = 'asc' | 'desc';

/** Configuration for the beehiiv API client */
export interface BeehiivApiConfig {
  /** Your beehiiv API key (v2). Keep this server-side only. */
  apiKey: string;
  /** The publication ID to target (starts with "pub_") */
  publicationId?: string;
  /** Override the base URL for the beehiiv API (default: "https://api.beehiiv.com/v2") */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum API requests per minute to enforce via client-side rate limiting (beehiiv limit: 180) */
  rateLimitPerMinute?: number;
}
