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

// --- Hooks ---
export {
  useBeehiiv,
  useSubscribe,
  useSubscription,
  useCustomFields,
} from './hooks/index.js';

export type {
  BeehiivContextValue,
  UseSubscribeOptions,
  UseSubscribeReturn,
  UseSubscriptionReturn,
  UseCustomFieldsReturn,
} from './hooks/index.js';

// --- Components ---
export {
  BeehiivProvider,
  SubscriptionForm,
} from './components/index.js';

export type {
  BeehiivProviderProps,
  SubscriptionFormProps,
  CustomFieldConfig,
  RenderFormProps,
} from './components/index.js';

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
} from './types/index.js';
