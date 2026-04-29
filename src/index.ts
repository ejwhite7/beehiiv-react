/**
 * beehiiv-react - Connect a beehiiv account to your React/Next.js project.
 *
 * Provides React hooks, subscription form components, and client-safe
 * utilities for beehiiv newsletter integration.
 *
 * This is the client-side entry point — all exports here are safe to use
 * in React Client Components. The "use client" directive is injected at
 * build time so Next.js treats this module as a client boundary.
 *
 * For server-side usage (API routes, Server Components, Server Actions),
 * import from `beehiiv-react/server` instead:
 *
 * ```ts
 * import { BeehiivClient, createBeehiivClient } from 'beehiiv-react/server';
 * ```
 *
 * @packageDocumentation
 */

// --- Hooks ---
export {
  useBeehiiv,
  useSubscribe,
  useSubscription,
  useCustomFields,
  usePosts,
  usePost,
  useSubscriberAccess,
  usePostAccess,
  useSubscriberProfile,
  useSubscriberTier,
  useSubscribers,
  usePublications,
} from './hooks/index.js';

export type {
  BeehiivContextValue,
  UseSubscribeOptions,
  UseSubscribeReturn,
  SubscribeData,
  UseSubscriptionOptions,
  UseSubscriptionReturn,
  UseCustomFieldsReturn,
  UsePostsOptions,
  UsePostsReturn,
  UsePostOptions,
  UsePostReturn,
  UseSubscribersOptions,
  UseSubscribersReturn,
  UsePublicationsOptions,
  UsePublicationsReturn,
} from './hooks/index.js';

// --- Components ---
export {
  BeehiivProvider,
  BeehiivContext,
  SubscriptionForm,
  PostCard,
  PostList,
  PostContentRenderer,
  GatedContent,
  PremiumContent,
  SubscriberBadge,
} from './components/index.js';

export type {
  BeehiivProviderProps,
  SubscriptionFormProps,
  CustomFieldConfig,
  RenderFormProps,
  PostCardProps,
  RenderPostCardProps,
  PostListProps,
  PostContentRendererProps,
  GatedContentProps,
  PremiumContentProps,
  SubscriberBadgeProps,
} from './components/index.js';

// --- Utilities ---
export {
  canViewContent,
  getAudienceLabel,
  getTierLabel,
} from './utils/index.js';

// --- Types ---
// All types are pure type exports (erased at runtime) and are safe to
// re-export from the client entry point. They carry no "use client"
// runtime implications because TypeScript strips them during compilation.
export type {
  BeehiivErrorDetail,
  BeehiivApiError,
  CursorPaginationMeta,
  OffsetPaginationMeta,
  PaginatedResponse,
  RequestDirection,
  BeehiivApiConfig,
  BeehiivConfig,
  CustomFieldKind,
  CustomFieldInfo,
  CustomFieldResponse,
  CustomFieldIndexResponse,
  CustomFieldValue,
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionCustomField,
  SubscriptionInfo,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionResponse,
  SubscriptionListResponse,
  PublicationsRequestExpand,
  PublicationStats,
  PublicationInfo,
  PublicationResponse,
  PublicationsListResponse,
  PostStatus,
  PostAudience,
  PostContentTier,
  PostContent,
  PostStats,
  PostInfo,
  CreatePostRequest,
  UpdatePostRequest,
  PostResponse,
  PostListResponse,
  PostAggregateStats,
  PostAggregateStatsResponse,
  WebhookEventType,
  WebhookInfo,
  WebhookPayload,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookResponse,
  WebhookListResponse,
  SegmentType,
  SegmentStatus,
  SegmentMembersExpand,
  SegmentsExpand,
  SegmentStats,
  SegmentInfo,
  SegmentMember,
  SegmentResponse,
  SegmentListResponse,
  SegmentMembersResponse,
  CustomFieldFilter,
  SegmentSubscriptionInput,
  CreateSegmentRequest,
  ListSegmentsOptions,
  ListSegmentMembersOptions,
  SegmentRecalculateResponse,
  AccessResult,
  UseSubscriberAccessOptions,
  UsePostAccessOptions,
  UsePostAccessReturn,
  UseSubscriberProfileOptions,
  SubscriberProfile,
  SubscriberTierResult,
  AutomationStatus,
  AutomationTriggerType,
  AutomationStepType,
  AutomationStep,
  AutomationTrigger,
  AutomationInfo,
  AutomationJourneyStatus,
  AutomationJourney,
  AutomationResponse,
  AutomationListResponse,
  AutomationJourneyListResponse,
  CreateAutomationRequest,
  ListAutomationsOptions,
  ListJourneysOptions,
  AutomationEmailInfo,
  AutomationEmailListResponse,
  ReferralMilestoneRewardType,
  ReferralMilestone,
  ReferralProgram,
  ReferralStats,
  ReferralProgramResponse,
  ReferralStatsResponse,
  AutomationJourneyInfo,
  CreateAutomationJourneyRequest,
  AutomationJourneyResponse,
} from './types/index.js';
