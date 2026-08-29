/**
 * Snapshot tests for Handlebars code generation templates.
 * Compiles each template with representative data and asserts
 * the rendered output matches a stored snapshot.
 * @module components/__tests__/templates.test
 */

import { describe, it, expect } from 'vitest';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read and compile a Handlebars template from the templates/ directory */
function compileTemplate(templateName: string): HandlebarsTemplateDelegate {
  const templatePath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'templates',
    templateName,
  );
  const source = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(source);
}

// ---------------------------------------------------------------------------
// config.ts.hbs
// ---------------------------------------------------------------------------

describe('config.ts.hbs', () => {
  it('generates valid config output', () => {
    const template = compileTemplate('config.ts.hbs');
    const output = template({
      publicationId: 'pub_test123',
      publicationName: 'My Newsletter',
    });

    expect(output).toMatchSnapshot();
  });

  it('includes the publication ID and name', () => {
    const template = compileTemplate('config.ts.hbs');
    const output = template({
      publicationId: 'pub_abc',
      publicationName: 'Test Pub',
    });

    expect(output).toContain("publicationId: 'pub_abc'");
    expect(output).toContain("publicationName: 'Test Pub'");
    expect(output).toContain("apiUrl: '/api/beehiiv'");
    expect(output).toContain('BeehiivConfig');
  });
});

// ---------------------------------------------------------------------------
// custom-fields.ts.hbs
// ---------------------------------------------------------------------------

describe('custom-fields.ts.hbs', () => {
  it('generates typed custom fields with all kinds', () => {
    const template = compileTemplate('custom-fields.ts.hbs');
    const output = template({
      publicationName: 'Test Newsletter',
      generatedAt: '2025-01-15T12:00:00Z',
      fields: [
        {
          display: 'First Name',
          camelCaseKey: 'firstName',
          tsType: 'string',
          required: true,
        },
        {
          display: 'Age',
          camelCaseKey: 'age',
          tsType: 'number',
          required: false,
        },
        {
          display: 'Rating',
          camelCaseKey: 'rating',
          tsType: 'number',
          required: false,
        },
        {
          display: 'Subscribed',
          camelCaseKey: 'subscribed',
          tsType: 'boolean',
          required: false,
        },
        {
          display: 'Birth Date',
          camelCaseKey: 'birthDate',
          tsType: 'string',
          required: false,
        },
        {
          display: 'Created At',
          camelCaseKey: 'createdAt',
          tsType: 'string',
          required: false,
        },
        {
          display: 'Plan',
          camelCaseKey: 'plan',
          tsType: "'Free' | 'Pro' | 'Enterprise'",
          required: false,
        },
      ],
    });

    expect(output).toMatchSnapshot();
  });

  it('marks required fields without the optional modifier', () => {
    const template = compileTemplate('custom-fields.ts.hbs');
    const output = template({
      publicationName: 'Test',
      generatedAt: '2025-01-15T12:00:00Z',
      fields: [
        {
          display: 'Email',
          camelCaseKey: 'email',
          tsType: 'string',
          required: true,
        },
      ],
    });

    // Required field should NOT have the ? modifier
    expect(output).toContain('email: string;');
    expect(output).not.toContain('email?: string;');
  });

  it('marks optional fields with the ? modifier', () => {
    const template = compileTemplate('custom-fields.ts.hbs');
    const output = template({
      publicationName: 'Test',
      generatedAt: '2025-01-15T12:00:00Z',
      fields: [
        {
          display: 'Nickname',
          camelCaseKey: 'nickname',
          tsType: 'string',
          required: false,
        },
      ],
    });

    expect(output).toContain('nickname?: string;');
  });
});

// ---------------------------------------------------------------------------
// api-route.ts.hbs
// ---------------------------------------------------------------------------

