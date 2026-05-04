/**
 * Public hook exports for beehiiv-react.
 *
 * Re-exports all React hooks and their associated types so consumers
 * can import everything from a single entry point.
 *
 * @module hooks
 */

export { useBeehiiv } from './useBeehiiv.js';
export type { BeehiivContextValue } from './useBeehiiv.js';

export { useSubscribe } from './useSubscribe.js';
export type {
  UseSubscribeOptions,
  UseSubscribeReturn,
  SubscribeData,
} from './useSubscribe.js';

export { useSubscription } from './useSubscription.js';
export type {
  UseSubscriptionOptions,
  UseSubscriptionReturn,
} from './useSubscription.js';

export { useCustomFields } from './useCustomFields.js';
export type { UseCustomFieldsReturn } from './useCustomFields.js';

export { usePosts } from './usePosts.js';
export type {
  UsePostsOptions,
  UsePostsReturn,
} from './usePosts.js';

export { usePost } from './usePost.js';
export type {
  UsePostOptions,
  UsePostReturn,
} from './usePost.js';

export { usePostBySlug } from './usePostBySlug.js';
export type {
  UsePostBySlugOptions,
  UsePostBySlugReturn,
} from './usePostBySlug.js';

export { useSubscriberAccess } from './useSubscriberAccess.js';

export { usePostAccess } from './usePostAccess.js';

export { useSubscriberProfile } from './useSubscriberProfile.js';

export { useSubscriberTier } from './useSubscriberTier.js';

export { useSubscribers } from './useSubscribers.js';
export type {
  UseSubscribersOptions,
  UseSubscribersReturn,
} from './useSubscribers.js';

export { usePublications } from './usePublications.js';
export type {
  UsePublicationsOptions,
  UsePublicationsReturn,
} from './usePublications.js';

export { useTiers } from './useTiers.js';
export type {
  UseTiersOptions,
  UseTiersReturn,
} from './useTiers.js';

export { useTier } from './useTier.js';
export type {
  UseTierOptions,
  UseTierReturn,
} from './useTier.js';

export { useAuthors } from './useAuthors.js';
export type {
  UseAuthorsOptions,
  UseAuthorsReturn,
} from './useAuthors.js';

export { useAuthor } from './useAuthor.js';
export type {
  UseAuthorOptions,
  UseAuthorReturn,
} from './useAuthor.js';

export { useBulkUpdateJob } from './useBulkUpdateJob.js';
export type {
  UseBulkUpdateJobOptions,
  UseBulkUpdateJobReturn,
} from './useBulkUpdateJob.js';

export { useEngagements } from './useEngagements.js';
export type {
  UseEngagementsOptions,
  UseEngagementsReturn,
} from './useEngagements.js';

export { useAutomations } from './useAutomations.js';
export type {
  UseAutomationsOptions,
  UseAutomationsReturn,
  UseAutomationOptions,
  UseAutomationReturn,
} from './useAutomations.js';

export { useWebhooks } from './useWebhooks.js';
export type {
  UseWebhooksOptions,
  UseWebhooksReturn,
  UseWebhookOptions,
  UseWebhookReturn,
} from './useWebhooks.js';

export { useSegments } from './useSegments.js';
export type {
  UseSegmentsOptions,
  UseSegmentsReturn,
  UseSegmentOptions,
  UseSegmentReturn,
} from './useSegments.js';

export { useReferrals } from './useReferrals.js';
export type {
  UseReferralsOptions,
  UseReferralsReturn,
} from './useReferrals.js';
