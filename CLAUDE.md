# CLAUDE.md -- beehiiv-react

> This file is the authoritative reference for the `beehiiv-react` package architecture. Read it before making any changes.

## Project Overview

`beehiiv-react` is a hybrid npm package that provides:

1. **A typed API client** (`BeehiivClient`) for the beehiiv API v2 (server-side only) with 14 endpoint namespaces: `subscriptions`, `customFields`, `publications`, `posts`, `webhooks`, `segments`, `automations`, `referrals`, `automationJourneys`, `tiers`, `authors`, `bulkSubscriptions`, `bulkSubscriptionUpdates`, `engagements`
2. **React hooks** (`useSubscribe`, `useSubscription`, `useCustomFields`, `usePosts`, `usePost`, `useSubscriberAccess`, `usePostAccess`, `useSubscriberProfile`, `useSubscriberTier`, `useSubscribers`, `usePublications`) for client-side state management -- 22 hooks total (including `useBeehiiv`)
3. **Drop-in React components** (`SubscriptionForm`, `BeehiivProvider`, `PostCard`, `PostList`, `PostContentRenderer`, `GatedContent`, `PremiumContent`, `SubscriberBadge`, `TierBadge`) for common UI patterns
4. **Utility functions** (`canViewContent`, `getAudienceLabel`, `getTierLabel`) for subscriber access resolution
5. **A CLI tool** (`npx beehiiv-react init/sync`) that scaffolds config, types, and API routes into a Next.js project
6. **A TanStack Query adapter** (`beehiiv-react/query`) providing `useQuery`/`useMutation` hooks with cache key factories
7. **React Server Component utilities** (`beehiiv-react/server`) providing `createBeehiivClient` and pure async data-fetching functions

The package targets React 18+ and Next.js 13+ (App Router) projects using TypeScript.

---

## Package Architecture

