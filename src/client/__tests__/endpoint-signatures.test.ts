/** Compile-time and JavaScript-runtime contracts for payload-bearing overloads. */

import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AutomationsEndpoint } from '../endpoints/automations.js';
import { AutomationJourneysEndpoint } from '../endpoints/automation-journeys.js';
import { BulkSubscriptionsEndpoint } from '../endpoints/bulkSubscriptions.js';
import { BulkSubscriptionUpdatesEndpoint } from '../endpoints/bulkSubscriptionUpdates.js';
import { CustomFieldsEndpoint } from '../endpoints/custom-fields.js';
import { EngagementsEndpoint } from '../endpoints/engagements.js';
import { PostsEndpoint } from '../endpoints/posts.js';
import { SegmentsEndpoint } from '../endpoints/segments.js';
import { SubscriptionsEndpoint } from '../endpoints/subscriptions.js';
import { TiersEndpoint } from '../endpoints/tiers.js';
import { WebhooksEndpoint } from '../endpoints/webhooks.js';
import type { BeehiivHttpClient } from '../index.js';

type UnsafeAsyncMethod = (...args: unknown[]) => Promise<unknown>;

function createMockHttpClient(): BeehiivHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

function unsafeCall(method: unknown, ...args: unknown[]): Promise<unknown> {
  return (method as UnsafeAsyncMethod)(...args);
}

describe('dual-signature payload contracts', () => {
  it('compile-fail fixtures reject every missing explicit-publication payload', () => {
    const tsc = path.resolve('node_modules/typescript/bin/tsc');
    const fixture = path.resolve('test-d/dual-signatures.ts');

    expect(() =>
      execFileSync(
        process.execPath,
        [
          tsc,
          '--noEmit',
          '--strict',
          '--skipLibCheck',
          '--target',
          'ES2020',
          '--module',
          'NodeNext',
          '--moduleResolution',
          'NodeNext',
          fixture,
        ],
        { encoding: 'utf8', stdio: 'pipe' },
      ),
    ).not.toThrow();
  });

  it('malformed JavaScript calls fail clearly before reaching HTTP', async () => {
    const http = createMockHttpClient();
    const subscriptions = new SubscriptionsEndpoint(http, 'pub_default');
    const posts = new PostsEndpoint(http, 'pub_default');
    const webhooks = new WebhooksEndpoint(http, 'pub_default');
    const customFields = new CustomFieldsEndpoint(http, 'pub_default');
    const automations = new AutomationsEndpoint(http, 'pub_default');
    const journeys = new AutomationJourneysEndpoint(http, 'pub_default');
    const segments = new SegmentsEndpoint(http, 'pub_default');
    const tiers = new TiersEndpoint(http, 'pub_default');
    const bulkSubscriptions = new BulkSubscriptionsEndpoint(http, 'pub_default');
    const bulkUpdates = new BulkSubscriptionUpdatesEndpoint(http, 'pub_default');
    const engagements = new EngagementsEndpoint(http, 'pub_default');

    const cases: Array<{
      operation: string;
      invoke: () => Promise<unknown>;
      message: string;
    }> = [
      { operation: 'subscriptions.create', invoke: () => unsafeCall(subscriptions.create.bind(subscriptions), 'pub_test'), message: 'SubscriptionsEndpoint.create requires an object payload' },
      { operation: 'subscriptions.updateById', invoke: () => unsafeCall(subscriptions.updateById.bind(subscriptions), 'pub_test', 'sub_test'), message: 'SubscriptionsEndpoint.updateById requires an object payload' },
      { operation: 'subscriptions.updateByEmail', invoke: () => unsafeCall(subscriptions.updateByEmail.bind(subscriptions), 'pub_test', 'person@example.com'), message: 'SubscriptionsEndpoint.updateByEmail requires an object payload' },
      { operation: 'subscriptions.addTags', invoke: () => unsafeCall(subscriptions.addTags.bind(subscriptions), 'pub_test', 'sub_test'), message: 'SubscriptionsEndpoint.addTags requires a string array payload' },
      { operation: 'posts.create', invoke: () => unsafeCall(posts.create.bind(posts), 'pub_test'), message: 'PostsEndpoint.create requires an object payload' },
      { operation: 'posts.update', invoke: () => unsafeCall(posts.update.bind(posts), 'pub_test', 'post_test'), message: 'PostsEndpoint.update requires an object payload' },
      { operation: 'webhooks.create', invoke: () => unsafeCall(webhooks.create.bind(webhooks), 'pub_test'), message: 'WebhooksEndpoint.create requires an object payload' },
      { operation: 'webhooks.update', invoke: () => unsafeCall(webhooks.update.bind(webhooks), 'pub_test', 'webhook_test'), message: 'WebhooksEndpoint.update requires an object payload' },
      { operation: 'customFields.create', invoke: () => unsafeCall(customFields.create.bind(customFields), 'pub_test'), message: 'CustomFieldsEndpoint.create requires an object payload' },
      { operation: 'customFields.update', invoke: () => unsafeCall(customFields.update.bind(customFields), 'pub_test', 'field_test'), message: 'CustomFieldsEndpoint.update requires an object payload' },
      { operation: 'automations.create', invoke: () => unsafeCall(automations.create.bind(automations), 'pub_test'), message: 'AutomationsEndpoint.create requires an object payload' },
      { operation: 'journeys.create', invoke: () => unsafeCall(journeys.create.bind(journeys), 'pub_test'), message: 'AutomationJourneysEndpoint.create requires an object payload' },
      { operation: 'segments.create', invoke: () => unsafeCall(segments.create.bind(segments), 'pub_test'), message: 'SegmentsEndpoint.create requires an object payload' },
      { operation: 'tiers.create', invoke: () => unsafeCall(tiers.create.bind(tiers), 'pub_test'), message: 'TiersEndpoint.create requires an object payload' },
      { operation: 'tiers.update', invoke: () => unsafeCall(tiers.update.bind(tiers), 'pub_test', 'tier_test'), message: 'TiersEndpoint.update requires an object payload' },
      { operation: 'bulkSubscriptions.create', invoke: () => unsafeCall(bulkSubscriptions.create.bind(bulkSubscriptions), 'pub_test'), message: 'BulkSubscriptionsEndpoint.create requires an object payload' },
      { operation: 'bulkUpdates.bulkUpdateFields', invoke: () => unsafeCall(bulkUpdates.bulkUpdateFields.bind(bulkUpdates), 'pub_test'), message: 'BulkSubscriptionUpdatesEndpoint.bulkUpdateFields requires an object payload' },
      { operation: 'bulkUpdates.bulkUpdateStatus', invoke: () => unsafeCall(bulkUpdates.bulkUpdateStatus.bind(bulkUpdates), 'pub_test'), message: 'BulkSubscriptionUpdatesEndpoint.bulkUpdateStatus requires an object payload' },
      { operation: 'engagements.get', invoke: () => unsafeCall(engagements.get.bind(engagements), 'pub_test'), message: 'EngagementsEndpoint.get requires an object payload' },
    ];

    for (const testCase of cases) {
      await expect(
        testCase.invoke(),
        testCase.operation,
      ).rejects.toThrow(testCase.message);
    }

    expect(http.get).not.toHaveBeenCalled();
    expect(http.post).not.toHaveBeenCalled();
    expect(http.put).not.toHaveBeenCalled();
    expect(http.patch).not.toHaveBeenCalled();
    expect(http.delete).not.toHaveBeenCalled();
  });
});
