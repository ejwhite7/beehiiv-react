# Changelog

All notable changes to `beehiiv-react` are documented in this file.

## [0.7.0] - 2026-06-09

### Fixed
- **`require('beehiiv-react')` no longer crashes; ESM consumers get the real ESM build** -- The `exports` map pointed `require` at `.cjs` files tsup never emits and `import` at the CJS `.js` build. `main`/`module`/`exports` now match the actual build output (`.js` = CJS, `.mjs` = ESM) with per-condition `types` entries.
- **Posts with audience `'both'` are no longer denied to everyone** -- `canViewContent` had no `'both'` branch and fell through to `false`, locking every visible-to-all-subscribers post behind a denial in `GatedContent`, `PremiumContent`, `useSubscriberAccess`, and `usePostAccess`. `'both'` now grants access to any active subscriber.
- **`useBulkUpdateJob` polling now actually stops on success** -- The terminal status was checked as `'completed'`, but the API reports `'complete'`. Also: the hook no longer reports `isPolling: true` when no `jobId` is provided, and changing `jobId` mid-flight can no longer drop a resolving fetch.
- **Bulk subscription types match the beehiiv API** -- `BulkCreateSubscriptionsResponse` is `{ message, import_id }` (was six invented fields); `BulkUpdateStatusRequest` sends `new_status` (was `status`, which the API ignored); `bulkUpdateStatus` returns `void` per the API's 204 response; `bulkUpdateFields` uses `{ subscriptions: [...] }` / `{ data: { subscription_update_id } }`.
- **TanStack Query cache collisions** -- `useSegmentsQuery` keyed every filter combination to one cache entry; webhook/segment/automation queries ignored the `publicationId` override in their keys. List and detail keys now include their inputs (bare `detail(id)` keys remain fuzzy-match prefixes of scoped keys, so existing invalidations keep working).
- **`useSubscribe` returns a stable `subscribe` callback** -- Inline `options` objects no longer recreate `subscribe` every render; the latest `onSuccess`/`onError` are read from a ref, and resolving requests no longer set state after unmount.
- **Generated server actions no longer ship an empty publication ID** -- the `init` flow now threads the selected publication into the server-action template (previously rendered `?? ''`).
- **Generated code survives special characters** -- publication names and blog titles are escaped for TypeScript string-literal positions ("Acme & Co." no longer generated `'Acme &amp; Co.'`); the generated RSS feed runtime-escapes its title/description.
- **OAuth callback server port race** -- the CLI bound a probe server to find a port, closed it, then re-bound, crashing with an unhandled `EADDRINUSE` if the port was claimed in between. It now binds port 0 directly and rejects cleanly on listen errors.
- **`SubscriptionForm` numeric custom fields submit as numbers** (previously sent as strings); `getAudienceLabel` and `PostCard` audience labels corrected (`'all'` → "Everyone", `'both'` → "Members Only" — the pair was inverted in `PostCard`).
- **`GatedContent`/`PremiumContent` re-fire `onAccessResolved`** when the subscriber identity props change (previously fired at most once per mount).

### Changed
- **BREAKING (types):** `BulkSubscriptionUpdateJob` now mirrors the API's Subscription Update object (`id`, `type`, `params`, `status`, `publication_id`, `failure_reason`, `completed`, `created`, `updated`, `error_log`); the invented `total`/`created`/`updated`/`failed` counters and `created_at`/`completed_at` fields are gone. `BulkSubscriptionUpdateJobStatus` uses `'complete'` (was `'completed'`). `BulkUpdateStatusResponse` was removed (the endpoint returns 204).
- **`init` prompts before overwriting existing files** -- all generators now confirm before clobbering files you may have customized (`sync` still force-regenerates its types file).
- **Generated subscribe GET route includes a security warning** -- the scaffolded `GET /api/beehiiv/subscribe?email=...` handler documents its subscriber-enumeration/PII risk and includes an example auth guard. Add an auth check or rate limiting before production.

### Added
- **`npm run test:pack` packaging smoke test** -- packs the tarball, installs it into a throwaway project, and verifies `require()`/`import` of all three entry points; runs in CI and `prepublishOnly` so a broken `exports` map can't ship again.
- **`BulkSubscriptionUpdateJobType`**, **`BulkUpdateSubscriptionEntry`**, and **`BulkUpdateCustomFieldEntry`** types exported.
- **Dev-only XSS warning in `PostContentRenderer`** when rendering HTML without a `sanitizeHtml` callback.

## [0.6.1] - 2026-05-28

