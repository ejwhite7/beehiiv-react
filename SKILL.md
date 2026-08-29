# SKILL.md — Coding Agent Guide for beehiiv-react

This document is the authoritative guide for any coding agent (Claude, Cursor, Copilot, Windsurf,
Cline, Aider, etc.) working inside the `beehiiv-react` repository. Read this before writing a
single line of code.

---

## Project Identity

**Package:** `beehiiv-react` (NPM)
**Repo:** `ejwhite7/beehiiv-react`
**Purpose:** A typed API client, React hooks, drop-in subscription form component, and CLI
scaffolding tool that connects a beehiiv publication to any React or Next.js project.
**Language:** TypeScript (strict mode, ES2020, NodeNext modules)
**Build:** tsup (dual ESM + CJS output)
**Test Runner:** vitest + @testing-library/react + jsdom
**CI:** GitHub Actions — lint → typecheck → test → build (must all pass before merge)

---

## Architecture Overview

The package has four distinct layers. Understand all four before touching any file.

### 1. Server-Side API Client (`src/client/`)
`BeehiivClient` is a namespaced HTTP client for the beehiiv API v2. It is **server-only** — it
holds a secret API key and must never be imported in client bundles.

- `src/client/index.ts` — `BeehiivClient` class; constructs endpoint namespaces and exposes the
  internal `BeehiivHttpClient` via constructor injection
- `src/client/rate-limiter.ts` — Rolling 60-second token bucket, FIFO queue, max 5 concurrent
- `src/client/endpoints/*.ts` — One file per resource (subscriptions, custom-fields, publications,
  posts, webhooks, segments, automations, referrals, automation-journeys); each is a class
  that receives `BeehiivHttpClient` and an optional `defaultPublicationId` via constructor

All HTTP logic (auth header, timeout via `AbortController`, error parsing into `BeehiivApiError`,
rate limiter throttling) lives inside `BeehiivHttpClient`. Endpoint classes call only
`client.get/post/put/patch/delete` — they never touch `fetch` directly.

### 2. React Hooks (`src/hooks/`)
Client-side hooks that POST/GET through user-supplied API routes (never directly to beehiiv).

- `useBeehiiv()` — Context accessor; throws if called outside `<BeehiivProvider>`
- `useSubscribe()` — POST to `{apiUrl}/subscribe`
- `useSubscription()` — GET from `{apiUrl}/subscription/{id}` or `?email=`
- `useCustomFields()` — GET from `{apiUrl}/custom-fields`
- `usePosts()` — Paginated post list with filters and page-based pagination
- `usePost()` — Single post by ID
- `useSubscriberAccess()` — Subscriber tier/status to access result
- `usePostAccess()` — Combined post + subscriber access check
- `useSubscriberProfile()` — Full subscriber profile with isPremium/isActive flags
- `useSubscriberTier()` — Lightweight tier-only hook
- `useSubscribers()` — Paginated subscriber list
- `usePublications()` — All accessible publications

12 hooks total. All data-fetching hooks follow the same internal pattern (see "Hook Pattern"
below). Do not deviate from it when adding new hooks.

### 3. React Components (`src/components/`)
- `BeehiivProvider` — React context provider; accepts `apiUrl` (default `/api/beehiiv`) and
  `publicationId`; wraps the entire app
- `SubscriptionForm` — Drop-in form with email input, dynamic custom field rendering, UTM
  passthrough, success/error states, accessibility attributes, headless mode via `renderForm`
- `PostCard` — Single post card display with thumbnail, audience badge, headless `renderCard` prop
- `PostList` — Paginated post list with load-more, skeleton loading states, empty state
- `PostContentRenderer` — HTML/JSON content renderer with sanitization callback
- `GatedContent` — Declarative subscriber-gated content wrapper
- `PremiumContent` — Premium content gate with upgrade prompt
- `SubscriberBadge` — Subscriber tier badge with headless `renderBadge` prop

### 4a. TanStack Query Adapter (`src/query/`)
Sub-path export at `beehiiv-react/query` providing `useQuery`/`useMutation` hooks with cache
key factories. Requires `@tanstack/react-query` >= 5.0.0 as a peer dependency.

- `keys.ts` — Query key factory (`beehiivKeys`)
- `hooks.ts` — Query hooks: `usePostsQuery`, `useSubscribersQuery`, etc.
- `mutations.ts` — Mutation hooks: `useSubscribeMutation`, `useCreateWebhookMutation`, etc.