```
beehiiv-react/
├── src/
│   ├── index.ts                    # Public package exports (main entry)
│   ├── types/                      # TypeScript type definitions (beehiiv API v2)
│   │   ├── common.ts               # Shared types: config, pagination, errors
│   │   ├── custom-field.ts          # Custom field definitions and values
│   │   ├── subscription.ts          # Subscription CRUD types
│   │   ├── publication.ts           # Publication types
│   │   ├── post.ts                  # Post/newsletter types (PostContent discriminated union, PostAudience, etc.)
│   │   ├── webhook.ts               # Webhook event types and payloads
│   │   ├── segment.ts               # Segment types, member responses, filter options
│   │   ├── automation.ts            # Automation types, journey types, trigger/step types
│   │   ├── referral.ts              # Referral program types, milestone rewards, subscriber stats
│   │   ├── automation-journey.ts    # Automation journey types and responses
│   │   ├── access.ts                # AccessResult, UseSubscriberAccessOptions, UsePostAccessOptions
│   │   └── index.ts                 # Re-exports all types
│   ├── client/                      # Server-side API client
│   │   ├── index.ts                 # BeehiivClient class (main entry)
│   │   ├── rate-limiter.ts          # Token-bucket rate limiter
│   │   └── endpoints/               # Per-resource endpoint classes
│   │       ├── subscriptions.ts     # Subscription CRUD
│   │       ├── custom-fields.ts     # Custom field CRUD
│   │       ├── publications.ts      # Publication read
│   │       ├── posts.ts             # Post CRUD
│   │       ├── webhooks.ts          # Webhook CRUD + test endpoint
│   │       ├── segments.ts          # Segment list/get/delete/recalculate/listMembers
│   │       ├── automations.ts       # Automation list/get/create + journey listing
│   │       ├── referrals.ts         # Referral program, milestones, subscriber stats
│       └── automation-journeys.ts # Automation journey create/get
│   ├── hooks/                       # React hooks (client-side)
│   │   ├── index.ts                 # Re-exports all hooks
│   │   ├── useBeehiiv.ts            # Context access hook
│   │   ├── useSubscribe.ts          # Email subscription hook
│   │   ├── useSubscription.ts       # Subscription data fetching hook
│   │   ├── useCustomFields.ts       # Custom fields fetching hook
│   │   ├── usePosts.ts              # Paginated post list with filters
│   │   ├── usePost.ts               # Single post by ID
│   │   ├── useSubscriberAccess.ts   # Subscriber tier/status -> access result
│   │   ├── usePostAccess.ts         # Combined post + subscriber access check
│   │   ├── useSubscriberProfile.ts  # Full subscriber profile with isPremium/isActive flags
│   │   ├── useSubscriberTier.ts     # Lightweight tier-only hook
│   │   ├── useSubscribers.ts        # Paginated subscriber list
│   │   └── usePublications.ts       # All accessible publications
│   ├── components/                  # React components
│   │   ├── index.ts                 # Re-exports all components
│   │   ├── BeehiivProvider.tsx      # React context provider
│   │   ├── SubscriptionForm.tsx     # Drop-in subscription form
│   │   ├── PostCard.tsx             # Single post card display
│   │   ├── PostList.tsx             # Paginated post list with load-more
│   │   ├── PostContentRenderer.tsx  # HTML/JSON content renderer
│   │   ├── GatedContent.tsx         # Declarative subscriber-gated content wrapper
│   │   ├── PremiumContent.tsx       # Premium content gate with upgrade prompt
│   │   └── SubscriberBadge.tsx      # Subscriber tier badge with headless renderBadge prop
│   ├── utils/                       # Pure utility functions
│   │   ├── index.ts                 # Re-exports all utilities
│   │   └── access.ts               # canViewContent, getAudienceLabel, getTierLabel
│   ├── query/                       # TanStack Query adapter (sub-path: beehiiv-react/query)
│   │   ├── index.ts                 # Re-exports keys, query hooks, mutation hooks
│   │   ├── keys.ts                  # Query key factory (beehiivKeys)
│   │   ├── hooks.ts                 # useQuery-based hooks (usePostsQuery, useSubscribersQuery, etc.)
│   │   └── mutations.ts             # useMutation-based hooks (useSubscribeMutation, etc.)
│   ├── server/                      # RSC utilities (sub-path: beehiiv-react/server)
│   │   ├── index.ts                 # Re-exports client factory + fetchers
│   │   ├── client.ts                # createBeehiivClient() factory (reads env vars)
│   │   └── fetchers.ts              # Pure async fetchers: fetchPosts, fetchPost, fetchSubscribers,
│   │                                #   fetchSubscription, fetchPublications, fetchCustomFields,
│   │                                #   fetchWebhooks, fetchSegments
│   └── cli/                         # CLI tool (Node.js)
│       ├── index.ts                 # Commander.js program setup
│       ├── auth/
│       │   ├── oauth.ts             # OAuth2 PKCE flow
│       │   └── api-key.ts           # API key prompt + validation
│       ├── commands/
│       │   ├── init.ts              # `beehiiv-react init` command
│       │   └── sync.ts              # `beehiiv-react sync` command
│       ├── generators/
│       │   ├── config.ts            # Renders beehiiv.config.ts
│       │   ├── custom-fields.ts     # Renders typed custom fields
│       │   ├── api-routes.ts        # Renders Next.js API routes
│       │   ├── server-actions.ts    # Renders Next.js Server Actions
│       │   ├── analytics.ts         # Renders analytics/dataLayer tracking
│       │   ├── hooks.ts             # Renders subscriber status hook
│       │   └── subscribe-components.ts # Renders subscribe flow components
│       └── prompts/
│           └── index.ts             # Interactive inquirer prompts
├── templates/                       # Handlebars templates for code generation
│   ├── config.ts.hbs                # beehiiv.config.ts template
│   ├── custom-fields.ts.hbs         # Custom field types template
│   ├── api-route.ts.hbs             # Next.js API route template
│   ├── server-action.ts.hbs         # Next.js Server Action template
│   ├── analytics.ts.hbs             # Analytics/dataLayer template
│   ├── posts-route.ts.hbs           # Posts API route template
│   ├── subscribe-cta.tsx.hbs        # Subscribe CTA component template
│   ├── subscribe-step-two.tsx.hbs   # Subscribe step-two component template
│   ├── subscribe-wrapper.tsx.hbs    # Subscribe wrapper component template
│   └── use-subscriber-status.ts.hbs # Subscriber status hook template
├── package.json
├── tsconfig.json
├── tsup.config.ts                   # Multi-entry build: library + query + server + CLI
├── vitest.config.ts                 # Test config with jsdom environment
├── .eslintrc.json
├── .github/workflows/ci.yml         # GitHub Actions CI
├── CHANGELOG.md                     # Version history
├── CLAUDE.md                        # This file
└── README.md                        # User-facing documentation
```

---

## Sub-Path Exports

