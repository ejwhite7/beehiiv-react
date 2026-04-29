/**
 * Automation journeys endpoint for the beehiiv API client.
 * Manages automation journey operations including creating new journeys
 * and retrieving existing journey records.
 * @module client/endpoints/automation-journeys
 */

import type {
  CreateAutomationJourneyRequest,
  AutomationJourneyResponse,
} from '../../types/automation-journey.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/automation_journeys` endpoints.
 * Handles creating and retrieving automation journeys.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const journeys = new AutomationJourneysEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const created = await journeys.create({
 *   automationId: 'aut_123',
 *   subscriptionId: 'sub_456',
 * });
 * const journey = await journeys.get('aj_789');
 *
 * // Or pass one explicitly to override
 * const created2 = await journeys.create('pub_other', {
 *   automationId: 'aut_123',
 *   subscriptionId: 'sub_456',
 * });
 * ```
 */
export class AutomationJourneysEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new AutomationJourneysEndpoint instance.
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
   * Create a new automation journey for a subscriber.
   *
   * Calls `POST /v2/publications/{publicationId}/automation_journeys`.
   *
   * @param publicationIdOrData - Either the publication ID (starts with "pub_") or the journey data when using the default publication ID
   * @param data - Journey data including automationId and subscriptionId (when publicationId is passed explicitly)
   * @returns The newly created automation journey
   */
  async create(
    publicationIdOrData: string | CreateAutomationJourneyRequest,
    data?: CreateAutomationJourneyRequest
  ): Promise<AutomationJourneyResponse> {
    let publicationId: string;
    let requestData: CreateAutomationJourneyRequest;

    if (typeof publicationIdOrData === 'string') {
      publicationId = publicationIdOrData;
      requestData = data!;
    } else {
      publicationId = this._resolvePublicationId();
      requestData = publicationIdOrData;
    }

    return this._http.post<AutomationJourneyResponse>(
      `/publications/${publicationId}/automation_journeys`,
      requestData
    );
  }

  /**
   * Get an automation journey by its ID.
   *
   * Calls `GET /v2/publications/{publicationId}/automation_journeys/{id}`.
   *
   * @param publicationIdOrId - Either the publication ID (when called with 2 args) or the journey ID (when using default publication ID)
   * @param id - The automation journey ID (when publicationId is passed explicitly)
   * @returns The automation journey record
   */
  async get(
    publicationIdOrId: string,
    id?: string
  ): Promise<AutomationJourneyResponse> {
    let publicationId: string;
    let journeyId: string;

    if (id !== undefined) {
      publicationId = publicationIdOrId;
      journeyId = id;
    } else {
      publicationId = this._resolvePublicationId();
      journeyId = publicationIdOrId;
    }

    return this._http.get<AutomationJourneyResponse>(
      `/publications/${publicationId}/automation_journeys/${journeyId}`
    );
  }
}
