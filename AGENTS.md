# AGENTS.md — beehiiv-react

This file is read by OpenAI Codex, general agent runners, and any tool that looks for AGENTS.md.
Read `SKILL.md` (also in the repo root) for the full conventions guide.

## Setup

```bash
npm install
npm run build
npm test
```

## Mandatory checks before any commit

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (strict)
npm test           # vitest — 872 tests must pass
npm run build      # tsup dual ESM+CJS build
```

All four must pass. Do not commit code that fails any of these.

## Architecture in one paragraph

`BeehiivClient` (`src/client/`) is a **server-only** typed API client for beehiiv v2 with 14
endpoint namespaces — it holds a secret API key and must never appear in client bundles. React
hooks (`src/hooks/`) — 23 total — talk to user-owned Next.js API routes, never directly to
beehiiv. Components (`src/components/`) provide a `<BeehiivProvider>` context, a drop-in
`<SubscriptionForm>`, post display components (`PostCard`, `PostList`, `PostContentRenderer`),
and subscriber gating components (`GatedContent`, `PremiumContent`, `SubscriberBadge`, `TierBadge`). The CLI
(`src/cli/`) scaffolds beehiiv integration into any Next.js project via `beehiiv-react init`
and `beehiiv-react sync`. The package also provides a TanStack Query adapter
(`beehiiv-react/query`) and RSC-compatible server utilities (`beehiiv-react/server`). Types live
in `src/types/` with one file per resource; everything re-exports through `src/types/index.ts`
and then `src/index.ts`.

## Key rules for agents

- No `any` types. No `@ts-ignore`. TypeScript strict mode is enforced.
- `react` and `react-dom` must stay in `peerDependencies`.
- All hooks use `useBeehiiv()` for `apiUrl` and `fetchIdRef` for stale-response protection.
- All new exports must be registered in `src/types/index.ts` AND `src/index.ts`.
- New features require tests. Do not reduce the 872-test baseline without justification.
- `chalk`, `ora`, `open` are ESM-only — dynamic `import()` inside functions only.
- Endpoint constructors accept optional `defaultPublicationId`; methods support dual signatures.
- Generated templates import `BeehiivClient` from `beehiiv-react/server`, not `beehiiv-react`.
- Server actions unwrap `SubscriptionResponse` — return `response.data` (the `SubscriptionInfo`), not the wrapper.

## File map

| Path | Purpose |
|---|---|
| `src/index.ts` | Public package entry — all exports |
| `src/types/` | TypeScript types for all beehiiv resources (11 files) |
| `src/client/` | Server-side API client + rate limiter + 14 endpoint classes |
| `src/hooks/` | React hooks (23 total: useBeehiiv, useSubscribe, useSubscription, useCustomFields, usePosts, usePost, usePostBySlug, useSubscriberAccess, usePostAccess, useSubscriberProfile, useSubscriberTier, useSubscribers, usePublications, useTiers, useTier, useAuthors, useAuthor, useBulkUpdateJob, useEngagements, useAutomations, useWebhooks, useSegments, useReferrals) |
| `src/components/` | 9 components: BeehiivProvider, SubscriptionForm, PostCard, PostList, PostContentRenderer, GatedContent, PremiumContent, SubscriberBadge, TierBadge |
| `src/query/` | TanStack Query v5 adapter (sub-path: `beehiiv-react/query`) |
| `src/server/` | RSC utilities (sub-path: `beehiiv-react/server`) |
| `src/utils/` | Pure utility functions (canViewContent, getAudienceLabel, getTierLabel) |
| `src/cli/` | CLI commands, auth, generators, prompts |
| `templates/` | 22 Handlebars templates for code generation |
| `SKILL.md` | Full agent conventions guide |
| `CLAUDE.md` | Claude-specific project guide |

## Changelog

### v0.5.0

- Added 10 new React hooks: useTiers, useTier, useAuthors, useAuthor, useBulkUpdateJob, useEngagements, useAutomations, useWebhooks, useSegments, useReferrals (22 total)
- Added TierBadge component (9 components total)
- Test baseline increased from 476 to 497
- Added typed expand literal unions for tier, author, and engagement resources
- addTags now supports dual-signature pattern matching other SubscriptionsEndpoint methods
- useBulkUpdateJob: fixed URL shape, added fetchIdRef stale-response protection, added jobId reset
