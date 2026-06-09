/**
 * Public type exports for beehiiv-react.
 *
 * Where applicable, hand-written types re-export or extend definitions from
 * the auto-generated OpenAPI types (`beehiiv-api.generated.ts`). Run
 * `npm run generate:types` to regenerate from the latest beehiiv API spec.
 *
 * @module types
 */

export type {
  BeehiivErrorDetail,
  BeehiivApiError,
  CursorPaginationMeta,
  OffsetPaginationMeta,
  PaginatedResponse,
  RequestDirection,
  BeehiivApiConfig,
  BeehiivConfig,
} from './common.js';

export type {
  CustomFieldKind,
  CustomFieldInfo,
  CustomFieldResponse,
  CustomFieldIndexResponse,
  CustomFieldValue,
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest,
} from './custom-field.js';

export type {
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionCustomField,
  SubscriptionInfo,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionResponse,
  SubscriptionListResponse,
} from './subscription.js';

export type {
  PublicationsRequestExpand,
  PublicationStats,
  PublicationInfo,
  PublicationResponse,
  PublicationsListResponse,
} from './publication.js';

export type {
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
} from './post.js';

export type {
  WebhookEventType,
  WebhookInfo,
  WebhookPayload,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookResponse,
  WebhookListResponse,
} from './webhook.js';

export type {
  AccessResult,
  UseSubscriberAccessOptions,
  UsePostAccessOptions,
  UsePostAccessReturn,
  UseSubscriberProfileOptions,
  SubscriberProfile,
  SubscriberTierResult,
  SubscriberBadgeProps,
} from './access.js';

export type {
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
} from './segment.js';

export type {
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
} from './automation.js';

export type {
  ReferralMilestoneRewardType,
  ReferralMilestone,
  ReferralProgram,
  ReferralStats,
  ReferralProgramResponse,
  ReferralStatsResponse,
} from './referral.js';

export type {
  AutomationJourneyStatus as AutomationJourneyInfoStatus,
  AutomationJourneyInfo,
  CreateAutomationJourneyRequest,
  AutomationJourneyResponse,
} from './automation-journey.js';

export type {
  Tier,
  TierType,
  ListTiersParams,
  ListTiersResponse,
  GetTierResponse,
  CreateTierRequest,
  CreateTierResponse,
  UpdateTierRequest,
  UpdateTierResponse,
} from './tier.js';

export type {
  Author,
  ListAuthorsResponse,
  GetAuthorResponse,
} from './author.js';

export type {
  BulkCreateSubscriptionEntry,
  BulkCreateSubscriptionsRequest,
  BulkCreateSubscriptionsResponse,
  BulkSubscriptionUpdateJobStatus,
  BulkSubscriptionUpdateJobType,
  BulkSubscriptionUpdateJob,
  BulkUpdateCustomFieldEntry,
  BulkUpdateSubscriptionEntry,
  BulkUpdateFieldsRequest,
  BulkUpdateFieldsResponse,
  BulkUpdateStatusRequest,
  ListBulkUpdateJobsResponse,
  GetBulkUpdateJobResponse,
} from './bulk-subscriptions.js';

export type {
  EngagementMetrics,
  GetEngagementsResponse,
} from './engagement.js';
