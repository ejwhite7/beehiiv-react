# CLAUDE.md — beehiiv-react

> This file is the authoritative reference for the `beehiiv-react` package architecture. Read it before making any changes.

## Project Overview

`beehiiv-react` is a hybrid npm package that provides:

1. **A typed API client** (`BeehiivClient`) for the beehiiv API v2 (server-side only)
2. **React hooks** (`useSubscribe`, `useSubscription`, `useCustomFields`) for client-side state management
3. **Drop-in React components** (`SubscriptionForm`, `BeehiivProvider`) for common UI patterns
4. **A CLI tool** (`npx beehiiv-react init/sync`) that scaffolds config, types, and API routes into a Next.js project

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
│   │   ├── post.ts                  # Post/newsletter types
│   │   ├── webhook.ts               # Webhook event types
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
│   │   └── useCustomFields.ts       # Custom fields fetching hook
│   ├── components/                  # React components
│   │   ├── index.ts                 # Re-exports all components
│   │   ├── BeehiivProvider.tsx      # React context provider
│   │   └── SubscriptionForm.tsx     # Drop-in subscription form
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
