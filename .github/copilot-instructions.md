# GitHub Copilot Instructions — beehiiv-react

Read `SKILL.md` in the repo root before suggesting any code. These instructions summarize the
most important constraints — SKILL.md has the full details.

## Architecture

This package has four layers:
1. **`src/client/`** — Server-only `BeehiivClient` with endpoint namespaces and a built-in rate
   limiter. Never import this in client-side code.
2. **`src/hooks/`** — React hooks that talk to user-supplied API routes, never directly to beehiiv.
3. **`src/components/`** — `BeehiivProvider` context and `SubscriptionForm` drop-in component.
4. **`src/cli/`** — Commander.js CLI with `init` and `sync` commands and Handlebars generators.

## Rules Copilot must follow

- `BeehiivClient` is **server-only**. Never suggest importing it in hooks or components.
- All hooks must call `useBeehiiv()` to get `apiUrl`. Never hardcode API URLs.
- All data-fetching hooks must use a `fetchIdRef = useRef(0)` pattern to discard stale responses.
- TypeScript strict mode — no `any`, no `@ts-ignore`, no unused variables.
- `react` and `react-dom` are peer dependencies — do not add them to `dependencies`.
- Named exports only, except React components which use default exports.
- `chalk`, `ora`, and `open` are ESM-only — always use dynamic `import()` inside functions.
- Every new type must be registered in `src/types/index.ts` and re-exported from `src/index.ts`.
- Every new hook, endpoint, or component must have a corresponding test file.

## CI gate (all must pass before any merge)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Known expansion targets

`usePosts`, `usePost`, `useSubscribers`, `useSubscriberAccess`, `<PremiumContent>`, webhook
endpoint, `utmTerm`/`utmContent` in `SubscribeData`, audience filter on posts.
See SKILL.md "Known Gaps" section for full details.
