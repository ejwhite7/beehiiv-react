# CLAUDE.md — beehiiv-react

> This file is the authoritative reference for the `beehiiv-react` package architecture. Read it before making any changes.

## Project Overview

`beehiiv-react` is a hybrid npm package that provides:

1. **A typed API client** (`BeehiivClient`) for the beehiiv API v2 (server-side only)
2. **React hooks** (`useSubscribe`, `useSubscription`, `useCustomFields`, `usePosts`, `usePost`, `useSubscriberAccess`, `usePostAccess`) for client-side state management
3. **Drop-in React components** (`SubscriptionForm`, `BeehiivProvider`, `PostCard`, `PostList`, `PostContentRenderer`, `GatedContent`, `PremiumContent`) for common UI patterns
4. **Utility functions** (`canViewContent`, `getAudienceLabel`, `getTierLabel`) for subscriber access resolution
5. **A CLI tool** (`npx beehiiv-react init/sync`) that scaffolds config, types, and API routes into a Next.js project

The package targets React 18+ and Next.js 13+ (App Router) projects using TypeScript.

---

## Package Architecture

```
beehiiv-react/
├── src/
│   ├── index.ts                    # Public package exports
│   ├── types/                      # TypeScript type definitions (beehiiv API v2)
│   │   ├── common.ts               # Shared types: config, pagination, errors
│   │   ├── custom-field.ts          # Custom field definitions and values
│   │   ├── subscription.ts          # Subscription CRUD types
│   │   ├── publication.ts           # Publication types
│   │   ├── post.ts                  # Post/newsletter types (PostContent discriminated union, PostAudience, etc.)
│   │   ├── webhook.ts               # Webhook event types
│   │   ├── access.ts                # AccessResult, UseSubscriberAccessOptions, UsePostAccessOptions
│   │   └── index.ts                 # Re-exports all types
│   ├── client/                      # Server-side API client
│   │   ├── index.ts                 # BeehiivClient class (main entry)
│   │   ├── rate-limiter.ts          # Token-bucket rate limiter
│   │   └── endpoints/               # Per-resource endpoint classes
│   │       ├── subscriptions.ts     # Subscription CRUD
│   │       ├── custom-fields.ts     # Custom field CRUD
│   │       ├── publications.ts      # Publication read
│   │       └── posts.ts             # Post CRUD
│   ├── hooks/                       # React hooks (client-side)
│   │   ├── index.ts                 # Re-exports all hooks
│   │   ├── useBeehiiv.ts            # Context access hook
│   │   ├── useSubscribe.ts          # Email subscription hook
│   │   ├── useSubscription.ts       # Subscription data fetching hook
│   │   ├── useCustomFields.ts       # Custom fields fetching hook
│   │   ├── usePosts.ts             # Paginated post list with filters
│   │   ├── usePost.ts              # Single post by ID
│   │   ├── useSubscriberAccess.ts  # Subscriber tier/status -> access result
│   │   └── usePostAccess.ts        # Combined post + subscriber access check
│   ├── components/                  # React components
│   │   ├── index.ts                 # Re-exports all components
│   │   ├── BeehiivProvider.tsx      # React context provider
│   │   ├── SubscriptionForm.tsx     # Drop-in subscription form
│   │   ├── PostCard.tsx             # Single post card display
│   │   ├── PostList.tsx             # Paginated post list with load-more
│   │   ├── PostContentRenderer.tsx  # HTML/JSON content renderer (renamed from PostContent to avoid type collision)
│   │   ├── GatedContent.tsx         # Declarative subscriber-gated content wrapper
│   │   └── PremiumContent.tsx       # Premium content gate with upgrade prompt
│   ├── utils/                       # Pure utility functions
│   │   ├── index.ts                 # Re-exports all utilities
│   │   └── access.ts               # canViewContent, getAudienceLabel, getTierLabel
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
│       │   └── server-actions.ts    # Renders Next.js Server Actions
│       └── prompts/
│           └── index.ts             # Interactive inquirer prompts
├── templates/                       # Handlebars templates for code generation
│   ├── config.ts.hbs                # beehiiv.config.ts template
│   ├── custom-fields.ts.hbs         # Custom field types template
│   ├── api-route.ts.hbs             # Next.js API route template
│   └── server-action.ts.hbs         # Next.js Server Action template
├── package.json
├── tsconfig.json
├── tsup.config.ts                   # Dual build: library (ESM+CJS) + CLI (CJS)
├── vitest.config.ts                 # Test config with jsdom environment
├── .eslintrc.json
├── .github/workflows/ci.yml         # GitHub Actions CI
├── CLAUDE.md                        # This file
└── README.md                        # User-facing documentation
```