describe('api-route.ts.hbs', () => {
  it('generates a valid Next.js API route', () => {
    const template = compileTemplate('api-route.ts.hbs');
    const output = template({
      publicationId: 'pub_route456',
    });

    expect(output).toMatchSnapshot();
  });

  it('includes the public POST and fail-closed GET handlers', () => {
    const template = compileTemplate('api-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('export async function POST');
    expect(output).toContain('export async function GET');
    expect(output).toMatch(
      /async function isSubscriberLookupAuthorized[\s\S]*?return false;/,
    );
    expect(output).toContain("{ error: 'Unauthorized' }, { status: 401 }");
    expect(output).toContain('BeehiivClient');
    expect(output).toContain('BEEHIIV_API_KEY');
    expect(output).toContain('BEEHIIV_PUBLICATION_ID');
  });

  it('imports BeehiivClient from beehiiv-react/server', () => {
    const template = compileTemplate('api-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain("from 'beehiiv-react/server'");
    expect(output).not.toMatch(/from 'beehiiv-react'[^/]/);
  });

  it('returns the response directly without double-wrapping', () => {
    const template = compileTemplate('api-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('return NextResponse.json(subscription');
    expect(output).not.toContain('{ data: subscription }');
  });

  it('denies anonymous lookup before validation or subscriber enumeration', () => {
    const template = compileTemplate('api-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    const authorization = output.indexOf(
      'if (!(await isSubscriberLookupAuthorized(req, email)))',
    );
    const emailValidation = output.indexOf('if (!email)');
    const enumeration = output.indexOf(
      'client.subscriptions.list({ email })',
    );

    expect(authorization).toBeGreaterThan(-1);
    expect(emailValidation).toBeGreaterThan(authorization);
    expect(enumeration).toBeGreaterThan(authorization);
  });
});

// ---------------------------------------------------------------------------
// server-action.ts.hbs
// ---------------------------------------------------------------------------

describe('server-action.ts.hbs', () => {
  it('generates a valid server actions file', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({
      publicationId: 'pub_sa789',
    });

    expect(output).toMatchSnapshot();
  });

  it('includes use server directive and all actions', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain("'use server'");
    expect(output).toContain('subscribeAction');
    expect(output).toContain('unsubscribeAction');
    expect(output).toContain('enrichSubscriptionAction');
    expect(output).toContain('BeehiivClient');
    expect(output).toContain('BEEHIIV_API_KEY');
  });

  it('fails existing-subscriber mutations closed before calling beehiiv', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toMatch(
      /async function assertSubscriberMutationAuthorized[\s\S]*?throw new Error\('Unauthorized subscriber operation'\);/,
    );

    const updateAuthorization = output.indexOf(
      "await assertSubscriberMutationAuthorized(id, 'update')",
    );
    const update = output.indexOf('client.subscriptions.updateById(id');
    const deleteAuthorization = output.indexOf(
      "await assertSubscriberMutationAuthorized(id, 'delete')",
    );
    const deletion = output.indexOf('client.subscriptions.delete(id)');

    expect(updateAuthorization).toBeGreaterThan(-1);
    expect(update).toBeGreaterThan(updateAuthorization);
    expect(deleteAuthorization).toBeGreaterThan(-1);
    expect(deletion).toBeGreaterThan(deleteAuthorization);
  });

  it('imports BeehiivClient from beehiiv-react/server', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain("from 'beehiiv-react/server'");
    expect(output).not.toMatch(/from 'beehiiv-react'[^/]/);
  });

  it('includes SubscribePayload with UTM and attribution fields', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('interface SubscribePayload');
    expect(output).toContain('utmSource?: string');
    expect(output).toContain('utmMedium?: string');
    expect(output).toContain('utmChannel?: string');
    expect(output).toContain('utmCampaign?: string');
    expect(output).toContain('referringSite?: string');
    expect(output).toContain('reactivateExisting?: boolean');
  });

  it('passes UTM fields through to client.subscriptions.create with snake_case', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('utm_source: data.utmSource');
    expect(output).toContain('utm_medium: data.utmMedium');
    expect(output).toContain('utm_channel: data.utmChannel');
    expect(output).toContain('utm_campaign: data.utmCampaign');
    expect(output).toContain('referring_site: data.referringSite');
    expect(output).toContain('reactivate_existing: data.reactivateExisting');
  });

  it('returns response.data (unwrapped SubscriptionInfo) from subscribeAction', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('return response.data');
    expect(output).not.toContain('return subscription;');
  });
});