### 4b. Server Utilities (`src/server/`)
Sub-path export at `beehiiv-react/server` providing RSC-compatible helpers:

- `client.ts` — `createBeehiivClient()` factory (reads `BEEHIIV_API_KEY` from environment)
- `fetchers.ts` — Pure async fetchers: `fetchPosts`, `fetchPost`, `fetchSubscribers`,
  `fetchSubscription`, `fetchPublications`, `fetchCustomFields`, `fetchWebhooks`, `fetchSegments`

These are safe to call inside React Server Components, Route Handlers, and Server Actions.

### 5. CLI Tool (`src/cli/`)
A Commander.js CLI exposed as the `beehiiv-react` binary. Two commands:

- `init` — Interactive scaffolding: auth (API key or OAuth2 PKCE), publication selection,
  feature selection, file generation, `.env.local` update
- `sync` — Re-fetches custom fields and regenerates `lib/beehiiv/beehiiv-custom-fields.ts`

Code generation uses Handlebars templates in `templates/*.hbs`. The CLI uses dynamic imports
for ESM-only packages (chalk, ora, open).

---

## Type System (`src/types/`)

Every beehiiv API v2 resource has its own type file. Types are the contract — define them first,
then implement.

| File | Contents |
|---|---|
| `common.ts` | `BeehiivApiConfig`, `BeehiivConfig`, pagination types, error types |
| `subscription.ts` | `SubscriptionInfo`, `CreateSubscriptionRequest`, status/tier enums |
| `custom-field.ts` | `CustomFieldInfo`, `CustomFieldKind`, value types |
| `publication.ts` | `PublicationInfo`, stats, expand options |
| `post.ts` | `PostInfo`, `PostStats`, `PostContent`, `PostAggregateStats`, `GetPostOptions`, status/audience enums |
| `webhook.ts` | `WebhookInfo`, `WebhookEventType`, payload wrapper |
| `segment.ts` | `SegmentInfo`, filter options, member responses |
| `automation.ts` | `AutomationInfo`, journey/trigger/step types, email types |
| `automation-journey.ts` | `AutomationJourneyInfo`, create/response types |
| `referral.ts` | `ReferralProgramInfo`, milestone rewards, subscriber stats |
| `access.ts` | `AccessResult`, subscriber/post access option types |
| `index.ts` | Re-exports everything; the only types file other modules should import from |

**All exported types flow through `src/types/index.ts` and then `src/index.ts`.** When you add
a type, register it in both.

---

## Canonical Patterns to Follow

### Hook Pattern

Every data-fetching hook must follow this exact structure:

```typescript
export function useMyHook(options?: MyHookOptions): MyHookReturn {
  const { apiUrl } = useBeehiiv();
  const [data, setData] = useState<MyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchIdRef = useRef(0);

  const fetch = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await someApiCall(apiUrl, ...);
      if (fetchId === fetchIdRef.current) {
        setData(result);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiUrl, ...deps]);

  useEffect(() => {
    if (options?.enabled !== false) {
      fetch();
    }
  }, [fetch, options?.enabled]);

  return { data, isLoading, error, refetch: fetch };
}
```

Key rules:
- Always use `useBeehiiv()` for `apiUrl` — never hardcode URLs
- Always use `fetchIdRef` to guard against stale responses
- Always expose a `refetch` handle
- Never call beehiiv's API directly from a hook — always go through the user's API route

### Endpoint Pattern

```typescript
export class MyEndpoint {
  constructor(
    private readonly client: BeehiivHttpClient,
    private readonly defaultPublicationId?: string,
  ) {}

  private _resolvePublicationId(pubIdOrOptions?: string | object): string {
    if (typeof pubIdOrOptions === 'string') return pubIdOrOptions;
    if (!this.defaultPublicationId) throw new Error('publicationId is required');
    return this.defaultPublicationId;
  }

  /** Dual-signature: get(id, opts?) or get(pubId, id, opts?) */
  async get(id: string, opts?: GetOptions): Promise<MyResponse>;
  async get(publicationId: string, id: string, opts?: GetOptions): Promise<MyResponse>;
  async get(...args: unknown[]): Promise<MyResponse> {
    const pubId = this._resolvePublicationId(args[0] as string);
    // ... resolve remaining args based on signature
    return this.client.get<MyResponse>(
      `/publications/${pubId}/my-resource/${id}`
    );
  }
}
```