---

## Key Design Decisions

### Server-Side Only API Client
The `BeehiivClient` requires an API key and must only run server-side. It should never be imported in client components. The hooks communicate with beehiiv through a Next.js API route proxy that the CLI generates.

### Generated Types
The `sync` command fetches custom field definitions from the beehiiv API and generates a TypeScript file with strongly-typed field names and value types. This means IDE autocomplete works for custom fields specific to each publication.

### Dual Build Output
tsup produces two separate builds:
- **Library** (`dist/index.js` + `dist/index.cjs` + `dist/index.d.ts`): ESM and CJS for the SDK, with React as an external dependency
- **CLI** (`dist/cli/index.js`): CJS only, bundles all dependencies, includes `#!/usr/bin/env node` shebang

### Rate Limiting
The client includes a built-in rate limiter (token-bucket algorithm) to stay within beehiiv's 180 requests/minute limit. This is configurable via `rateLimitPerMinute` in the client config.

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
| `npm run build` | Build library + CLI with tsup |
| `npm run dev` | Watch mode build |
| `npm run typecheck` | Run `tsc --noEmit` (type checking only) |
| `npm run lint` | ESLint on `src/` |
| `npm run test` | Run vitest |
| `npm run test:watch` | Run vitest in watch mode |
| `npm run test:coverage` | Run vitest with V8 coverage |

### How tsup Works
The `tsup.config.ts` defines two build entries:
1. `src/index.ts` -> `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts` (types)
2. `src/cli/index.ts` -> `dist/cli/index.js` (CJS with shebang)

