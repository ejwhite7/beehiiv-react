# Changelog

All notable changes to `beehiiv-react` are documented in this file.

## [0.4.1] - 2026-04-29

### Added
- **Accessibility**: `aria-required`, `aria-invalid`, `aria-describedby`, and `autocomplete` tokens added to all subscribe form fields
  - `SubscriptionForm.tsx`: `autocomplete="email"` on the email input, `autoComplete="off"` on custom field inputs, `aria-invalid` tied to error state, `aria-describedby` linking to a `beehiiv-form-error` error display
  - `subscribe-cta.tsx.hbs` (CLI template): `aria-required` and `autocomplete="email"` on the email input
  - `subscribe-step-two.tsx.hbs` (CLI template): `aria-required` and `autoComplete="off"` on custom field inputs/selects
- **`expand` parameter on `usePosts`/`usePostsQuery`**: list-side equivalent of the v0.4.0 `GetPostOptions.expand` addition. Generated `posts-route.ts.hbs` API route forwards `expand[]` to the beehiiv API for paginated load-more requests so post content (body/HTML) is included on every page.

### Fixed
- **SubscribeCTA template**: now accesses unwrapped `SubscriptionInfo` fields directly (`result?.publication_id`) instead of `result?.data?.publication_id`, matching the v0.3.x change where `subscribeAction` stopped wrapping the response in a `.data` envelope.

## [0.4.0] - 2026-04-29

### Added
- **`defaultPublicationId` dual-signature pattern** on all 9 endpoint classes.
  Every method now supports `method(data)` (uses default) or `method(pubId, data)` (explicit override).
  Each class gains a constructor `defaultPublicationId` parameter and a private `_resolvePublicationId()` helper.
  - `SegmentsEndpoint`: list, get, create, delete, recalculate, listMembers
  - `AutomationsEndpoint`: list, get, create, listJourneys, listEmails
  - `WebhooksEndpoint`: list, get, create, update, delete, test
  - `PostsEndpoint`: list, get, create, update, delete, aggregateStats
  - `CustomFieldsEndpoint`: list, get, create, update, delete
  - `ReferralsEndpoint`: getProgram, listMilestones, getSubscriberStats
- **`AutomationJourneysEndpoint`** -- new endpoint class with `create()` and `get()` methods.
- **`PostsEndpoint.aggregateStats()`** -- `GET /v2/publications/{publicationId}/posts/aggregate_stats`.
- **`SegmentsEndpoint.create()`** -- `POST /v2/publications/{publicationId}/segments`.
- **`AutomationsEndpoint.get()`** -- `GET /v2/publications/{publicationId}/automations/{id}`.
- **`AutomationsEndpoint.listEmails()`** -- `GET /v2/publications/{publicationId}/automations/{id}/emails`.
- **`GetPostOptions`** interface with `expand` array parameter for `PostsEndpoint.get()`.
- New types: `AutomationJourneyInfo`, `CreateAutomationJourneyRequest`, `AutomationJourneyResponse`, `AutomationJourneyStatus`, `AutomationEmailInfo`, `AutomationEmailListResponse`, `PostAggregateStats`, `PostAggregateStatsResponse`.
- Full test coverage for all new endpoints and dual-signature patterns (467 tests, 42 files).
- `CHANGELOG.md` (this file).

### Fixed
- **Load More: post content now renders correctly for all paginated results** -- Added `expand` parameter support to `ListPostsOptions`, `usePosts` hook, `usePostsQuery` query hook, and the `posts-route.ts.hbs` API route template. The `expand[]` query parameter (e.g. `free_web_content`) is now forwarded on every fetch, including paginated load-more requests, ensuring post content (body/HTML) is included in all API responses regardless of which page they came from.
- **Post fetches now include tags and content fields via expand parameter on all page requests** -- Added `tags?: string[]` field to `PostInfo` type. `PostCard` component renders tags with accessible list markup and supports `tagsClassName`, `showTags`, and headless `renderPost` props. Server-side `fetchPost` expands both `free_web_content` and `tags` by default.

### Fixed (ported from v0.3.7--v0.3.14)
- **`publicationId` wiring** -- `PostsEndpoint` and all other endpoints now receive `defaultPublicationId` from `BeehiivClient` constructor.
- **Page-based pagination** -- `PostsEndpoint.list()` uses `page` parameter instead of the broken `cursor` parameter; `usePosts` hook updated accordingly.
- **`expand` parameter** -- `PostsEndpoint.get()` accepts `GetPostOptions.expand` to request expanded content fields (e.g. `free_web_content`).
- **`PostContent` type alignment** -- `PostContent` / `PostContentRenderer` components and `posts` endpoint share the same content type.
- **`BeehiivCustomFields` import path** -- CLI `init` and `sync` commands generate to `lib/beehiiv/beehiiv-custom-fields.ts` (was `types/beehiiv.generated.ts`).
- **CLI version injection** -- Version read dynamically via tsup `define` instead of hardcoded string; `--version` flag works correctly.
- **`enrichSubscriptionAction`** -- Generated actions template now includes the missing `enrichSubscriptionAction` export.
- **CLI ESM/CJS build** -- Reverted ESM CLI build to CJS to fix `__dirname` regression.
- CLI subscriber persistence, CTA hiding, and dataLayer event tracking templates ported.
- **`BeehiivClient` import path in templates** -- All CLI-generated templates import from `beehiiv-react/server` instead of `beehiiv-react`.
- **UTM fields in `subscribeAction`** -- Generated server action template accepts and passes through UTM attribution and `reactivateExisting` fields.
- **`utm_channel` type** -- Added `utm_channel` to `SubscriptionInfo` and `CreateSubscriptionRequest`.
- **Defensive `usePosts` pagination** -- `data` and `pagination` fields treated as optional in API response; prevents runtime crashes on incomplete responses.
- **`subscribeAction` response unwrapping** -- Generated server actions now return `response.data` (the `SubscriptionInfo` record) instead of the raw `SubscriptionResponse` wrapper, so consumers can use `sub.id` directly.
- **API route double-wrapping fix** -- Generated API routes no longer double-wrap responses in `{ data: { data: ... } }`; SDK response objects are passed through directly.
- **SubscribeCTA template `.data` accessor fix** -- Generated `SubscribeCTA` component now correctly accesses unwrapped `SubscriptionInfo` fields directly (e.g. `result?.publication_id`) instead of the removed `.data` envelope (`result?.data?.publication_id`).

