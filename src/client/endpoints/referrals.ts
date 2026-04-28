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
 * @example
 * ```ts
 * const referrals = new ReferralsEndpoint(httpClient);
 * const program = await referrals.getProgram('pub_abc');
 * const milestones = await referrals.listMilestones('pub_abc');
 * const stats = await referrals.getSubscriberStats('pub_abc', 'sub_123');
 * ```
 */
export class ReferralsEndpoint {
  /** The HTTP client used to make API requests */
  private readonly _http: BeehiivHttpClient;

  /**
   * Creates a new ReferralsEndpoint instance.
   *
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(httpClient: BeehiivHttpClient) {
    this._http = httpClient;
  }

  /**
   * Get the referral program configuration for a publication.
   *
   * Calls `GET /v2/publications/{publicationId}/referral_program`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @returns The referral program configuration
   */
  async getProgram(
    publicationId: string
  ): Promise<ReferralProgramResponse> {
    return this._http.get<ReferralProgramResponse>(
      `/publications/${publicationId}/referral_program`
    );
  }

  /**
   * List all milestones configured for a publication's referral program.
   *
   * Calls `GET /v2/publications/{publicationId}/referral_program/milestones`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @returns The referral program with milestones data
   */
  async listMilestones(
    publicationId: string
  ): Promise<ReferralProgramResponse> {
    return this._http.get<ReferralProgramResponse>(
      `/publications/${publicationId}/referral_program/milestones`
    );
  }

  /**
   * Get referral statistics for a specific subscriber.
   *
   * Calls `GET /v2/publications/{publicationId}/referral_program/subscribers/{subscriberId}/stats`.
   *
   * @param publicationId - The publication ID (starts with "pub_")
   * @param subscriberId - The subscriber ID (starts with "sub_")
   * @returns The subscriber's referral statistics
   */
  async getSubscriberStats(
    publicationId: string,
    subscriberId: string
  ): Promise<ReferralStatsResponse> {
    return this._http.get<ReferralStatsResponse>(
      `/publications/${publicationId}/referral_program/subscribers/${subscriberId}/stats`
    );
  }
}