The package exposes 3 import paths via the `exports` field in `package.json`:

| Import Path | Entry Point | Description |
|---|---|---|
| `beehiiv-react` | `src/index.ts` | Main SDK: client, hooks, components, types |
| `beehiiv-react/query` | `src/query/index.ts` | TanStack Query v5 adapter (optional peer dep) |
| `beehiiv-react/server` | `src/server/index.ts` | RSC-compatible helpers (no React hooks) |

---

## Key Design Decisions

### Server-Side Only API Client
The `BeehiivClient` requires an API key and must only run server-side. It should never be imported in client components. The hooks communicate with beehiiv through a Next.js API route proxy that the CLI generates.

### Generated Types
The `sync` command fetches custom field definitions from the beehiiv API and generates a TypeScript file with strongly-typed field names and value types. This means IDE autocomplete works for custom fields specific to each publication.

### Multi-Entry Build Output
tsup produces four separate builds:
- **Library** (`dist/index.js` + `dist/index.mjs` + `dist/index.d.ts`): ESM and CJS for the SDK, with React as an external dependency
- **Query adapter** (`dist/query/index.js` + `dist/query/index.mjs` + `dist/query/index.d.ts`): ESM and CJS, with React and @tanstack/react-query as external dependencies
- **Server utilities** (`dist/server/index.js` + `dist/server/index.mjs` + `dist/server/index.d.ts`): ESM and CJS, with React as an external dependency
- **CLI** (`dist/cli/index.js`): CJS only, bundles all dependencies, includes `#!/usr/bin/env node` shebang

### Rate Limiting
The client includes a built-in rate limiter (token-bucket algorithm) to stay within beehiiv's 180 requests/minute limit. This is configurable via `rateLimitPerMinute` in the client config.

---

## Client Endpoints (14 total)

| Namespace | Resource | Key Methods |
|---|---|---|
| `subscriptions` | Subscribers | `list`, `getByEmail`, `getById`, `create`, `updateById`, `updateByEmail`, `delete` |
| `customFields` | Custom Fields | `list`, `get`, `create`, `update`, `delete` |
| `publications` | Publications | `list`, `get` |
| `posts` | Posts | `list`, `get`, `create`, `update`, `delete`, `aggregateStats` |
| `webhooks` | Webhooks | `list`, `get`, `create`, `update`, `delete`, `test` |
| `segments` | Segments | `list`, `get`, `delete`, `recalculate`, `listMembers` |
| `automations` | Automations | `list`, `get`, `create`, `listJourneys`, `listEmails` |
| `referrals` | Referrals | `getProgram`, `listMilestones`, `getSubscriberStats` |
| `automationJourneys` | Automation Journeys | `create`, `get` |
| `tiers` | Tiers | `list`, `get`, `create`, `update` |
| `authors` | Authors | `list`, `get` |
| `bulkSubscriptions` | Bulk Subscriptions | `create` |
| `bulkSubscriptionUpdates` | Bulk Updates | `list`, `get`, `updateFields`, `updateStatus` |
| `engagements` | Engagements | `get` |

---

## React Hooks (22 total)

| Hook | Description |
|---|---|
| `useBeehiiv` | Context access (publication ID, API URL) |
| `useSubscribe` | Email subscription with custom fields |
| `useSubscription` | Fetch subscription data by email/ID |
| `useCustomFields` | Fetch custom field definitions |
| `usePosts` | Paginated post list with filters |
| `usePost` | Single post by ID |
| `useSubscriberAccess` | Subscriber tier/status to access result |
| `usePostAccess` | Combined post + subscriber access check |
| `useSubscriberProfile` | Full subscriber profile with isPremium/isActive |
| `useSubscriberTier` | Lightweight tier-only hook |
| `useSubscribers` | Paginated subscriber list |
| `usePublications` | All accessible publications |
| `useTiers` | Paginated tier list with type/active filtering |
| `useTier` | Single tier by ID |
| `useAuthors` | Paginated author list |
| `useAuthor` | Single author by ID |
| `useBulkUpdateJob` | Track bulk update job with polling |
| `useEngagements` | Engagement metrics by date range |
| `useAutomations` | Paginated automation list and single automation |
| `useWebhooks` | Paginated webhook list and single webhook |
| `useSegments` | Paginated segment list and single segment |
| `useReferrals` | Referral program and subscriber stats |

---

## Authentication Strategy

