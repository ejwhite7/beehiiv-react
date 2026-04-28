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
