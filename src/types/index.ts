/**
 * Public type exports for beehiiv-react.
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
} from './access.js';