### Default: API Key
Users provide their beehiiv API key via:
1. `BEEHIIV_API_KEY` environment variable (recommended)
2. `--api-key` CLI flag
3. Interactive prompt during `beehiiv-react init`

### Alternative: OAuth2 (via `--oauth` flag)
When `beehiiv-react init --oauth` is used:
1. CLI opens the user's browser to beehiiv's OAuth authorization page
2. A local HTTP server receives the authorization code callback
3. The code is exchanged for access + refresh tokens using PKCE
4. Tokens are stored in `.env.local`

---

## Custom Field Type Mapping

| beehiiv Kind | TypeScript Type | Notes |
|---|---|---|
| `string` | `string` | |
| `integer` | `number` | |
| `double` | `number` | |
| `boolean` | `boolean` | |
| `date` | `string` | ISO 8601 date string |
| `datetime` | `string` | ISO 8601 datetime string |
| `list` | `string[]` | Array of selected option values |

---

## Build Commands

| Command | Description |
|---|---|
| `npm run build` | Build library + query + server + CLI with tsup |
| `npm run dev` | Watch mode build |
| `npm run typecheck` | Run `tsc --noEmit` (type checking only) |
| `npm run lint` | ESLint on `src/` |
| `npm run test` | Run vitest |
| `npm run test:watch` | Run vitest in watch mode |
| `npm run test:coverage` | Run vitest with V8 coverage |

### How tsup Works
The `tsup.config.ts` defines four build entries:
1. `src/index.ts` -> `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts` (types)
2. `src/query/index.ts` -> `dist/query/index.js` (ESM) + `dist/query/index.cjs` (CJS) + `dist/query/index.d.ts` (types)
3. `src/server/index.ts` -> `dist/server/index.js` (ESM) + `dist/server/index.cjs` (CJS) + `dist/server/index.d.ts` (types)
4. `src/cli/index.ts` -> `dist/cli/index.js` (CJS with shebang)

React and react-dom are externalized from the library build. @tanstack/react-query is additionally externalized from the query build. CLI bundles all dependencies.

---

## Posts & Content Visibility (v0.2.0)

### Post Hooks

- **`usePosts(options)`** -- Paginated post list with `audience`, `status`, `orderBy`, `direction` filters. Returns `{ posts, isLoading, error, hasMore, loadMore }` with page-based pagination.
- **`usePost({ id })`** -- Fetches a single post by ID. Returns `{ post, isLoading, error }`.

Both hooks use `useBeehiiv()` for the API base URL and follow the same loading/error state pattern as existing hooks.

### Post Components

- **`PostCard`** -- Renders a single post with thumbnail, audience badge, title, subtitle, and publish date. Supports headless mode via `renderCard` prop.
- **`PostList`** -- Renders a paginated list of `PostCard` items with load-more button, skeleton loading states, and empty state.
- **`PostContentRenderer`** -- Renders the body of a post. Supports HTML (via `dangerouslySetInnerHTML` with optional `sanitizeHtml` callback) and JSON (via `renderJsonContent` callback or `<pre>` fallback). Named `PostContentRenderer` (not `PostContent`) to avoid collision with the `PostContent` type from `src/types/post.ts`.

### Access & Content Gating

- **`canViewContent(tier, status, audience)`** -- Pure utility function that resolves whether a subscriber can view content for a given audience. Lives in `src/utils/access.ts`.
- **`useSubscriberAccess({ email, audience })`** -- Hook that fetches subscriber info and resolves access via `canViewContent`. Returns `AccessResult` with `canView`, `tier`, `isActive`, `isLoading`.
- **`usePostAccess({ postId, email })`** -- Combines `usePost` and `useSubscriberAccess` to return `{ post, canView, isLoading }`.
- **`GatedContent`** -- Declarative component wrapping children behind an audience check. Renders `fallback` for unauthorized users and `loading` during resolution.
- **`PremiumContent`** -- Opinionated wrapper around `GatedContent` with `audience="premium"` and an `upgradePrompt` render prop.

---

## Subscriber Profiles (v0.2.1)

### Hooks

- **`useSubscriberProfile({ email?, id?, enabled? })`** -- Resolves a subscriber's full profile from their email or subscription ID. Returns the raw `SubscriptionInfo` record alongside pre-computed `isPremium`, `isActive`, and `tier` flags.
- **`useSubscriberTier({ email?, id?, enabled? })`** -- Lightweight alias over `useSubscriberProfile` that strips the `subscription` record and returns only tier/status/flags.