### Changed
- Bumped version to 0.4.0.
- `ListPostsOptions.cursor` replaced with `ListPostsOptions.page` (number, 1-indexed).
- All endpoint constructors accept an optional second `defaultPublicationId` argument.

## [0.3.14] - 2026-04-29

### Fixed
- `usePosts` hook now handles API responses with missing `data` or `pagination` fields gracefully.
- Response type fields changed from required to optional with null-coalescing defaults.
- Two new test cases for edge-case API responses.

## [0.3.13] - 2026-04-29

### Fixed
- All CLI-generated templates now import `BeehiivClient` from `beehiiv-react/server` instead of `beehiiv-react`.
  - `api-route.ts.hbs`, `posts-route.ts.hbs`, `server-action.ts.hbs`, `api-routes.ts` generator.
- Generated `subscribeAction` now accepts and passes UTM attribution fields (`utmSource`, `utmMedium`, `utmChannel`, `utmCampaign`, `referringSite`, `reactivateExisting`).
- `utm_channel` added to `SubscriptionInfo` and `CreateSubscriptionRequest` types.

## [0.3.12] - 2026-04-29

### Fixed
- `publicationId` now wired through correctly in generated server actions and API routes.
- Generated `BeehiivCustomFields` import path matches the custom-fields generator output (`lib/beehiiv/beehiiv-custom-fields.ts`).
- `expand` parameter properly passed through to the posts list/get endpoints.
- `PostContent` type is exported and aligned across `PostContent`/`PostContentRenderer` components and the `posts` endpoint.
- `usePosts` cursor pagination fixed (load-more no longer clobbers prior pages); migrated to page-based pagination.

## [0.3.11] - 2026-04-29

### Changed
- Republish of v0.3.10 with changelog entries included in the tarball.

## [0.3.10] - 2026-04-29

### Added
- CLI-generated subscribe flow with persistence and analytics:
  - Two-step subscribe component (`SubscribeCTA` + `SubscribeStepTwo`) with `SubscribeWrapper`.
  - `useSubscriberStatus` hook with cookie + localStorage persistence.
  - `analytics.ts` generator for Google Tag Manager `dataLayer` event tracking.
  - Posts API route template (`posts-route.ts.hbs`) with server-side pagination.
- New CLI generators: `analytics.ts`, `hooks.ts`, `subscribe-components.ts`.
- New Handlebars templates: `analytics.ts.hbs`, `posts-route.ts.hbs`, `subscribe-cta.tsx.hbs`, `subscribe-step-two.tsx.hbs`, `subscribe-wrapper.tsx.hbs`, `use-subscriber-status.ts.hbs`.

## [0.3.9] - 2026-04-29

### Fixed
- `enrichSubscriptionAction` missing from generated `actions.ts` template.

## [0.3.8] - 2026-04-29

### Fixed
- `__dirname` not defined regression from ESM CLI build -- reverted to CJS CLI, injecting version via tsup `define`.

## [0.3.7] - 2026-04-29

### Fixed
- CLI version now read dynamically from `package.json` instead of hardcoded string.
- API route template method signatures corrected.
- 7 TypeScript errors resolved in generated actions and API routes.
- Server/client exports split to fix Next.js RSC boundary error.

### Added
- `--version` / `-v` CLI flag.

## [0.3.6] - 2026-04-28

### Fixed
- API route template method signatures corrected.

## [0.3.5] - 2026-04-28

### Fixed
- `"use client"` injected via tsup banner instead of source directives.

### Added
- `SKILL.md` and agent context files for Cursor, Copilot, Windsurf, Cline, Aider.

## [0.3.4] - 2026-04-28

### Fixed
- `"use client"` banner added to client-side build output.

## [0.3.3] - 2026-04-28

### Fixed
- `"use client"` directives added to all client-side components and hooks.

## [0.3.2] - 2026-04-28

### Fixed
- Next.js 15 async params in generated route handlers.
- README included in npm package; peer dep install clarified.

## [0.3.1] - 2026-04-28

### Fixed
- Default import for `beehiiv.config` in generated routes.

## [0.3.0] - 2026-04-28

### Added
- Full beehiiv API v2 coverage: webhooks, segments, automations, referrals endpoints.
- `useSubscribers` and `usePublications` hooks.
- TanStack Query v5 adapter (`beehiiv-react/query`).
- React Server Component utilities (`beehiiv-react/server`).
- CLI `init` and `sync` commands for scaffolding Next.js projects.

### Fixed
- CLI `beehiiv-react init` crashing with ENOENT on template files.
