/**
 * beehiiv-react - Connect a beehiiv account to your React/Next.js project.
 *
 * Provides a typed API client, React hooks, subscription form component,
 * and CLI scaffolding tool for beehiiv newsletter integration.
 *
 * @packageDocumentation
 */

// --- Client ---
export { BeehiivClient } from './client/index.js';
export { AutomationsEndpoint } from './client/endpoints/automations.js';
export { ReferralsEndpoint } from './client/endpoints/referrals.js';

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
  PostContentProps,
  PostContentData,
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
  PostContentFormat,
  PostContentHtml,
  PostContentJson,
  PostContent,
  PostStats,
  PostInfo,
  CreatePostRequest,
  UpdatePostRequest,
  PostResponse,
  PostListResponse,
  WebhookEventType,
  WebhookInfo,
  WebhookPayload,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookResponse,
  WebhookListResponse,
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
  ReferralMilestoneRewardType,
  ReferralMilestone,
  ReferralProgram,
  ReferralStats,
  ReferralProgramResponse,
  ReferralStatsResponse,
} from './types/index.js';