### Component

- **`SubscriberBadge`** -- Drop-in badge component that renders "Premium" or "Free" based on a subscriber's resolved tier. Supports a headless `renderBadge` render prop for fully custom rendering.

---

## v0.3.0 New Features

### New Endpoints (webhooks, segments, automations, referrals)

Four new endpoint namespaces were added to `BeehiivClient`, providing full beehiiv API v2 coverage:

- **WebhooksEndpoint** -- CRUD for webhook endpoints plus a test trigger
- **SegmentsEndpoint** -- List/get/delete segments, recalculate, list segment members
- **AutomationsEndpoint** -- List/get/create automations, list automation journeys
- **ReferralsEndpoint** -- Get referral program, list milestones, get subscriber referral stats

### New Hooks (useSubscribers, usePublications)

- **`useSubscribers(options)`** -- Paginated subscriber list with filtering. Returns `{ data, loading, error, page, nextPage, prevPage }`.
- **`usePublications()`** -- Fetches all accessible publications. Returns `{ data, loading, error }`.

### TanStack Query Adapter (`beehiiv-react/query`)

Sub-path export providing:
- `beehiivKeys` -- Query key factory for cache management
- Query hooks: `usePostsQuery`, `usePostQuery`, `useSubscribersQuery`, `useSubscriptionQuery`, `usePublicationsQuery`, `useCustomFieldsQuery`, `useAutomationsQuery`
- Mutation hooks: `useSubscribeMutation`, `useCreateWebhookMutation`, etc.

Requires `@tanstack/react-query` >= 5.0.0 as a peer dependency.

### Server Utilities (`beehiiv-react/server`)

Sub-path export providing RSC-compatible helpers:
- `createBeehiivClient()` -- Factory that reads `BEEHIIV_API_KEY` from environment
- Pure async fetchers: `fetchPosts`, `fetchPost`, `fetchSubscribers`, `fetchSubscription`, `fetchPublications`, `fetchCustomFields`, `fetchWebhooks`, `fetchSegments`

These functions are safe to call inside React Server Components, Route Handlers, and Server Actions.

---

## v0.3.13-v0.3.14 Fixes (ported into v0.4.0)

### v0.3.13 -- Template Import Path + UTM Fields
- All CLI-generated templates now import `BeehiivClient` from `beehiiv-react/server` (was incorrectly `beehiiv-react`)
- Generated `subscribeAction` accepts and passes through UTM attribution fields: `utmSource`, `utmMedium`, `utmChannel`, `utmCampaign`, `referringSite`, `reactivateExisting`
- `utm_channel` added to `SubscriptionInfo` and `CreateSubscriptionRequest` types

### v0.3.14 -- Defensive usePosts Pagination
- `usePosts` hook handles API responses with missing `data` or `pagination` fields gracefully
- Response type fields changed from required to optional with null-coalescing defaults
- Prevents runtime crashes when the beehiiv API returns incomplete responses

### Response Unwrapping Fix (v0.4.0)
- Generated `subscribeAction` server action now returns `response.data` (the `SubscriptionInfo` record) instead of the raw `SubscriptionResponse` wrapper, so consumers can use `sub.id` directly
- Generated API routes no longer double-wrap responses in `{ data: { data: ... } }`; SDK response objects are passed through directly

---


## v0.5.0 -- Tiers, Authors, Bulk Subscriptions, Engagements, Hook Infill

### New Endpoint Namespaces

| Namespace | Resource | Key Methods | Endpoints |
|---|---|---|---|
| `tiers` | Tiers | `list`, `get`, `create`, `update` | 4 |
| `authors` | Authors | `list`, `get` | 2 |
| `bulkSubscriptions` | Bulk Subscriptions | `create` | 1 |
| `bulkSubscriptionUpdates` | Bulk Updates | `list`, `get`, `updateFields`, `updateStatus` | 4 |
| `engagements` | Engagements | `get` | 1 |

Total new endpoints: **12** (was 38/72, now ~50/72 beehiiv API v2 coverage).

### Modified Endpoints

- **`subscriptions.addTags()`** -- New method on SubscriptionsEndpoint for adding tags to a subscriber.
- **`segments.listIds()`** -- New method on SegmentsEndpoint for fetching subscriber IDs (lightweight alternative to `listMembers`).

### New React Hooks (10 total, bringing total to 22)

