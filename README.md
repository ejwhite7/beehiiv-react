# beehiiv-react

[![npm version](https://badge.fury.io/js/beehiiv-react.svg)](https://www.npmjs.com/package/beehiiv-react)
[![CI](https://github.com/ejwhite7/beehiiv-react/actions/workflows/ci.yml/badge.svg)](https://github.com/ejwhite7/beehiiv-react/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node-%3E%3D%2018-green.svg)](https://nodejs.org)

**A typed React SDK and CLI for integrating beehiiv newsletters into Next.js applications.**

Scaffolds configuration, generates TypeScript types from your publication's custom fields, and provides React hooks and components for subscription management. Supports server-side usage via `BeehiivClient`, TanStack Query integration, and React Server Components.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI](#cli)
  - [Version](#version)
- [BeehiivProvider](#beehiivprovider)
- [Hooks](#hooks)
  - [useSubscribe](#usesubscribe)
  - [useSubscribers](#usesubscribers)
  - [usePublications](#usepublications)
- [Components](#components)
  - [SubscriptionForm](#subscriptionform)
- [BeehiivClient](#beehiivclient-server-side)
- [Posts & Content Visibility](#posts--content-visibility)
- [Subscriber Profiles](#subscriber-profiles)
- [Release Notes](#release-notes)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
npm install beehiiv-react
```

### Optional peer dependencies

If you use the `beehiiv-react/query` TanStack Query adapter, install the peer dependency too:

```bash
npm install @tanstack/react-query
```

> `@tanstack/react-query` v5+ is required only when importing from `beehiiv-react/query`. If you don't use that sub-path, skip this step.

---

## Import Paths

`beehiiv-react` ships two entry points to support Next.js App Router's server/client module boundary:

| Entry Point | Directive | Use In | Exports |
|---|---|---|---|
| `beehiiv-react` | `"use client"` | Client Components | Hooks, UI components, utilities |
| `beehiiv-react/server` | _(none)_ | Server Components, API routes, Server Actions | `BeehiivClient`, endpoint classes, data fetchers |

```ts
// Client Components
import { useSubscribe, SubscriptionForm } from 'beehiiv-react';

// Server Components / API Routes / Server Actions
import { BeehiivClient, createBeehiivClient } from 'beehiiv-react/server';
```

> **Why two entry points?** Next.js enforces a strict boundary between server and client
> modules. The root `beehiiv-react` entry has a `"use client"` directive so React hooks
> and components work in Client Components. Server-only code like `BeehiivClient` must
> live in a separate entry point without that directive — otherwise Next.js throws
> _"Cannot access BeehiivClient.prototype on the server."_

---

## Quick Start

Initialize beehiiv-react in your Next.js project:

```bash
npx beehiiv-react init
```

This interactive wizard will:

1. Prompt for your beehiiv API key
2. Let you select a publication
3. Fetch custom fields and generate TypeScript types
4. Scaffold a `beehiiv.config.ts`, API routes, and server actions

---

## CLI

### Syncing Custom Fields

After adding or modifying custom fields in the beehiiv dashboard, regenerate your TypeScript types:

```bash
npx beehiiv-react sync
```

This re-fetches the custom field definitions from the beehiiv API and updates `types/beehiiv.generated.ts` with the latest fields and types.

### OAuth2 Support

For OAuth2 PKCE-based authentication (instead of API keys):

```bash
npx beehiiv-react init --oauth
```

This starts a local callback server and opens the beehiiv authorization page in your browser. OAuth2 requires a registered client ID with beehiiv. Contact beehiiv to register your application for OAuth2 access.

### Version

Print the installed version:

```bash
npx beehiiv-react -v
# or
npx beehiiv-react --version
# beehiiv-react/0.4.1
```

---

## BeehiivProvider

Wrap your application with the `BeehiivProvider` to make beehiiv context available to all hooks and components. In a Next.js App Router project, add it to your root layout:

```tsx
// app/layout.tsx
import { BeehiivProvider } from 'beehiiv-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BeehiivProvider
          publicationId={process.env.NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID!}
          apiUrl="/api/beehiiv"
        >
          {children}
        </BeehiivProvider>
      </body>
    </html>
  );
}
```

---

## Hooks

### useSubscribe

Subscribe new emails with fully typed custom fields:

```tsx
'use client';

import { useSubscribe } from 'beehiiv-react';
import type { BeehiivCustomFields } from '@/types/beehiiv.generated';

export function NewsletterSignup() {
  const { subscribe, isLoading, isSuccess, error } = useSubscribe<BeehiivCustomFields>({
    onSuccess: (subscription) => {
      console.log('Subscribed:', subscription.email);
    },
    onError: (err) => {
      console.error('Failed:', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    subscribe({
      email: formData.get('email') as string,
      customFields: {
        firstName: formData.get('firstName') as string,
      },
      utmSource: 'website',
    });
  };

  if (isSuccess) return <p>Thanks for subscribing!</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="you@example.com" required />
      <input name="firstName" type="text" placeholder="First name" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Subscribing...' : 'Subscribe'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

### useSubscribers

Fetch and paginate through subscribers:

```tsx
'use client';

import { useSubscribers } from 'beehiiv-react';

export function SubscriberList() {
  const { data, loading, error, page, nextPage, prevPage } = useSubscribers({
    limit: 20,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <ul>
        {data?.map((sub) => (
          <li key={sub.id}>{sub.email}</li>
        ))}
      </ul>
      <button onClick={prevPage} disabled={page === 1}>Previous</button>
      <button onClick={nextPage}>Next</button>
    </div>
  );
}
```

### usePublications

Fetch all publications accessible with the current API key:

```tsx
'use client';

import { usePublications } from 'beehiiv-react';

export function PublicationPicker() {
  const { data: publications, loading } = usePublications();

  if (loading) return <p>Loading publications...</p>;

  return (
    <select>
      {publications?.map((pub) => (
        <option key={pub.id} value={pub.id}>{pub.name}</option>
      ))}
    </select>
  );
}
```

---

## Components

### SubscriptionForm

A pre-built, drop-in subscription form:

```tsx
import { SubscriptionForm } from 'beehiiv-react';

// Default mode
<SubscriptionForm
  submitLabel="Join Newsletter"
  emailPlaceholder="Enter your email"
  successMessage="Welcome aboard!"
  utmSource="homepage"
/>
```

#### Headless Mode

For full control over rendering, use the `renderForm` prop:

```tsx
<SubscriptionForm
  renderForm={({ email, setEmail, handleSubmit, isLoading, isSuccess, error }) => (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Subscribe'}
      </button>
      {error && <span>{error.message}</span>}
      {isSuccess && <span>Subscribed!</span>}
    </form>
  )}
/>
```

---

## BeehiivClient (Server-Side)

Use the `BeehiivClient` directly in server-side code (API routes, server actions, scripts).

> **Important:** Always import server-side classes from `beehiiv-react/server` — not the
> package root. The root entry point (`beehiiv-react`) carries a `"use client"` directive
> and is reserved for React components and hooks. Importing `BeehiivClient` from the root
> in a Server Component or API route will cause a Next.js error:
> _"Cannot access BeehiivClient.prototype on the server."_

```ts
import { BeehiivClient } from 'beehiiv-react/server';

const client = new BeehiivClient({
  apiKey: process.env.BEEHIIV_API_KEY!,
  publicationId: process.env.BEEHIIV_PUBLICATION_ID!,
});

// Create a subscription
const subscription = await client.subscriptions.create({
  email: 'reader@example.com',
  customFields: [{ name: 'First Name', value: 'Jane' }],
  utmSource: 'api',
});

// List subscribers
const { data: subscribers } = await client.subscriptions.list({ limit: 10 });

// Get custom field definitions
const { data: fields } = await client.customFields.list();
```

> **Tip:** When `publicationId` is set in the client config, you can omit it from individual method calls — the client injects it automatically.

The client includes built-in rate limiting (180 requests/minute) matching beehiiv's API limits.

---

## Posts & Content Visibility

### Fetching Posts

```tsx
import { usePosts, usePost } from 'beehiiv-react';

// List posts — filter by audience and status
const { posts, isLoading, hasMore, loadMore } = usePosts({
  audience: 'free',   // 'free' | 'premium' | 'all'
  status: 'confirmed',
});

// Single post
const { post, isLoading } = usePost({ id: 'post_abc123' });
```

### Rendering Posts

```tsx
import { PostList, PostCard, PostContentRenderer } from 'beehiiv-react';

// Full list with pagination
<PostList
  posts={posts}
  hasMore={hasMore}
  onLoadMore={loadMore}
  isLoading={isLoading}
/>

// Single card
<PostCard post={post} showAudienceBadge showPublishDate />

// Post body (provide your own sanitizer)
import DOMPurify from 'dompurify';
<PostContentRenderer
  content={post.content}
  sanitizeHtml={(html) => DOMPurify.sanitize(html)}
/>
```

### Content Gating

```tsx
import { GatedContent, PremiumContent, useSubscriberAccess } from 'beehiiv-react';

// Declarative gating
<GatedContent
  audience="premium"
  subscriberEmail={userEmail}
  fallback={<p>Upgrade to read this.</p>}
>
  <ArticleBody />
</GatedContent>

// Opinionated premium wrapper with upgrade prompt
<PremiumContent
  subscriberEmail={userEmail}
  upgradePrompt={(tier, status) => (
    <UpgradeBanner currentTier={tier} />
  )}
>
  <ExclusiveContent />
</PremiumContent>

// Programmatic access check
const { canView, tier, isActive, isLoading } = useSubscriberAccess({
  email: userEmail,
  audience: 'premium',
});
```

### Access Logic

The `canViewContent(tier, status, audience)` utility resolves subscriber access:

- `'all'` audience: always accessible
- `'free'` audience: requires active subscription (any tier)
- `'premium'` audience: requires active premium subscription

---

## Subscriber Profiles

Resolve a subscriber's identity, tier, and access flags independently of any content or post.
Use these hooks to decorate user profiles, gate non-beehiiv features, or render subscriber badges.

### Hooks

#### `useSubscriberProfile`

Returns the full subscription record alongside pre-computed `isPremium` and `isActive` flags.

```tsx
import { useSubscriberProfile } from 'beehiiv-react';

const { isPremium, tier, isActive, subscription, isLoading } = useSubscriberProfile({
  email: user.email, // or id: 'sub_abc123'
});

// Decorate a profile
return (
  <UserProfile>
    {isPremium && <PremiumBadge />}
  </UserProfile>
);
```

#### `useSubscriberTier`

Lightweight alternative when you only need the tier flags -- no full subscription record returned.

```tsx
import { useSubscriberTier } from 'beehiiv-react';

const { isPremium, isActive, isLoading } = useSubscriberTier({ email: user.email });

if (isPremium) enablePremiumFeature();
```

### Component

#### `SubscriberBadge`

Renders a "Premium" or "Free" badge based on the subscriber's resolved tier.
Supports headless mode via `renderBadge` for fully custom rendering.

```tsx
import { SubscriberBadge } from 'beehiiv-react';

// Default badge UI
<SubscriberBadge subscriberEmail={user.email} />

// Headless — bring your own UI
<SubscriberBadge
  subscriberEmail={user.email}
  renderBadge={({ isPremium, tier }) => (
    <MyCustomBadge premium={isPremium} label={tier ?? 'Free'} />
  )}
/>
```

---

## Release Notes

### v0.4.1
- **Accessibility**: aria attributes (`aria-required`, `aria-invalid`, `aria-describedby`) and `autocomplete` tokens added across `SubscriptionForm` and the generated subscribe templates (`subscribe-cta`, `subscribe-step-two`)
- **`expand` on `usePosts`/`usePostsQuery`**: list-side `expand` parameter forwarded to the beehiiv API on every paginated load-more, so post content stays populated across all pages
- **SubscribeCTA template fix**: accesses unwrapped `SubscriptionInfo` fields directly (`result?.publication_id`) to match the unwrapped `subscribeAction` response shape

### v0.4.0
- **`defaultPublicationId` dual-signature pattern** extended to all 9 endpoint classes
  - Every method now supports `method(data)` (uses default) or `method(pubId, data)` (explicit override)
  - Endpoints: segments, automations, webhooks, posts, custom-fields, referrals, subscriptions, automation-journeys
- **New endpoint**: `AutomationJourneysEndpoint` with `create()` and `get()` methods
- **New methods**: `PostsEndpoint.aggregateStats()`, `SegmentsEndpoint.create()`, `AutomationsEndpoint.get()`, `AutomationsEndpoint.listEmails()`
- **`GetPostOptions`**: `PostsEndpoint.get()` now accepts an `expand` array to request expanded content fields
- **New types**: `AutomationJourneyInfo`, `PostAggregateStats`, `AutomationEmailInfo`, and more
- Merged all v0.3.7--v0.3.14 fixes into the v0.4.0 codebase
- 467 tests passing across 42 test files

### v0.3.14
- Defensive guards in `usePosts` hook for API responses missing `data` or `pagination` fields
- Prevents runtime crashes when the beehiiv API returns incomplete responses

### v0.3.13
- **BeehiivClient import path fix**: All CLI-generated templates now import `BeehiivClient` from `beehiiv-react/server` (was `beehiiv-react`)
- **UTM fields in subscribeAction**: Generated server actions now accept and pass through `utmSource`, `utmMedium`, `utmChannel`, `utmCampaign`, `referringSite`, `reactivateExisting`
- **`utm_channel` type**: Added to `SubscriptionInfo` and `CreateSubscriptionRequest`

### v0.3.12
- Fixed 5 scaffold template bugs surfaced in generated projects:
  - `publicationId` now wired through correctly in generated server actions and API routes
  - Generated `BeehiivCustomFields` import path matches the custom-fields generator output
  - `expand` parameter properly passed through to the posts list/get endpoints
  - `PostContent` type is exported and aligned across `PostContent`/`PostContentRenderer` components and the `posts` endpoint
  - `usePosts` cursor pagination fixed (load-more no longer clobbers prior pages)

### v0.3.11
- Republish of v0.3.10 with the v0.3.6–v0.3.10 changelog entries now included in the tarball

### v0.3.10
- New CLI-generated subscribe flow with persistence and analytics
  - Two-step subscribe component (`SubscribeCTA` + `SubscribeStepTwo`) with a shared `SubscribeWrapper`
  - Subscriber identity persisted to cookies and `localStorage` so returning visitors skip the form
  - `useSubscriberStatus` hook generated alongside the components for status-aware UI
  - Auto-hides CTAs once a visitor is subscribed
  - Emits `dataLayer` events (`subscribe_view`, `subscribe_step_one`, `subscribe_complete`) for GTM/analytics integration
- New generated `analytics.ts` helper and `posts-route.ts` API route templates
- `PostList` accepts an `onSubscribeClick` prop for inline subscribe entry points

### v0.3.9
- Generated `actions.ts` template now includes the missing `enrichSubscriptionAction` server action

### v0.3.8
- Reverted the ESM CLI build that broke `__dirname` resolution; CLI is back on CJS with the version injected at build time via tsup `define`

### v0.3.7
- CLI reads its version dynamically from `package.json` instead of a hardcoded string

### v0.3.6
- Split server and client exports so the package no longer crosses Next.js RSC boundaries (fixes "Server Components cannot import client components" error)

### v0.3.5
- Fixed 7 TypeScript errors in generated API route templates
  - `SubscriptionsEndpoint` now accepts an optional `defaultPublicationId` from client config; all methods support calling without an explicit publication ID argument
  - Added `get()` alias on `SubscriptionsEndpoint` (maps to `getById`)
  - Added `email` filter to `ListSubscriptionsOptions`
  - Custom fields generator now writes to `lib/beehiiv/beehiiv-custom-fields.ts` (fixes TS2307 import path mismatch in generated server actions)
- Added `-v` / `--version` CLI flag (see [CLI](#cli))
- Added `SKILL.md` and AI coding tool context files (Cursor, Copilot, Windsurf, Cline, Aider, AGENTS.md)

### v0.3.4
- Build pipeline injects `"use client"` directives via tsup `onSuccess` hook (resolves Rollup stripping issue)

### v0.3.3
- Added `"use client"` directives to all client-facing source files

### v0.3.2
- `README.md` and `CLAUDE.md` included in npm package files
- Peer dependency install documentation improved

### v0.3.1
- Fixed ENOENT crash on `npx beehiiv-react init` (CLI template path resolution)
- Fixed default import for `beehiiv.config`
- Fixed Next.js 15 compatibility: async `params` in generated API route handlers

### v0.3.0

v0.3.0 delivers full beehiiv API v2 coverage, two new React hooks, a first-class TanStack Query adapter, and React Server Component utilities.

### 4 New Server-Side Endpoints

The `BeehiivClient` now exposes 8 endpoint namespaces (up from 4 in v0.2.x):

#### Webhooks

```ts
import { BeehiivClient } from 'beehiiv-react/server';

const client = new BeehiivClient({ apiKey: process.env.BEEHIIV_API_KEY! });

// List all webhooks
const { data: webhooks } = await client.webhooks.list('pub_abc');

// Create a webhook
const { data: webhook } = await client.webhooks.create('pub_abc', {
  url: 'https://example.com/webhook',
  events: ['subscription.created', 'post.published'],
});

// Send a test event
await client.webhooks.test('pub_abc', webhook.id);
```

#### Segments

```ts
// List segments
const { data: segments } = await client.segments.list('pub_abc');

// List members of a segment
const { data: members } = await client.segments.listMembers('pub_abc', 'seg_123');
```

#### Automations

```ts
// List automations
const { data: automations } = await client.automations.list('pub_abc');

// List journeys for an automation
const { data: journeys } = await client.automations.listJourneys('pub_abc', 'auto_456');
```

#### Referrals

```ts
// Get the referral program
const { data: program } = await client.referrals.getProgram('pub_abc');

// Get a subscriber's referral stats
const { data: stats } = await client.referrals.getSubscriberStats('pub_abc', 'sub_789');
```

### `beehiiv-react/query` -- TanStack Query Adapter

> **Prerequisites:** Install `@tanstack/react-query` before using this sub-path: `npm install @tanstack/react-query`

A dedicated sub-path export that wraps every beehiiv API call in TanStack Query v5 hooks for automatic caching, deduplication, and background re-fetching.

**Setup:**

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BeehiivProvider } from 'beehiiv-react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BeehiivProvider
        publicationId={process.env.NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID!}
        apiUrl="/api/beehiiv"
      >
        {children}
      </BeehiivProvider>
    </QueryClientProvider>
  );
}
```

**Usage:**

```tsx
'use client';

import { usePostsQuery, useSubscribeMutation } from 'beehiiv-react/query';

export function PostsFeed() {
  const { data, isLoading } = usePostsQuery({ status: 'confirmed', limit: 10 });
  const subscribe = useSubscribeMutation();

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {data?.data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### `beehiiv-react/server` -- React Server Component Utilities

A sub-path export providing RSC-compatible helpers. No hooks, no client-side state -- just plain async functions safe for Server Components, Route Handlers, and Server Actions.

```tsx
// app/posts/page.tsx  (Next.js Server Component)
import { createBeehiivClient, fetchPosts } from 'beehiiv-react/server';

export default async function PostsPage() {
  const client = createBeehiivClient();       // reads BEEHIIV_API_KEY from env
  const posts = await fetchPosts(client, process.env.BEEHIIV_PUB_ID!, {
    status: 'confirmed',
    limit: 20,
  });

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

Additional server fetchers: `fetchPost`, `fetchSubscribers`, `fetchSubscription`, `fetchPublications`, `fetchCustomFields`, `fetchWebhooks`, `fetchSegments`.

### Migration from v0.2.x

All v0.2.x APIs remain stable and unchanged. v0.3.0 is a purely additive release:

- Existing hooks (`useSubscribe`, `useSubscription`, `useCustomFields`, `usePosts`, `usePost`, etc.) are unchanged.
- Existing client endpoints (`subscriptions`, `customFields`, `publications`, `posts`) are unchanged.
- The main `beehiiv-react` import path works exactly as before.
- New features are available via the main import path (new endpoints and hooks) or the new sub-path imports (`beehiiv-react/query`, `beehiiv-react/server`).
- `@tanstack/react-query` (>=5.0.0) is an **optional** peer dependency -- only needed if you import from `beehiiv-react/query`.

---

## API Reference

### Hooks

| Hook | Description |
|------|-------------|
| `useBeehiiv()` | Access the beehiiv context (publication ID, API URL) |
| `useSubscribe()` | Subscribe an email with custom fields and UTM tracking |
| `useSubscription()` | Fetch and manage an existing subscription |
| `useCustomFields()` | Retrieve custom field definitions |
| `usePosts()` | Paginated post list with audience/status filters |
| `usePost()` | Fetch a single post by ID |
| `useSubscriberAccess()` | Resolve subscriber tier + status into an access result |
| `usePostAccess()` | Fetch post + subscriber, returns combined `{ post, canView }` |
| `useSubscribers()` | Fetch and paginate through subscribers |
| `usePublications()` | Fetch all accessible publications |
| `useSubscriberProfile()` | Full subscription record with `isPremium` and `isActive` flags |
| `useSubscriberTier()` | Lightweight tier flags without the full subscription record |

### Components

| Component | Description |
|-----------|-------------|
| `<BeehiivProvider>` | Context provider for beehiiv configuration |
| `<SubscriptionForm>` | Pre-built subscription form with headless mode |
| `<PostCard>` | Displays a single post with thumbnail, badge, title, subtitle, date |
| `<PostList>` | Paginated list of posts with load-more, skeleton loading, empty state |
| `<PostContentRenderer>` | Renders HTML or JSON post content with sanitizer hook |
| `<GatedContent>` | Declarative wrapper for subscriber-gated content |
| `<PremiumContent>` | Opinionated premium gate with `upgradePrompt` render prop |
| `<SubscriberBadge>` | Renders a tier badge with optional headless mode |

### Types

All types are exported from the package root:

```ts
import type {
  SubscriptionInfo,
  PublicationInfo,
  CustomFieldInfo,
  PostInfo,
  PostContent,
  PostAudience,
  AccessResult,
  WebhookInfo,
  BeehiivApiConfig,
  BeehiivConfig,
} from 'beehiiv-react';
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -am 'Add my feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Open a Pull Request

Please follow the existing code style and include tests for any new functionality.

---

## License

Released under the [MIT License](LICENSE).
