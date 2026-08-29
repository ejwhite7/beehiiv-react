/**
 * Automations endpoint for the beehiiv API client.
 * Manages automation workflows including listing, creating, retrieving,
 * querying subscriber journeys, and listing automation emails.
 * @module client/endpoints/automations
 */

import type {
  AutomationStatus,
  AutomationJourneyStatus,
  CreateAutomationRequest,
  AutomationListResponse,
  AutomationResponse,
  AutomationJourneyListResponse,
  AutomationEmailListResponse,
} from '../../types/automation.js';
import type { BeehiivHttpClient } from '../index.js';
import { requireObjectPayload } from './signature-validation.js';

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

/** Options for listing automation emails with offset-based pagination */
export interface ListAutomationEmailsOptions {
  /** Maximum number of results to return per page */
  limit?: number;
  /** Page number to retrieve */
  page?: number;
}

/**
 * Client for the `/publications/{publicationId}/automations` endpoints.
 * Handles listing, creating, and retrieving automations, as well as
 * querying subscriber journeys and listing automation emails.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const automations = new AutomationsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const list = await automations.list({ status: 'active' });
 * const single = await automations.get('aut_123');
 *
 * // Or pass one explicitly to override
 * const list2 = await automations.list('pub_other', { status: 'active' });
 * ```
 */
