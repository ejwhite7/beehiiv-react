/**
 * TanStack Query adapter for beehiiv-react.
 *
 * Provides query-key factories, `useQuery` hooks, and `useMutation`
 * hooks that integrate beehiiv API calls with TanStack Query v5+
 * for caching, deduplication, and automatic background re-fetching.
 *
 * Import from `beehiiv-react/query` to use this adapter:
 * ```ts
 * import { beehiivKeys, usePostsQuery, useSubscribeMutation } from 'beehiiv-react/query';
 * ```
 *
 * @packageDocumentation
 */

// --- Key factory ---
export { beehiivKeys } from './keys.js';
export type {
  PostListKeyOptions,
  SubscriberListKeyOptions,
  PublicationListKeyOptions,
  AutomationListKeyOptions,
} from './keys.js';

// --- Query hooks ---
export {
  usePostsQuery,
  usePostQuery,
  useSubscribersQuery,
  useSubscriptionQuery,
  useCustomFieldsQuery,
  usePublicationsQuery,
} from './hooks.js';
export type {
  UsePostsQueryOptions,
  UsePostQueryOptions,
  UseSubscribersQueryOptions,
  UseSubscriptionQueryOptions,
  UseCustomFieldsQueryOptions,
  UsePublicationsQueryOptions,
} from './hooks.js';

// --- Mutation hooks ---
export { useSubscribeMutation } from './mutations.js';
export type {
  SubscribeMutationVariables,
  UseSubscribeMutationOptions,
} from './mutations.js';
