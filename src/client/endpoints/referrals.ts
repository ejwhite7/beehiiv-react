/**
 * Referrals endpoint for the beehiiv API client.
 * Manages referral program data including program configuration,
 * milestones, and per-subscriber referral statistics.
 * @module client/endpoints/referrals
 */

import type {
  ReferralProgramResponse,
  ReferralStatsResponse,
} from '../../types/referral.js';
import type { BeehiivHttpClient } from '../index.js';

/**
 * Client for the `/publications/{publicationId}/referral_program` endpoints.
 * Handles retrieving referral program configuration, milestones, and
 * per-subscriber referral statistics.
 *
 * When a `defaultPublicationId` is provided (typically injected by
 * {@link BeehiivClient}), every method can be called without explicitly
 * passing a publication ID -- the configured default will be used
 * automatically. You can always pass a publication ID explicitly to
 * override the default.
 *
 * @example
 * ```ts
 * const referrals = new ReferralsEndpoint(httpClient, 'pub_abc');
 *
 * // Uses the default publication ID
 * const program = await referrals.getProgram();
 * const milestones = await referrals.listMilestones();
 * const stats = await referrals.getSubscriberStats('sub_123');
 *
 * // Or pass one explicitly to override
 * const program2 = await referrals.getProgram('pub_other');
 * ```
 */
export class ReferralsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /** Default publication ID injected from client config */
  private readonly _defaultPublicationId?: string;

  /**
   * Creates a new ReferralsEndpoint instance.
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
   * Get the referral program configuration for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/referral_program`.
   *
   * @param publicationId - Optional publication ID (uses default if omitted)
   * @returns The referral program configuration
   */
  async getProgram(
    publicationId?: string
  ): Promise<ReferralProgramResponse> {
    const resolvedId = this._resolvePublicationId(publicationId);
    return this._http.get<ReferralProgramResponse>(
      `/publications/${resolvedId}/referral_program`
    );
  }

  /**
   * List all milestones configured for a publication's referral program.
   *
   * Calls `GET /v2/publications/{publicationId}/referral_program/milestones`.
   *
   * @param publicationId - Optional publication ID (uses default if omitted)
   * @returns The referral program with milestones data
   */
  async listMilestones(
    publicationId?: string
  ): Promise<ReferralProgramResponse> {
    const resolvedId = this._resolvePublicationId(publicationId);
    return this._http.get<ReferralProgramResponse>(
      `/publications/${resolvedId}/referral_program/milestones`
    );
  }

  /**
   * Get referral statistics for a specific subscriber.
   *
   * Calls `GET /v2/publications/{publicationId}/referral_program/subscribers/{subscriberId}/stats`.
   *
   * @param publicationIdOrSubscriberId - Either the publication ID (when called with 2 args) or the subscriber ID (when using default publication ID)
   * @param subscriberId - The subscriber ID (starts with "sub_") when publicationId is passed explicitly
   * @returns The subscriber's referral statistics
   */
  async getSubscriberStats(
    publicationIdOrSubscriberId: string,
    subscriberId?: string
  ): Promise<ReferralStatsResponse> {
    let publicationId: string;
    let subId: string;

    if (subscriberId !== undefined) {
      publicationId = publicationIdOrSubscriberId;
      subId = subscriberId;
    } else {
      publicationId = this._resolvePublicationId();
      subId = publicationIdOrSubscriberId;
    }

    return this._http.get<ReferralStatsResponse>(
      `/publications/${publicationId}/referral_program/subscribers/${subId}/stats`
    );
  }
}
