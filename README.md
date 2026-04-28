# beehiiv-react

A typed React SDK and CLI for integrating [beehiiv](https://www.beehiiv.com/) newsletters into Next.js applications. Scaffolds configuration, generates TypeScript types from your publication's custom fields, and provides React hooks and components for subscription management.

## Installation

```bash
npm install beehiiv-react
```

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

## BeehiivProvider Setup

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

## useSubscribe Hook

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

## SubscriptionForm Component

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

### Headless Mode

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

## BeehiivClient (Server-Side)

Use the `BeehiivClient` directly in server-side code (API routes, server actions, scripts):

```ts
import { BeehiivClient } from 'beehiiv-react';

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

The client includes built-in rate limiting (180 requests/minute) matching beehiiv's API limits.

## Syncing Custom Fields

After adding or modifying custom fields in the beehiiv dashboard, regenerate your TypeScript types:

```bash
npx beehiiv-react sync
```

This re-fetches the custom field definitions from the beehiiv API and updates `types/beehiiv.generated.ts` with the latest fields and types.

## OAuth2 Support

For OAuth2 PKCE-based authentication (instead of API keys):

```bash
npx beehiiv-react init --oauth
```

This starts a local callback server and opens the beehiiv authorization page in your browser. OAuth2 requires a registered client ID with beehiiv. Contact beehiiv to register your application for OAuth2 access.

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

## License

MIT