### Fixed
- **Generated blog post page now compiles and gates correctly** -- The `blog-post-page` template passed `post`/`subscription` props that do not exist on `GatedContent` (and omitted its required `audience`), so a scaffolded blog failed `next build`. The template now resolves access **server-side**: only `premium` posts are gated, `free`/`both` posts render for everyone, and the server-resolved viewer subscription is actually consumed. No client component or `BeehiivProvider` is required on the post page.
- **`fetchPost` and `fetchSubscription` return `null` instead of `[]` when the API response has no `data`** -- The single-object server fetchers previously fell back to an empty array under a non-array return type, which defeated `if (!post) notFound()` guards (a truthy `[]`) and rendered a broken page instead of a 404. They now return `PostInfo | null` / `SubscriptionInfo | null`.
- **Slug lookup no longer 404s posts in large publications** -- `fetchPostBySlug` and `fetchAllPostSlugs` shared no pagination code and had divergent page caps (`maxPages` 20 vs 50), so `generateStaticParams` could enumerate slugs the post page could not resolve. Both (plus the new `fetchAllPosts`) are now backed by a single `scanPosts` paginator with one consistent cap.
- **Generated sitemap is no longer silently truncated** -- The sitemap fetched `limit: 1000`, which the beehiiv API caps at 100, so publications with more than 100 posts produced an incomplete sitemap. It now paginates through every confirmed post via `fetchAllPosts`.
- **`usePostBySlug` `publicationId` override is honored** -- The generated posts route now reads `publicationId` from the query string for slug lookups, so the hook's per-call publication override is no longer ignored.
- **`init --blog` route prefix is normalized and validated** -- The non-interactive flag path took the route prefix verbatim (e.g. `/Blog/` produced `app//Blog//page.tsx`). Both `init --blog` and `add blog` now share `resolveBlogConfig`, applying the same normalization/validation as the interactive prompt.

### Added
- **`fetchAllPosts(client, publicationId, options?)`** -- Paginating server fetcher (exported from `beehiiv-react/server`) that returns every confirmed post; used by the generated sitemap.

### Performance
- **Per-request slug-fetch deduplication** -- The blog post page memoizes the slug lookup with React `cache()` so `generateMetadata` and the page body share one fetch. The generated posts route wraps slug lookups in `unstable_cache` (positive and negative results), preventing repeated or missed slugs from rescanning the posts list on every request.

### Internal
- Extracted `src/cli/config.ts` (`readBeehiivConfig`) shared by the `sync` and `add blog` commands, replacing duplicated `beehiiv.config.ts` parsing.

## [0.4.4] - 2026-04-30

### Fixed
- **Generated `posts` API route now returns the correct pagination shape** -- The CLI-generated Next.js posts route template was returning `response.pagination` (which does not exist on the SDK response). It now reads `page`, `limit`, `total_results`, and `total_pages` directly from the SDK response, matching the shape `usePosts` expects.
- **Generated `posts` API route now forwards `order_by` and `direction`** -- The route reads `order_by` (defaults to `publish_date`) and `direction` (defaults to `desc`) from the request query string and passes them through to `client.posts.list`, so client-side ordering controls actually take effect.

## [0.4.3] - 2026-04-30

### Added
- **openapi-typescript codegen wired up to beehiiv API spec for automatic type sync** -- Types in `src/types/` now re-export or extend auto-generated definitions from the official beehiiv OpenAPI specification (`src/types/beehiiv-api.generated.ts`). Run `npm run generate:types` to regenerate.
- **`generate:types` npm script** -- Runs `openapi-typescript` against the vendored beehiiv API spec to produce `src/types/beehiiv-api.generated.ts`.
- **`check:spec` npm script** -- Probes known beehiiv spec URLs and exits 0/1 to indicate whether an official OpenAPI spec is available.
- **Weekly type-sync GitHub Actions workflow** -- `.github/workflows/sync-api-types.yml` regenerates types every Monday and opens a PR if the spec changed.
- **Type Generation section in CLAUDE.md** -- Documents the codegen pipeline, commands, and architecture decisions.

## [0.4.2] - 2026-04-29

### Added
- **`tags?: string[]` on `PostInfo`** -- Posts can now carry tag metadata alongside the rest of their fields.
- **`PostCard` tag rendering** -- `PostCard` renders tags with accessible list markup (`role="list"` / `role="listitem"`), and exposes `showTags`, `tagsClassName`, and headless `renderPost` props for full styling control.
- **`fetchPost` expands tags by default** -- Server-side `fetchPost` now requests both `free_web_content` and `tags` via the beehiiv API's `expand` parameter so tags are populated on the returned record without additional configuration.

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