Key rules:
- Constructor injection only — never import or instantiate `BeehiivHttpClient` directly
- Accept optional `defaultPublicationId` in constructor; use `_resolvePublicationId()` helper
- All methods support dual signatures: `method(data)` (uses default) or `method(pubId, data)` (explicit)
- Return typed promises; never return `unknown` or `any`
- Register the endpoint as a `readonly` property on `BeehiivClient` in `src/client/index.ts`

### Error Handling

All client errors resolve as `BeehiivApiError` instances with:
- `.status` — HTTP status code
- `.message` — Human-readable summary
- `.errors` — `BeehiivErrorDetail[]` array from the API body

Hooks catch errors and store them as plain `Error` instances in state. Components receive errors
via hook return values — they never catch directly.

---

## How to Add New Features

### New API Endpoint

1. Add types to `src/types/<resource>.ts`
2. Export from `src/types/index.ts`
3. Create `src/client/endpoints/<resource>.ts` with an endpoint class
4. Add the endpoint as a `readonly` property in `BeehiivClient` (`src/client/index.ts`)
5. Re-export the endpoint class and any new types from `src/index.ts`
6. Write tests in `src/client/endpoints/<resource>.test.ts`

### New Hook

1. Create `src/hooks/use<Name>.ts` following the Hook Pattern above
2. Export from `src/hooks/index.ts`
3. Re-export from `src/index.ts`
4. Write tests in `src/hooks/use<Name>.test.tsx` using `@testing-library/react`
5. Export any new option/return types from `src/types/index.ts` and `src/index.ts`

### New Component

1. Create `src/components/<Name>.tsx`
2. Export from `src/components/index.ts`
3. Re-export from `src/index.ts`
4. Write tests in `src/components/<Name>.test.tsx`
5. Support headless/renderProp mode for any form-like component
6. Include aria attributes (aria-required, aria-invalid, aria-live, role) on all interactive elements

### New CLI Generator

1. Add or edit a Handlebars template in `templates/<name>.ts.hbs`
2. Create or update the generator in `src/cli/generators/<name>.ts`
3. Wire it into the relevant command in `src/cli/commands/init.ts` or `sync.ts`
4. Write tests in `src/cli/generators/<name>.test.ts`

### New CLI Command

1. Create `src/cli/commands/<name>.ts`
2. Register with Commander in `src/cli/index.ts`
3. Use `chalk` and `ora` via dynamic import (they are ESM-only)

---

## Testing Requirements

**Every PR must maintain a passing test suite.** The current baseline is 474 passing tests across
42 files. Do not merge code that reduces this count without a matching explanation.

### Test file locations

| Layer | Location |
|---|---|
| Client | `src/client/*.test.ts` |
| Endpoints | `src/client/endpoints/*.test.ts` |
| Rate limiter | `src/client/rate-limiter.test.ts` |
| Hooks | `src/hooks/*.test.tsx` |
| Components | `src/components/*.test.tsx` |
| CLI generators | `src/cli/generators/*.test.ts` |
| CLI auth | `src/cli/auth/*.test.ts` |

### Testing conventions

- Mock `fetch` globally in client/endpoint tests — never make real HTTP calls
- Use `@testing-library/react`'s `renderHook` and `act` for hook tests
- Use `@testing-library/user-event` for interaction tests (prefer over `fireEvent`)
- Component tests must cover: render, validation, submission, error state, success state
- CLI generator tests must cover: file content correctness, template variable injection
- All new hooks need tests for: auto-fetch on mount, error state, `refetch`, `enabled: false`

