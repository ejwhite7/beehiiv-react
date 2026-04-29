/**
 * Tests for new Handlebars code generation templates:
 * - posts-route.ts.hbs
 * - use-subscriber-status.ts.hbs
 * - analytics.ts.hbs
 * - subscribe-cta.tsx.hbs
 * - subscribe-step-two.tsx.hbs
 * - subscribe-wrapper.tsx.hbs
 * @module components/__tests__/templates-new
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
// posts-route.ts.hbs
// ---------------------------------------------------------------------------

describe('posts-route.ts.hbs', () => {
  it('generates a valid Next.js posts API route', () => {
    const template = compileTemplate('posts-route.ts.hbs');
    const output = template({ publicationId: 'pub_posts123' });

    expect(output).toMatchSnapshot();
  });

  it('includes GET handler with page-based pagination', () => {
    const template = compileTemplate('posts-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain('export async function GET');
    expect(output).toContain('page');
    expect(output).not.toContain('cursor');
    expect(output).toContain('client.posts.list');
    expect(output).toContain('pagination');
    expect(output).toContain('BeehiivClient');
    expect(output).toContain('BEEHIIV_API_KEY');
  });

  it('embeds the publication ID', () => {
    const template = compileTemplate('posts-route.ts.hbs');
    const output = template({ publicationId: 'pub_loadmore' });

    expect(output).toContain('pub_loadmore');
  });

  it('imports BeehiivClient from beehiiv-react/server', () => {
    const template = compileTemplate('posts-route.ts.hbs');
    const output = template({ publicationId: 'pub_xyz' });

    expect(output).toContain("from 'beehiiv-react/server'");
    expect(output).not.toMatch(/from 'beehiiv-react'[^/]/);
  });
});

// ---------------------------------------------------------------------------
// use-subscriber-status.ts.hbs
// ---------------------------------------------------------------------------

describe('use-subscriber-status.ts.hbs', () => {
  it('generates the hook with cookie and localStorage support', () => {
    const template = compileTemplate('use-subscriber-status.ts.hbs');
    const output = template({});

    expect(output).toMatchSnapshot();
  });

  it('includes use client directive', () => {
    const template = compileTemplate('use-subscriber-status.ts.hbs');
    const output = template({});

    expect(output).toContain("'use client'");
  });

  it('reads from cookie first and falls back to localStorage', () => {
    const template = compileTemplate('use-subscriber-status.ts.hbs');
    const output = template({});

    expect(output).toContain('beehiiv_subscribed');
    expect(output).toContain('document.cookie');
    expect(output).toContain('localStorage');
  });

  it('exports useSubscriberStatus hook with correct return type', () => {
    const template = compileTemplate('use-subscriber-status.ts.hbs');
    const output = template({});

    expect(output).toContain('export function useSubscriberStatus');
    expect(output).toContain('isSubscribed');
    expect(output).toContain('markSubscribed');
  });

  it('sets cookie with correct attributes', () => {
    const template = compileTemplate('use-subscriber-status.ts.hbs');
    const output = template({});

    expect(output).toContain('path=/');
    expect(output).toContain('max-age=');
    expect(output).toContain('SameSite=Lax');
    expect(output).toContain('31536000');
  });
});

// ---------------------------------------------------------------------------
// analytics.ts.hbs
// ---------------------------------------------------------------------------

describe('analytics.ts.hbs', () => {
  it('generates the analytics utility', () => {
    const template = compileTemplate('analytics.ts.hbs');
    const output = template({});

    expect(output).toMatchSnapshot();
  });

  it('exports pushEvent function', () => {
    const template = compileTemplate('analytics.ts.hbs');
    const output = template({});

    expect(output).toContain('export function pushEvent');
  });

  it('includes Window dataLayer type declaration', () => {
    const template = compileTemplate('analytics.ts.hbs');
    const output = template({});

    expect(output).toContain('interface Window');
    expect(output).toContain('dataLayer');
  });

  it('guards against server-side execution', () => {
    const template = compileTemplate('analytics.ts.hbs');
    const output = template({});

    expect(output).toContain("typeof window === 'undefined'");
  });
});

// ---------------------------------------------------------------------------
// subscribe-cta.tsx.hbs
// ---------------------------------------------------------------------------

describe('subscribe-cta.tsx.hbs', () => {
  it('generates the SubscribeCTA component', () => {
    const template = compileTemplate('subscribe-cta.tsx.hbs');
    const output = template({});

    expect(output).toMatchSnapshot();
  });

  it('includes use client directive', () => {
    const template = compileTemplate('subscribe-cta.tsx.hbs');
    const output = template({});

    expect(output).toContain("'use client'");
  });

  it('uses useSubscriberStatus hook', () => {
    const template = compileTemplate('subscribe-cta.tsx.hbs');
    const output = template({});

    expect(output).toContain('useSubscriberStatus');
    expect(output).toContain('isSubscribed');
    expect(output).toContain('markSubscribed');
  });

  it('returns null when subscribed', () => {
    const template = compileTemplate('subscribe-cta.tsx.hbs');
    const output = template({});

    expect(output).toContain('return null');
  });

  it('fires all required dataLayer events', () => {
    const template = compileTemplate('subscribe-cta.tsx.hbs');
    const output = template({});

    expect(output).toContain('beehiiv_subscribe_cta_viewed');
    expect(output).toContain('beehiiv_subscribe_form_submitted');
    expect(output).toContain('beehiiv_subscribe_success');
    expect(output).toContain('beehiiv_subscribe_error');
  });

  it('tracks email domain not full email', () => {
    const template = compileTemplate('subscribe-cta.tsx.hbs');
    const output = template({});

    expect(output).toContain('email_domain');
    expect(output).toContain("split('@')");
  });
});

// ---------------------------------------------------------------------------
// subscribe-step-two.tsx.hbs
// ---------------------------------------------------------------------------

describe('subscribe-step-two.tsx.hbs', () => {
  it('generates the SubscribeStepTwo component', () => {
    const template = compileTemplate('subscribe-step-two.tsx.hbs');
    const output = template({});

    expect(output).toMatchSnapshot();
  });

  it('calls markSubscribed after enrichment', () => {
    const template = compileTemplate('subscribe-step-two.tsx.hbs');
    const output = template({});

    expect(output).toContain('enrichSubscriptionAction');
    expect(output).toContain('markSubscribed');
  });

  it('fires step two dataLayer events', () => {
    const template = compileTemplate('subscribe-step-two.tsx.hbs');
    const output = template({});

    expect(output).toContain('beehiiv_step_two_viewed');
    expect(output).toContain('beehiiv_step_two_submitted');
    expect(output).toContain('beehiiv_step_two_success');
  });
});

// ---------------------------------------------------------------------------
// subscribe-wrapper.tsx.hbs
// ---------------------------------------------------------------------------

describe('subscribe-wrapper.tsx.hbs', () => {
  it('generates the server-side wrapper', () => {
    const template = compileTemplate('subscribe-wrapper.tsx.hbs');
    const output = template({});

    expect(output).toMatchSnapshot();
  });

  it('reads cookies from next/headers', () => {
    const template = compileTemplate('subscribe-wrapper.tsx.hbs');
    const output = template({});

    expect(output).toContain("from 'next/headers'");
    expect(output).toContain('cookies');
    expect(output).toContain('beehiiv_subscribed');
  });

  it('passes serverIsSubscribed prop', () => {
    const template = compileTemplate('subscribe-wrapper.tsx.hbs');
    const output = template({});

    expect(output).toContain('serverIsSubscribed');
  });
});
