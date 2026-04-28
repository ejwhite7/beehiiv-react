/**
 * Automations endpoint for the beehiiv API client.
 * Manages automation workflows including listing, creating, retrieving,
 * and querying subscriber journeys through automations.
 * @module client/endpoints/automations
 */

import type {
  AutomationStatus,
  AutomationJourneyStatus,
  CreateAutomationRequest,
  AutomationListResponse,
  AutomationResponse,
  AutomationJourneyListResponse,
} from '../../types/automation.js';
import type { BeehiivHttpClient } from '../index.js';

/** Options for listing automations with cursor-based pagination */
export interface ListAutomationsOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter automations by status */
  status?: AutomationStatus;
}

/** Options for listing automation journeys with cursor-based pagination */
export interface ListJourneysOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Cursor token for fetching the next page of results */
  cursor?: string;
  /** Filter journeys by status */
  status?: AutomationJourneyStatus;
}

/**
 * Client for the `/publications/{publicationId}/automations` endpoints.
 * Handles listing, creating, and retrieving automations, as well as
 * querying subscriber journeys through automation workflows.
 *
 * @example
 * ```ts
 * const automations = new AutomationsEndpoint(httpClient);
 * const list = await automations.list('pub_abc', { status: 'active' });
 * const single = await automations.get('pub_abc', 'aut_123');
 * const created = await automations.create('pub_abc', { name: 'Welcome', trigger: { type: 'subscriber_created', config: {} } });
 * const journeys = await automations.listJourneys('pub_abc', 'aut_123');
 * ```
 */
export class AutomationsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new AutomationsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * List automations for a publication with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/automations` with optional
   * filtering by status and cursor-based pagination.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param options - Optional filtering and pagination parameters
   * @returns Paginated list of automations with cursor metadata
   */
  async list(
    publicationId: string,
    options?: ListAutomationsOptions
  ): Promise<AutomationListResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.status) {
      params.set('status', options.status);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/automations${query ? `?${query}` : ''}`;
    return this._http.get<AutomationListResponse>(path);
  }

  /**
   * Get a single automation by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/automations/{id}`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param id - The automation ID
   * @returns The automation record
   */
  async get(
    publicationId: string,
    id: string
  ): Promise<AutomationResponse> {
    return this._http.get<AutomationResponse>(
      `/publications/${publicationId}/automations/${id}`
    );
  }

  /**
   * Create a new automation on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/automations`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param data - Automation data including name, trigger, and optional steps
   * @returns The newly created automation
   */
  async create(
    publicationId: string,
    data: CreateAutomationRequest
  ): Promise<AutomationResponse> {
    return this._http.post<AutomationResponse>(
      `/publications/${publicationId}/automations`,
      data
    );
  }

  /**
   * List subscriber journeys for an automation with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/automations/{automationId}/journeys`
   * with optional filtering by journey status and cursor-based pagination.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param automationId - The automation ID to query journeys for
   * @param options - Optional filtering and pagination parameters
   * @returns Paginated list of automation journeys with cursor metadata
   */
  async listJourneys(
    publicationId: string,
    automationId: string,
    options?: ListJourneysOptions
  ): Promise<AutomationJourneyListResponse> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.status) {
      params.set('status', options.status);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/automations/${automationId}/journeys${query ? `?${query}` : ''}`;
    return this._http.get<AutomationJourneyListResponse>(path);
  }
}