export class AutomationsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new AutomationsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   * @param defaultPublicationId - Optional default publication ID from client config
   */
  constructor(httpClient: BeehiivHttpClient, defaultPublicationId?: string) {
    this._http = httpClient;
    this._defaultPublicationId = defaultPublicationId;
  }

  /**
   * Resolve the publication ID from an explicit argument or the configured default.
   * Throws if neither is available.
   */
  private _resolvePublicationId(publicationId?: string): string {
    const id = publicationId ?? this._defaultPublicationId;
    if (!id) {
      throw new Error(
        'publicationId is required. Either pass it explicitly or set it in the BeehiivClient config.',
      );
    }
    return id;
  }

  /**
   * List automations for a publication with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/automations` with optional
   * filtering by status and cursor-based pagination.
   *
   * @param publicationIdOrOptions - Either the publication ID (starts with "pub_") or filtering/pagination options when using the default publication ID
   * @param options - Optional filtering and pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of automations with cursor metadata
   */
  async list(
    publicationIdOrOptions?: string | ListAutomationsOptions,
    options?: ListAutomationsOptions
  ): Promise<AutomationListResponse> {
    let publicationId: string;
    let listOptions: ListAutomationsOptions | undefined;

    if (typeof publicationIdOrOptions === 'string') {
      publicationId = publicationIdOrOptions;
      listOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      listOptions = publicationIdOrOptions;
    }

    const params = new URLSearchParams();

    if (listOptions?.limit !== undefined) {
      params.set('limit', String(listOptions.limit));
    }
    if (listOptions?.cursor) {
      params.set('cursor', listOptions.cursor);
    }
    if (listOptions?.status) {
      params.set('status', listOptions.status);
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
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the automation ID (when using default publication ID)
   * @param id - The automation ID (when publicationId is passed explicitly)
   * @returns The automation record
   */
  async get(
    publicationIdOrId: string,
    id?: string
  ): Promise<AutomationResponse> {
    let publicationId: string;
    let automationId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      automationId = id;
    } else {
      publicationId = this._resolvePublicationId();
      automationId = publicationIdOrId;
    }

    return this._http.get<AutomationResponse>(
      `/publications/${publicationId}/automations/${automationId}`
    );
  }

  /**
   * Create a new automation on a publication.
   *
   * Calls `POST /v2/publications/{publicationId}/automations`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the automation data when using the default publication ID
   * @param data - Automation data including name, trigger, and optional steps (when publicationId is passed explicitly)
   * @returns The newly created automation
   */
  create(publicationId: string, data: CreateAutomationRequest): Promise<AutomationResponse>;
  create(data: CreateAutomationRequest): Promise<AutomationResponse>;
  async create(
    publicationIdOrData: string | CreateAutomationRequest,
    data?: CreateAutomationRequest
  ): Promise<AutomationResponse> {
    let publicationId: string;
    let requestData: CreateAutomationRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = requireObjectPayload('AutomationsEndpoint.create', data);
    } else {
      publicationId = this._resolvePublicationId();
      requestData = requireObjectPayload(
        'AutomationsEndpoint.create',
        publicationIdOrData,
      );
    }

    return this._http.post<AutomationResponse>(
      `/publications/${publicationId}/automations`,
      requestData
    );
  }

  /**
   * List subscriber journeys for an automation with cursor-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/automations/{automationId}/journeys`
   * with optional filtering by journey status and cursor-based pagination.
   *
   * @param publicationIdOrAutomationId - Either the publication ID (when called with 3 args) or the automation ID (when using default publication ID)
   * @param automationIdOrOptions - The automation ID (when publicationId is passed explicitly) or filtering/pagination options
   * @param options - Optional filtering and pagination parameters (when publicationId is passed explicitly)
   * @returns Paginated list of automation journeys with cursor metadata
   */
  async listJourneys(
    publicationIdOrAutomationId: string,
    automationIdOrOptions?: string | ListJourneysOptions,
    options?: ListJourneysOptions
  ): Promise<AutomationJourneyListResponse> {
    let publicationId: string;
    let automationId: string;
    let journeyOptions: ListJourneysOptions | undefined;

    if (typeof automationIdOrOptions === 'string') {
      publicationId = publicationIdOrAutomationId;
      automationId = automationIdOrOptions;
      journeyOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      automationId = publicationIdOrAutomationId;
      journeyOptions = automationIdOrOptions;
    }

    const params = new URLSearchParams();

    if (journeyOptions?.limit !== undefined) {
      params.set('limit', String(journeyOptions.limit));
    }
    if (journeyOptions?.cursor) {
      params.set('cursor', journeyOptions.cursor);
    }
    if (journeyOptions?.status) {
      params.set('status', journeyOptions.status);
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/automations/${automationId}/journeys${query ? `?${query}` : ''}`;
    return this._http.get<AutomationJourneyListResponse>(path);
  }

  /**
   * List emails for an automation with offset-based pagination.
   *
   * Calls `GET /v2/publications/{publicationId}/automations/{automationId}/emails`.
   *
   * @param publicationIdOrAutomationId - Either the publication ID (when called with 3 args) or the automation ID (when using default publication ID)
   * @param automationIdOrOptions - The automation ID (when publicationId is passed explicitly) or pagination options
   * @param options - Optional pagination parameters (when publicationId is passed explicitly)
   * @returns List of automation emails
   */
  async listEmails(
    publicationIdOrAutomationId: string,
    automationIdOrOptions?: string | ListAutomationEmailsOptions,
    options?: ListAutomationEmailsOptions
  ): Promise<AutomationEmailListResponse> {
    let publicationId: string;
    let automationId: string;
    let emailOptions: ListAutomationEmailsOptions | undefined;

    if (typeof automationIdOrOptions === 'string') {
      publicationId = publicationIdOrAutomationId;
      automationId = automationIdOrOptions;
      emailOptions = options;
    } else {
      publicationId = this._resolvePublicationId();
      automationId = publicationIdOrAutomationId;
      emailOptions = automationIdOrOptions;
    }

    const params = new URLSearchParams();

    if (emailOptions?.limit !== undefined) {
      params.set('limit', String(emailOptions.limit));
    }
    if (emailOptions?.page !== undefined) {
      params.set('page', String(emailOptions.page));
    }

    const query = params.toString();
    const path = `/publications/${publicationId}/automations/${automationId}/emails${query ? `?${query}` : ''}`;
    return this._http.get<AutomationEmailListResponse>(path);
  }
}
