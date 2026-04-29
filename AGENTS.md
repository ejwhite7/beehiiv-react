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
npm test           # vitest — 467 tests must pass
npm run build      # tsup dual ESM+CJS build
```

All four must pass. Do not commit code that fails any of these.

## Architecture in one paragraph

`BeehiivClient` (`src/client/`) is a **server-only** typed API client for beehiiv v2 — it holds
a secret API key and must never appear in client bundles. React hooks (`src/hooks/`) talk to
user-owned Next.js API routes, never directly to beehiiv. Components (`src/components/`) provide
a `<BeehiivProvider>` context and a drop-in `<SubscriptionForm>`. The CLI (`src/cli/`) scaffolds
beehiiv integration into any Next.js project via `beehiiv-react init` and `beehiiv-react sync`.
Types live in `src/types/` with one file per resource; everything re-exports through
`src/types/index.ts` and then `src/index.ts`.

## Key rules for agents

- No `any` types. No `@ts-ignore`. TypeScript strict mode is enforced.
- `react` and `react-dom` must stay in `peerDependencies`.
- All hooks use `useBeehiiv()` for `apiUrl` and `fetchIdRef` for stale-response protection.
- All new exports must be registered in `src/types/index.ts` AND `src/index.ts`.
- New features require tests. Do not reduce the 126-test baseline without justification.
- `chalk`, `ora`, `open` are ESM-only — dynamic `import()` inside functions only.

## File map

| Path | Purpose |
|---|---|
| `src/index.ts` | Public package entry — all exports |
| `src/types/` | TypeScript types for all beehiiv resources |
| `src/client/` | Server-side API client + rate limiter + endpoints |
| `src/hooks/` | React hooks (useSubscribe, useSubscription, useCustomFields, useBeehiiv) |
| `src/components/` | BeehiivProvider + SubscriptionForm |
| `src/cli/` | CLI commands, auth, generators, prompts |
| `templates/` | Handlebars templates for code generation |
| `SKILL.md` | Full agent conventions guide |
| `CLAUDE.md` | Claude-specific project guide |
