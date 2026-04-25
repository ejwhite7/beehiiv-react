# beehiiv-react

Connect a [beehiiv](https://www.beehiiv.com/) newsletter to your React / Next.js project -- typed API client, React hooks, subscription form component, and CLI scaffolding tool.

## Features

- **Typed API Client** -- full-coverage TypeScript client for the beehiiv API v2
- **React Hooks** -- `useSubscribe`, `useSubscription`, `useCustomFields` for client-side state
- **Drop-in Components** -- `<SubscriptionForm />` with built-in validation and loading states
- **CLI Scaffolding** -- `npx beehiiv-react init` generates config, types, and API routes
- **Custom Field Codegen** -- `npx beehiiv-react sync` generates strongly-typed custom fields from your publication
- **Rate Limiting** -- built-in client-side rate limiter (180 req/min default)

## Installation

```bash
npm install beehiiv-react
```

## Quick Start

### 1. Initialize your project

```bash
npx beehiiv-react init
```

This will:
- Prompt for your beehiiv API key (or use `--oauth` for OAuth2)
- Let you select a publication
- Generate `beehiiv.config.ts` with your publication ID
- Generate typed custom fields from your publication
- Scaffold a Next.js API route at `app/api/beehiiv/subscribe/route.ts`

### 2. Set your environment variable

Add your API key to `.env.local`:

```bash
BEEHIIV_API_KEY=your_api_key_here
```

### 3. Add the subscription form

```tsx
import { SubscriptionForm } from 'beehiiv-react';

export default function Newsletter() {
  return (
    <SubscriptionForm
      endpoint="/api/beehiiv/subscribe"
      buttonText="Join Newsletter"
      utmSource="website"
      onSuccess={() => console.log('Subscribed!')}
    />
  );
}
```

## Authentication

### API Key (default)

Provide your beehiiv API key in one of these ways:

1. **Environment variable** (recommended): `BEEHIIV_API_KEY` in `.env.local`
2. **CLI flag**: `npx beehiiv-react init --api-key YOUR_KEY`
3. **Interactive prompt**: run `npx beehiiv-react init` and paste when prompted

### OAuth2

Use the `--oauth` flag for browser-based authorization:

```bash
npx beehiiv-react init --oauth
```

This opens your browser to authorize the app and stores tokens in `.env.local`.

## Generated Files

After running `npx beehiiv-react init`, these files are created in your project:

| File | Purpose |
|---|---|
| `beehiiv.config.ts` | Publication ID, name, and SDK config |
| `types/beehiiv.generated.ts` | Strongly-typed custom field names and values |
| `app/api/beehiiv/subscribe/route.ts` | Next.js API route for subscription management |

## Syncing Custom Fields

When you add or modify custom fields in beehiiv, re-run:

```bash
npx beehiiv-react sync
```

This regenerates `types/beehiiv.generated.ts` with updated field names and types.

## API Client

The `BeehiivClient` is a server-side API client for direct beehiiv API access:

```ts
import { BeehiivClient } from 'beehiiv-react';

const client = new BeehiivClient({
  apiKey: process.env.BEEHIIV_API_KEY!,
  publicationId: 'pub_xxxxx',
});

// Create a subscription
const sub = await client.subscriptions.create({
  email: 'user@example.com',
  utm_source: 'api',
  send_welcome_email: true,
  custom_fields: [
    { name: 'Company', value: 'Acme Inc.' },
  ],
});

// List subscriptions
const list = await client.subscriptions.list({ limit: 10 });

// Get publication info
const pub = await client.publications.get();
```

### Available Endpoints

| Endpoint | Methods |
|---|---|
| `client.subscriptions` | `create`, `list`, `getByEmail`, `getById`, `updateById`, `updateByEmail`, `delete` |
| `client.customFields` | `list`, `get`, `create`, `update`, `delete` |
| `client.publications` | `list`, `get` |
| `client.posts` | `list`, `get`, `create`, `update`, `delete` |

## React Hooks

### `useSubscribe`

Manages email subscription state and submission:

```tsx
import { useSubscribe } from 'beehiiv-react';

function NewsletterForm() {
  const { subscribe, isLoading, isSuccess, error } = useSubscribe({
    endpoint: '/api/beehiiv/subscribe',
    utmSource: 'website',
    onSuccess: (data) => console.log('Subscribed!', data),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = new FormData(e.currentTarget).get('email') as string;
      subscribe(email);
    }}>
      <input name="email" type="email" required />
      <button disabled={isLoading}>
        {isLoading ? 'Subscribing...' : 'Subscribe'}
      </button>
      {isSuccess && <p>Thanks for subscribing!</p>}
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### `useSubscription`

Fetch subscription data by email or ID:

```tsx
import { useSubscription } from 'beehiiv-react';

function SubscriberInfo({ email }: { email: string }) {
  const { subscription, isLoading, error } = useSubscription(email);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!subscription) return <p>Not found</p>;

  return <p>Status: {subscription.status}, Tier: {subscription.tier}</p>;
}
```

### `useCustomFields`

Fetch custom field definitions:

```tsx
import { useCustomFields } from 'beehiiv-react';

function FieldList() {
  const { customFields, isLoading } = useCustomFields();

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {customFields.map((field) => (
        <li key={field.id}>{field.display} ({field.kind})</li>
      ))}
    </ul>
  );
}
```

### `BeehiivProvider`

Wrap your app to provide context to hooks:

```tsx
import { BeehiivProvider } from 'beehiiv-react';

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <BeehiivProvider publicationId="pub_xxxxx" apiBaseUrl="/api/beehiiv">
      {children}
    </BeehiivProvider>
  );
}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BEEHIIV_API_KEY` | Yes | Your beehiiv API key (server-side only) |

## TypeScript

All types are exported from the main package entry:

```ts
import type {
  SubscriptionInfo,
  CreateSubscriptionRequest,
  CustomFieldInfo,
  PostInfo,
  WebhookPayload,
  BeehiivApiConfig,
} from 'beehiiv-react';
```

## License

MIT
