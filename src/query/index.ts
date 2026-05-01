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

// --- Key factory types (new) ---
export type {
  TierListKeyOptions,
  AuthorListKeyOptions,
  EngagementListKeyOptions,
} from './keys.js';

// --- Tier query hooks ---
export {
  useTiersQuery,
  useTierQuery,
  useCreateTierMutation,
  useUpdateTierMutation,
} from './tiers.js';
export type {
  UseTiersQueryOptions,
  UseTierQueryOptions,
  CreateTierMutationVariables,
  UseCreateTierMutationOptions,
  UpdateTierMutationVariables,
  UseUpdateTierMutationOptions,
} from './tiers.js';

// --- Author query hooks ---
export {
  useAuthorsQuery,
  useAuthorQuery,
} from './authors.js';
export type {
  UseAuthorsQueryOptions,
  UseAuthorQueryOptions,
} from './authors.js';

// --- Bulk subscription & update mutation hooks ---
export {
  useBulkSubscribeMutation,
  useBulkUpdateFieldsMutation,
  useBulkUpdateStatusMutation,
  useAddTagsMutation,
} from './bulkSubscriptions.js';
export type {
  BulkSubscribeMutationVariables,
  UseBulkSubscribeMutationOptions,
  BulkUpdateFieldsMutationVariables,
  UseBulkUpdateFieldsMutationOptions,
  BulkUpdateStatusMutationVariables,
  UseBulkUpdateStatusMutationOptions,
  AddTagsMutationVariables,
  UseAddTagsMutationOptions,
} from './bulkSubscriptions.js';

// --- Engagement query hooks ---
export {
  useEngagementsQuery,
} from './engagements.js';
export type {
  UseEngagementsQueryOptions,
} from './engagements.js';

// --- Automation query hooks ---
export {
  useAutomationsQuery,
  useAutomationQuery,
  useCreateAutomationJourneyMutation,
} from './automations.js';
export type {
  UseAutomationsQueryOptions,
  UseAutomationQueryOptions,
  UseCreateAutomationJourneyMutationOptions,
} from './automations.js';

// --- Webhook query hooks ---
export {
  useWebhooksQuery,
  useWebhookQuery,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
} from './webhooks.js';
export type {
  UseWebhooksQueryOptions,
  UseWebhookQueryOptions,
  UseCreateWebhookMutationOptions,
  UpdateWebhookVariables,
  UseUpdateWebhookMutationOptions,
  UseDeleteWebhookMutationOptions,
} from './webhooks.js';

// --- Segment query hooks ---
export {
  useSegmentsQuery,
  useSegmentQuery,
  useSegmentResultsQuery,
  useCreateSegmentMutation,
  useDeleteSegmentMutation,
  useRecalculateSegmentMutation,
} from './segments.js';
export type {
  UseSegmentsQueryOptions,
  UseSegmentQueryOptions,
  UseSegmentResultsQueryOptions,
  UseCreateSegmentMutationOptions,
  UseDeleteSegmentMutationOptions,
  UseRecalculateSegmentMutationOptions,
} from './segments.js';

// --- Referral query hooks ---
export {
  useReferralsQuery,
} from './referrals.js';
export type {
  UseReferralsQueryOptions,
} from './referrals.js';