| Hook | Description |
|---|---|
| `useTiers` | Paginated tier list with filtering |
| `useTier` | Single tier by ID |
| `useAuthors` | Paginated author list |
| `useAuthor` | Single author by ID |
| `useBulkUpdateJob` | Track bulk update job status with polling |
| `useEngagements` | Engagement metrics by date range |
| `useAutomations` | Paginated automation list + single automation |
| `useWebhooks` | Paginated webhook list + single webhook |
| `useSegments` | Paginated segment list + single segment |
| `useReferrals` | Referral program data and subscriber stats |

### New Component

- **`TierBadge`** -- Renders a badge showing the tier name and type (free/premium). Supports headless `renderBadge` render prop.

### New TanStack Query Adapters

Query hooks added to `beehiiv-react/query`:
- Tiers: `useTiersQuery`, `useTierQuery`, `useCreateTierMutation`, `useUpdateTierMutation`
- Authors: `useAuthorsQuery`, `useAuthorQuery`
- Bulk: `useBulkSubscribeMutation`, `useBulkUpdateFieldsMutation`, `useBulkUpdateStatusMutation`, `useAddTagsMutation`
- Engagements: `useEngagementsQuery`
- Automations: `useAutomationsQuery`, `useAutomationQuery`, `useCreateAutomationJourneyMutation`
- Webhooks: `useWebhooksQuery`, `useWebhookQuery`, `useCreateWebhookMutation`, `useUpdateWebhookMutation`, `useDeleteWebhookMutation`
- Segments: `useSegmentsQuery`, `useSegmentQuery`, `useSegmentResultsQuery`, `useCreateSegmentMutation`, `useDeleteSegmentMutation`, `useRecalculateSegmentMutation`
- Referrals: `useReferralsQuery`

### New Server Fetchers

Added to `beehiiv-react/server`:
- `fetchTiers(client, options?)` / `fetchTier(client, tierId)`
- `fetchAuthors(client, options?)` / `fetchAuthor(client, authorId)`
- `fetchEngagements(client, params)`

### New Key Factories

`beehiivKeys` now includes: `tiers`, `authors`, `bulkSubscriptions`, `bulkSubscriptionUpdates`, `engagements`.
Existing factories enhanced: `webhooks.detail`, `segments.detail`, `segments.results`, `automations.detail`.

---

## How to Add a New Endpoint

1. Create types in `src/types/` (e.g., `src/types/automation.ts`)
2. Export types from `src/types/index.ts`
3. Create endpoint class in `src/client/endpoints/` (e.g., `src/client/endpoints/automations.ts`)
4. Add the endpoint to `BeehiivClient` in `src/client/index.ts`:
   ```ts
   public readonly automations: AutomationsEndpoint;
   // in constructor:
   this.automations = new AutomationsEndpoint(httpClient, this._config.publicationId);
   ```

All endpoint constructors accept an optional `defaultPublicationId` second argument.
When provided (typically by `BeehiivClient`), every method supports dual signatures:
`method(data)` (uses default) or `method(pubId, data)` (explicit override).
5. Re-export new types from `src/index.ts`
6. Add tests in `src/client/__tests__/endpoints/`
7. If adding a server fetcher, add to `src/server/fetchers.ts` and re-export from `src/server/index.ts`

---

## How to Add a New Hook

1. Create the hook in `src/hooks/` (e.g., `src/hooks/useAutomations.ts`)
2. Export from `src/hooks/index.ts`
3. Re-export from `src/index.ts`
4. Add tests in `src/hooks/__tests__/`
5. Hooks should:
   - Use `useBeehiiv()` to get the API base URL
   - Manage loading/error/data state internally
   - Return a typed result interface
   - Accept configuration options

## How to Add a New Utility

1. Create the utility function in `src/utils/` (e.g., `src/utils/formatting.ts`)
2. Export from `src/utils/index.ts`
3. Re-export from `src/index.ts`
4. Add tests in `src/__tests__/utils/`
5. Utilities should be pure functions with no React dependencies -- they are usable on both client and server

---

## How to Update Generators

1. Edit the Handlebars template in `templates/`
2. Update the generator function in `src/cli/generators/`
3. If you add new template variables, update the generator's data interface
4. Handlebars helpers are registered in the generator (e.g., `camelCase`, `tsType`)
5. Test by running `npx beehiiv-react init` in a fresh project

---

## How to Run Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

Tests use vitest with jsdom for component/hook testing. The test environment is configured in `vitest.config.ts`.