React and react-dom are externalized from the library build but bundled in the CLI build (CLI doesn't use React).

---

## Posts & Content Visibility (v0.2.0)

### Post Hooks

- **`usePosts(options)`** -- Paginated post list with `audience`, `status`, `orderBy`, `direction` filters. Returns `{ posts, isLoading, error, hasMore, loadMore }` with cursor-based pagination.
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

## How to Add a New Endpoint

1. Create types in `src/types/` (e.g., `src/types/automation.ts`)
2. Export types from `src/types/index.ts`
3. Create endpoint class in `src/client/endpoints/` (e.g., `src/client/endpoints/automations.ts`)
4. Add the endpoint to `BeehiivClient` in `src/client/index.ts`:
   ```ts
   public readonly automations: AutomationsEndpoint;
   // in constructor:
   this.automations = new AutomationsEndpoint(this._config);
   ```
5. Re-export new types from `src/index.ts`
6. Add tests in `src/client/endpoints/__tests__/`

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

## Stage 3 Completion Notes (v0.1.0)

### Branch Merge Summary

All four feature branches were successfully merged into the `release/v0.1.0` branch:

1. `feature/hooks` (PR #1) -- BeehiivProvider, React hooks (useBeehiiv, useSubscribe, useSubscription, useCustomFields)
2. `feature/api-client` (PR #2) -- BeehiivClient, endpoint classes (subscriptions, custom-fields, publications, posts), rate limiter
3. `feature/components` (PR #3) -- SubscriptionForm with headless mode, Handlebars templates
4. `feature/cli` (PR #4) -- CLI init/sync commands, OAuth2 PKCE flow, API key auth, code generators

### Integration Issues Resolved

- **SubscriptionForm / useSubscribe mismatch**: The `SubscriptionForm` component was passing UTM parameters (`utmSource`, `utmMedium`, `utmCampaign`) in the `useSubscribe` options and calling `subscribe(email)` as a plain string. Fixed to pass UTM params via the `SubscribeData` object and call `subscribe({ email, customFields, utmSource, ... })` instead.
- **Template / generator field name mismatch**: The Handlebars templates from `feature/components` used `{{camelCaseKey}}` but the CLI generator from `feature/cli` only passed `camelCaseDisplay`. Added `camelCaseKey` to the generator's field template data.
- **Missing `generatedAt` template variable**: The custom-fields Handlebars template referenced `{{generatedAt}}` but the generator did not pass it. Added `generatedAt: new Date().toISOString()` to the template data.
- **ESLint `prefer-const` false positive**: The OAuth2 module declared `let timeoutHandle` which was flagged by ESLint's `prefer-const` rule, but `let` is required because the variable is assigned after declaration. Added an ESLint disable comment.
- **Unused import**: `waitFor` was imported but never used in `useSubscribe.test.tsx`. Removed the unused import.

### Final Test Count (v0.2.0)

**234 tests passing** across 23 test files:

- `src/client/__tests__/client.test.ts` -- 18 tests
- `src/client/__tests__/endpoints/custom-fields.test.ts` -- 9 tests
- `src/client/__tests__/endpoints/subscriptions.test.ts` -- 14 tests
- `src/client/__tests__/rate-limiter.test.ts` -- 8 tests
- `src/hooks/__tests__/BeehiivProvider.test.tsx` -- 4 tests
- `src/hooks/__tests__/useBeehiiv.test.tsx` -- 3 tests
- `src/hooks/__tests__/useCustomFields.test.tsx` -- 4 tests
- `src/hooks/__tests__/useSubscribe.test.tsx` -- 6 tests
- `src/hooks/__tests__/useSubscription.test.tsx` -- 5 tests
- `src/hooks/__tests__/usePosts.test.tsx` -- 6 tests
- `src/hooks/__tests__/usePost.test.tsx` -- 4 tests
- `src/__tests__/hooks/useSubscriberAccess.test.tsx` -- 8 tests
- `src/components/__tests__/SubscriptionForm.test.tsx` -- 29 tests
- `src/components/__tests__/templates.test.ts` -- 9 tests
- `src/components/__tests__/PostCard.test.tsx` -- 19 tests
- `src/components/__tests__/PostList.test.tsx` -- 15 tests
- `src/components/__tests__/PostContentRenderer.test.tsx` -- 9 tests
- `src/__tests__/components/GatedContent.test.tsx` -- 11 tests
- `src/__tests__/components/PremiumContent.test.tsx` -- 10 tests
- `src/__tests__/utils/access.test.ts` -- 26 tests
- `src/cli/__tests__/auth/api-key.test.ts` -- 5 tests
- `src/cli/__tests__/generators/config.test.ts` -- 3 tests
- `src/cli/__tests__/generators/custom-fields.test.ts` -- 9 tests

### Build Output Verified (v0.2.0)

```
dist/
  index.js        (CJS, 50.58 KB)
  index.mjs       (ESM, 49.24 KB)
  index.d.ts      (DTS, 74.70 KB)
  index.d.mts     (DTS, 74.70 KB)
  index.js.map
  index.mjs.map
  cli/
    index.js      (CJS, 29.24 KB)
    index.js.map
```

CLI help output confirmed working: `node dist/cli/index.js --help` prints Commander.js help with `init` and `sync` commands.


---

## Stage 4 Completion Notes (v0.2.0)

### Branch Merge Summary

Three feature branches were merged into the `feature/posts-visibility-v0.2.0` integration branch:

1. `feature/post-hooks` -- usePosts/usePost hooks, PostContent type (discriminated union), expanded ListPostsOptions, UTM field fixes
2. `feature/post-components` -- PostCard, PostList, PostContent (later renamed PostContentRenderer) components
3. `feature/content-gating` -- canViewContent utility, useSubscriberAccess/usePostAccess hooks, GatedContent/PremiumContent components

### Integration Issues Resolved

- **PostContent naming collision**: Agent B created a `PostContent` React component, but Agent A had already introduced a `PostContent` type (discriminated union for html/json content). The component was renamed to `PostContentRenderer` to avoid the collision, and all exports, imports, and tests were updated accordingly.
- **Merge conflicts**: The `feature/content-gating` branch conflicted with the merged `feature/post-hooks` + `feature/post-components` code in `src/index.ts`, `src/hooks/index.ts`, and `src/components/index.ts`. All three conflicts were resolved by combining both sets of exports.
- **Unused imports (lint errors)**: `SubscriptionTier` and `SubscriptionStatus` were imported but unused in `GatedContent.tsx` and `access.test.ts`. `waitFor` was unused in `GatedContent.test.tsx`. `PostAudience` was unused in `PostCard.test.tsx`. All removed.
- **New `src/utils/` directory**: Added by the content-gating branch for pure utility functions. tsup picks it up automatically since it bundles from the `src/index.ts` entry point which re-exports from `utils/index.ts`.
