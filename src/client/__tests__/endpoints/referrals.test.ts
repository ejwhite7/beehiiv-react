/**
 * Unit tests for the ReferralsEndpoint class.
 * Tests getProgram, listMilestones, and getSubscriberStats methods,
 * including dual-signature calling conventions.
 * Uses a mocked BeehiivHttpClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferralsEndpoint } from '../../endpoints/referrals.js';
import type { BeehiivHttpClient } from '../../index.js';

/** Creates a mock BeehiivHttpClient with all methods stubbed */
function createMockHttpClient(): BeehiivHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

describe('ReferralsEndpoint', () => {
  let mockHttp: BeehiivHttpClient;
  let endpoint: ReferralsEndpoint;

  beforeEach(() => {
    mockHttp = createMockHttpClient();
    endpoint = new ReferralsEndpoint(mockHttp);
  });

  describe('getProgram', () => {
    it('should GET the referral program endpoint', async () => {
      const responseData = {
        data: {
          id: 'ref_prog_1',
          publication_id: 'pub_123',
          enabled: true,
          milestones: [],
          referral_url_base: 'https://example.com/refer',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.getProgram('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/referral_program'
      );
      expect(result).toEqual(responseData);
    });

    it('should return program with milestones', async () => {
      const responseData = {
        data: {
          id: 'ref_prog_1',
          publication_id: 'pub_123',
          enabled: true,
          milestones: [
            {
              id: 'ms_1',
              milestone_count: 5,
              reward_type: 'custom_reward',
              reward_description: 'Free sticker pack',
              active: true,
            },
          ],
          referral_url_base: 'https://example.com/refer',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.getProgram('pub_123');

      expect(result.data.milestones).toHaveLength(1);
      expect(result.data.milestones[0].reward_type).toBe('custom_reward');
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new ReferralsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { id: 'ref_prog_1' } });

      await endpointWithDefault.getProgram();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/referral_program'
      );
    });

    it('should throw when no publicationId is available', async () => {
      await expect(endpoint.getProgram()).rejects.toThrow(
        'publicationId is required'
      );
    });
  });

  describe('listMilestones', () => {
    it('should GET the milestones endpoint', async () => {
      const responseData = {
        data: {
          id: 'ref_prog_1',
          publication_id: 'pub_123',
          enabled: true,
          milestones: [
            {
              id: 'ms_1',
              milestone_count: 5,
              reward_type: 'free_month',
              reward_description: 'One free month of premium',
              active: true,
            },
            {
              id: 'ms_2',
              milestone_count: 10,
              reward_type: 'custom_reward',
              reward_description: 'Exclusive merch',
              active: true,
            },
          ],
          referral_url_base: 'https://example.com/refer',
          created_at: 1700000000,
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.listMilestones('pub_123');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/referral_program/milestones'
      );
      expect(result).toEqual(responseData);
    });

    it('should use default publicationId when called with no args', async () => {
      const endpointWithDefault = new ReferralsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { id: 'ref_prog_1' } });

      await endpointWithDefault.listMilestones();

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/referral_program/milestones'
      );
    });
  });

  describe('getSubscriberStats', () => {
    it('should GET the subscriber stats endpoint', async () => {
      const responseData = {
        data: {
          subscriber_id: 'sub_xyz',
          referral_code: 'REF123',
          referral_url: 'https://example.com/refer/REF123',
          referral_count: 7,
          milestones_achieved: ['ms_1'],
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.getSubscriberStats('pub_123', 'sub_xyz');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_123/referral_program/subscribers/sub_xyz/stats'
      );
      expect(result).toEqual(responseData);
    });

    it('should return stats with zero referrals', async () => {
      const responseData = {
        data: {
          subscriber_id: 'sub_new',
          referral_code: 'REF456',
          referral_url: 'https://example.com/refer/REF456',
          referral_count: 0,
          milestones_achieved: [],
        },
      };
      vi.mocked(mockHttp.get).mockResolvedValue(responseData);

      const result = await endpoint.getSubscriberStats('pub_123', 'sub_new');

      expect(result.data.referral_count).toBe(0);
      expect(result.data.milestones_achieved).toHaveLength(0);
    });

    it('should use default publicationId when called with one arg', async () => {
      const endpointWithDefault = new ReferralsEndpoint(mockHttp, 'pub_default');
      vi.mocked(mockHttp.get).mockResolvedValue({ data: { subscriber_id: 'sub_xyz' } });

      await endpointWithDefault.getSubscriberStats('sub_xyz');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/publications/pub_default/referral_program/subscribers/sub_xyz/stats'
      );
    });

    it('should throw when no publicationId is available and called with one arg', async () => {
      await expect(endpoint.getSubscriberStats('sub_xyz')).rejects.toThrow(
        'publicationId is required'
      );
    });
  });
});
