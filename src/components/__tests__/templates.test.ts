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

  it('includes POST and GET handlers', () => {
    const template = compileTemplate('api-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('export async function POST');
    expect(output).toContain('export async function GET');
    expect(output).toContain('BeehiivClient');
    expect(output).toContain('BEEHIIV_API_KEY');
    expect(output).toContain('BEEHIIV_PUBLICATION_ID');
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

  it('includes use server directive and both actions', () => {
    const template = compileTemplate('server-action.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain("'use server'");
    expect(output).toContain('subscribeAction');
    expect(output).toContain('unsubscribeAction');
    expect(output).toContain('BeehiivClient');
    expect(output).toContain('BEEHIIV_API_KEY');
  });
});