### Run tests

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with v8 coverage report
```

---

## Build System

```bash
npm run build     # tsup: ESM + CJS library + CJS CLI binary
npm run dev       # watch mode
npm run typecheck # tsc --noEmit (strict)
npm run lint      # eslint src --ext .ts,.tsx
```

tsup produces four entry points:
- `src/index.ts` -> `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts`
- `src/query/index.ts` -> `dist/query/index.js` (ESM) + `dist/query/index.cjs` (CJS) + `dist/query/index.d.ts`
- `src/server/index.ts` -> `dist/server/index.js` (ESM) + `dist/server/index.cjs` (CJS) + `dist/server/index.d.ts`
- `src/cli/index.ts` -> `dist/cli/index.js` (CJS with shebang)

React and react-dom are **externalized** from the library build. They are peer dependencies —
never bundle them.

---

## CI Gate

GitHub Actions runs on every push and PR to `main`:

```
lint → typecheck → test → build
```

All four must pass. The `prepublishOnly` script runs the same gate before any npm publish.
Never skip or suppress any of these checks.

---

## Known Gaps (Expansion Targets)

Most gaps from earlier versions have been implemented. Remaining expansion candidates:

| Gap | What's Missing |
|---|---|
| Missing UTM fields | `utmTerm` and `utmContent` missing from `SubscribeData` (API supports them) |
| OAuth token refresh | OAuth2 refresh token rotation not yet automated |
| Webhook event handlers | No built-in handler utilities for incoming webhook payloads |
| SSR/streaming support | No Suspense-compatible data fetching pattern |

When implementing any of these, follow the canonical patterns above and ship tests.

---

## Code Style Rules

- TypeScript strict mode is non-negotiable — no `any`, no `@ts-ignore`
- No unused variables or parameters (`noUnusedLocals`, `noUnusedParameters` enforced)
- Every exported function, class, and type must have a JSDoc comment
- Every file must have a one-line header comment describing its purpose
- Modular structure: one concern per file, no god modules
- Use named exports everywhere — no default exports except React components
- ESM-only packages (chalk, ora, open) must be dynamically imported inside functions, not at
  the top level, because the library build targets both ESM and CJS consumers

---

## What Not to Do

- Do not import `BeehiivClient` or make direct beehiiv API calls from any hook or component —
  hooks talk to user-owned API routes only
- Do not add `react` or `react-dom` to the `dependencies` array — they must stay as peer deps
- Do not use `any` types — define the type or use `unknown` with a type guard
- Do not write tests that make real network requests
- Do not skip the CI gate or comment out failing tests to get a PR green
- Do not add new top-level exports without registering them in both `src/types/index.ts` (for
  types) and `src/index.ts` (for everything)
- Do not use `default export` for anything other than React components

---

## Installing Skills in Your Coding Workspace

When you open a project that uses `beehiiv-react` as a dependency, use the instructions below
to load the agent context for your specific tool. This gives your coding agent full knowledge
of the package's architecture, patterns, and constraints without reading source code.

### Claude (Claude Code / claude.ai)

Add the following block to your project's `CLAUDE.md` (create the file if it doesn't exist):

````markdown
## beehiiv-react

This project uses the `beehiiv-react` NPM package. Load the skill context before working with
any beehiiv integration code:

- Full conventions guide: `node_modules/beehiiv-react/SKILL.md`
- Run `cat node_modules/beehiiv-react/SKILL.md` to read it at session start.

Key rules (summary):
- `BeehiivClient` is server-only — never import in hooks, components, or client bundles.
- Hooks use `useBeehiiv()` for `apiUrl` — never hardcode the beehiiv API URL.
- Hooks use `fetchIdRef = useRef(0)` to guard stale async responses.
- All new types register in `src/types/index.ts` AND `src/index.ts`.
- No `any` types. TypeScript strict mode enforced.
````

### Cursor

Copy `.cursor/rules/beehiiv-react.mdc` from the package into your project:

```bash
mkdir -p .cursor/rules
cp node_modules/beehiiv-react/.cursor/rules/beehiiv-react.mdc .cursor/rules/
```

Cursor auto-loads all `.mdc` files in `.cursor/rules/` — no further configuration needed.

### GitHub Copilot

Copy the Copilot instructions file into your project:

```bash
mkdir -p .github
cp node_modules/beehiiv-react/.github/copilot-instructions.md .github/copilot-instructions.md
```

If your project already has a `.github/copilot-instructions.md`, append the beehiiv-react
section to the end of your existing file instead of replacing it.

### Windsurf

Copy the rules file to your project root:

```bash
cp node_modules/beehiiv-react/.windsurfrules .windsurfrules
```

If a `.windsurfrules` already exists, append the beehiiv-react section to it.

### Cline

Copy the rules file to your project root:

```bash
cp node_modules/beehiiv-react/.clinerules .clinerules
```

If a `.clinerules` already exists, append the beehiiv-react section to it.

### Aider

Aider supports passing additional context files via `--read`. Add this to your session startup:

```bash
aider --read node_modules/beehiiv-react/SKILL.md
```

Or add it to your local `.aider.conf.yml`:

```yaml
read:
  - node_modules/beehiiv-react/SKILL.md
```

### Manual / Any Other Tool

The canonical skill file is always available at:

```
node_modules/beehiiv-react/SKILL.md
```

Paste its contents into any tool's system prompt, context window, or rules file to give your
agent full knowledge of the package conventions.
