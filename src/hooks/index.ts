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
