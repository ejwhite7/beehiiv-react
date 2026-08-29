import type { AutomationsEndpoint } from '../src/client/endpoints/automations.js';
import type { AutomationJourneysEndpoint } from '../src/client/endpoints/automation-journeys.js';
import type { BulkSubscriptionsEndpoint } from '../src/client/endpoints/bulkSubscriptions.js';
import type { BulkSubscriptionUpdatesEndpoint } from '../src/client/endpoints/bulkSubscriptionUpdates.js';
import type { CustomFieldsEndpoint } from '../src/client/endpoints/custom-fields.js';
import type { EngagementsEndpoint } from '../src/client/endpoints/engagements.js';
import type { PostsEndpoint } from '../src/client/endpoints/posts.js';
import type { SegmentsEndpoint } from '../src/client/endpoints/segments.js';
import type { SubscriptionsEndpoint } from '../src/client/endpoints/subscriptions.js';
import type { TiersEndpoint } from '../src/client/endpoints/tiers.js';
import type { WebhooksEndpoint } from '../src/client/endpoints/webhooks.js';

declare const automations: AutomationsEndpoint;
declare const automationJourneys: AutomationJourneysEndpoint;
declare const bulkSubscriptions: BulkSubscriptionsEndpoint;
declare const bulkUpdates: BulkSubscriptionUpdatesEndpoint;
declare const customFields: CustomFieldsEndpoint;
declare const engagements: EngagementsEndpoint;
declare const posts: PostsEndpoint;
declare const segments: SegmentsEndpoint;
declare const subscriptions: SubscriptionsEndpoint;
declare const tiers: TiersEndpoint;
declare const webhooks: WebhooksEndpoint;

// Every explicit-publication call below is missing its required payload.
// @ts-expect-error publication ID requires subscription creation data
subscriptions.create('pub_test');
// @ts-expect-error publication and subscription IDs require update data
subscriptions.updateById('pub_test', 'sub_test');
// @ts-expect-error publication ID and email require update data
subscriptions.updateByEmail('pub_test', 'person@example.com');
// @ts-expect-error publication and subscription IDs require tags
subscriptions.addTags('pub_test', 'sub_test');
// @ts-expect-error publication ID requires post creation data
posts.create('pub_test');
// @ts-expect-error publication and post IDs require update data
posts.update('pub_test', 'post_test');
// @ts-expect-error publication ID requires webhook creation data
webhooks.create('pub_test');
// @ts-expect-error publication and webhook IDs require update data
webhooks.update('pub_test', 'webhook_test');
// @ts-expect-error publication ID requires custom-field creation data
customFields.create('pub_test');
// @ts-expect-error publication and field IDs require update data
customFields.update('pub_test', 'field_test');
// @ts-expect-error publication ID requires automation creation data
automations.create('pub_test');
// @ts-expect-error publication ID requires journey creation data
automationJourneys.create('pub_test');
// @ts-expect-error publication ID requires segment creation data
segments.create('pub_test');
// @ts-expect-error publication ID requires tier creation data
tiers.create('pub_test');
// @ts-expect-error publication and tier IDs require update data
tiers.update('pub_test', 'tier_test');
// @ts-expect-error publication ID requires bulk subscription data
bulkSubscriptions.create('pub_test');
// @ts-expect-error publication ID requires bulk field-update data
bulkUpdates.bulkUpdateFields('pub_test');
// @ts-expect-error publication ID requires bulk status-update data
bulkUpdates.bulkUpdateStatus('pub_test');
// @ts-expect-error publication ID requires engagement query parameters
engagements.get('pub_test');

export {};