### Test file conventions:
- Unit tests: `src/**/__tests__/*.test.ts`
- Component tests: `src/**/__tests__/*.test.tsx`
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for user interaction tests

---

## CI Requirements

The GitHub Actions CI workflow (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. `npm ci` - Install dependencies
2. `npm run lint` - ESLint checks
3. `npm run typecheck` - TypeScript type checking
4. `npm run test` - Vitest tests
5. `npm run build` - tsup build

All steps must pass for the CI to be green. The `prepublishOnly` script also runs build, typecheck, and test before any `npm publish`.

---

## v0.4.0 Test Summary

**497 tests passing** across 44 test files. Key new test files:

- `src/client/__tests__/endpoints/webhooks.test.ts` -- 10 tests
- `src/client/__tests__/endpoints/segments.test.ts` -- 11 tests
- `src/client/__tests__/endpoints/automations.test.ts` -- 9 tests
- `src/client/__tests__/endpoints/referrals.test.ts` -- 5 tests
- `src/hooks/__tests__/useSubscribers.test.tsx` -- 6 tests
- `src/hooks/__tests__/usePublications.test.tsx` -- 7 tests
- `src/query/__tests__/hooks.test.tsx` -- 9 tests
- `src/query/__tests__/keys.test.ts` -- 22 tests
- `src/query/__tests__/mutations.test.tsx` -- 5 tests
- `src/server/__tests__/client.test.ts` -- 7 tests
- `src/server/__tests__/fetchers.test.ts` -- 13 tests

### Build Output (v0.3.0)

```
dist/
  index.js          (CJS, ~69 KB)
  index.mjs         (ESM, ~67 KB)
  index.d.ts        (DTS, ~113 KB)
  index.d.mts       (DTS, ~113 KB)
  query/
    index.js        (CJS, ~10 KB)
    index.mjs       (ESM, ~10 KB)
    index.d.ts      (DTS, ~24 KB)
    index.d.mts     (DTS, ~24 KB)
  server/
    index.js        (CJS, ~34 KB)
    index.mjs       (ESM, ~34 KB)
    index.d.ts      (DTS, ~62 KB)
    index.d.mts     (DTS, ~62 KB)
  cli/
    index.js        (CJS, ~29 KB)
```

## Type Generation

This project uses **openapi-typescript** to auto-generate TypeScript types from the official beehiiv OpenAPI specification.

### How it works

- **Source spec:** The beehiiv API specification is maintained by beehiiv and hosted on their Fern documentation CDN. A local copy is vendored at `src/types/beehiiv-api-spec.yaml` for deterministic builds.
- **Generated file:** `src/types/beehiiv-api.generated.ts` — contains all request/response schemas, enums, and path types extracted from the OpenAPI spec. **Do not edit this file by hand.**
- **Hand-written types:** Files in `src/types/` (e.g. `post.ts`, `subscription.ts`) re-export or extend generated types where there is overlap. Types that are SDK-specific (config objects, pagination wrappers, component props) remain hand-written.

### Commands

```bash
# Regenerate types from the local spec copy
npm run generate:types

# Check if beehiiv has published a new spec (exits 0 if found, 1 if not)
npm run check:spec
```

### Updating the spec

1. Run `npm run check:spec` to verify beehiiv still publishes a spec
2. Download the latest spec and replace `src/types/beehiiv-api-spec.yaml`
3. Run `npm run generate:types`
4. Run `npm run build` and `npm test` to verify compatibility
5. If the generated types changed in ways that break hand-written types, update the re-exports in the corresponding `src/types/*.ts` files

### Automated sync

A GitHub Actions workflow (`.github/workflows/sync-api-types.yml`) runs weekly on Mondays at 09:00 UTC. It regenerates types from the spec, runs the build and tests, and opens a PR if anything changed. The workflow can also be triggered manually via the Actions tab.

### Architecture decisions

- **`PostAudience` includes `'all'`:** The upstream spec defines `PostAudience` as `"free" | "premium" | "both"`. This SDK extends it with `| 'all'` as a convenience alias used internally by access-resolution utilities. The API itself never returns `'all'`.
- **Nullable fields:** The generated types mark many response fields as `optional | null` per the OpenAPI spec. Hand-written SDK types may use stricter signatures where the API is known to always return a value.
- **Local spec vendoring:** The spec YAML is committed to the repo rather than fetched at build time, so builds are reproducible even if the CDN URL changes.
