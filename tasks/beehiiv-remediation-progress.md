# beehiiv-react remediation progress

Append-only execution ledger for the Ralph remediation loop.

## Baseline

- Branch: `tidebreak/ember-inlet`
- Starting commit: `6d547ab`
- Existing gate: lint, strict typecheck, 606 tests, build, and package smoke test pass.
- Production dependency audit: zero vulnerabilities with `npm audit --omit=dev`.
- Development dependency audit: 12 findings, including 2 critical and 7 high.
- Stop-ship findings: unauthenticated subscriber operations and public draft/premium post proxying.
- Completion is controlled by `tasks/beehiiv-remediation-prd.json`; prose claims do not mark a story complete.

## Discovery log

- BR-018 added after the first worker confirmed that unauthenticated bulk subscription creation remained outside BR-001.
- BR-019 added from the initial adversarial review: optional implementation signatures permit missing required endpoint payloads.
- BR-020 added from root review: `usePostAccess` defaults a missing post to public audience and can report an access grant after fetch failure.

## BR-001 iteration 1 - blocked by verification

- Implementation added deny-by-default authorization hooks to generated email lookup, ID lookup/deletion, and existing-subscriber Server Actions.
- Root gate passed: lint, typecheck, 611 tests, build, package smoke, and production dependency audit.
- Independent review blocked completion because the new tests inspect generated source text but do not execute anonymous handlers or assert Beehiiv client spies remain untouched.
- BR-001 remains `passes: false`.
- Next iteration: execute transpiled generated handlers/actions with mocked Next.js and Beehiiv modules; assert anonymous operations return 401 or reject before any lookup/update/delete call, and public POST still reaches create.

## BR-001 iteration 2 - passed

- Added an executable generated-module harness using TypeScript transpilation, `node:vm`, and explicit Next.js/Beehiiv mocks.
- Anonymous email lookup returns 401 and never calls `subscriptions.list`.
- Anonymous ID lookup/deletion return 401 and never call `subscriptions.get` or `subscriptions.delete`.
- Existing-subscriber Server Actions reject before `subscriptions.updateById` or `subscriptions.delete`.
- Public subscribe POST remains available and calls `subscriptions.create`.
- The independent review's only blocker was behavioral proof; the new tests directly satisfy that condition. A second reviewer thread could not be created because the platform child-thread limit was reached, so root inspected the harness for module-resolution, realm, ordering, and mock false positives.
- Final evidence: lint passed, strict typecheck passed, 614 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Rollback: revert the two subscriber templates, API route generator, associated tests/snapshot, and remove the behavioral security test. No migration or persistent data change is involved.
- BR-001 marked `passes: true`.

## BR-002 iteration 1 - passed

- The generated public posts route rejects caller-controlled publication IDs, status, audience, and expansion parameters before any Beehiiv call.
- Public list and slug requests are restricted to the configured publication and fixed `confirmed` plus `free` filters.
- An adversarial pass found that cached slug results could outlive an audience/status change. Authorization-sensitive slug caching was removed.
- Response-side guards filter inconsistent upstream list data and convert unexpected draft or premium slug records to `null`.
- The shared slug scanner now supports an explicit audience filter without changing default behavior for existing callers.
- Executable VM tests cover draft, premium, arbitrary expansion, camel-case and snake-case publication override probes; they also verify safe requests and inconsistent upstream responses.
- Final evidence: lint passed, strict typecheck passed, 627 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: revert the posts route template, scanner audience option, and associated tests/snapshot. No migration or persistent data change is involved.
- BR-002 marked `passes: true`.

## BR-003 iteration 1 - passed

- `PostContent` and `PostContentRenderer` now fail closed when raw HTML is supplied without either a sanitizer callback or the explicit `htmlIsSanitized` assertion.
- Added server-only `sanitizeBeehiivHtml` and `sanitizeBeehiivPostContent` helpers backed by `sanitize-html` 2.17.7 with a conservative rich-text allowlist.
- Generated blog pages sanitize free and premium web/RSS content on the server, then pass only sanitized content across the client-component boundary.
- Regression fixtures cover scripts, event handlers, JavaScript URLs, SVG payloads, malformed markup, inline styles, and external-link rel protection.
- The initial sanitizer install exposed vulnerable compatible transitive versions of PostCSS and nanoid. Compatible audit fixes updated them to PostCSS 8.5.26 and nanoid 3.3.18; the production audit is again clean.
- Final evidence: lint passed, strict typecheck passed, 638 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: revert the renderer trust-boundary changes, server sanitizer/export, generated blog template, tests/snapshot, and sanitizer dependencies. No migration or persistent data change is involved.
- BR-003 marked `passes: true`.

## BR-004 iteration 1 - passed

- Official beehiiv post responses include `enforce_gated_content`; this missing field was the source of the conflicting free/both behavior.
- Established one shared policy: `all` is public; `free` and `both` are public only when gating is explicitly false, otherwise they require an active subscription; `premium` always requires an active premium subscription.
- Missing gate metadata defaults to true so old or incomplete responses fail closed.
- The public posts route, generated blog page, `usePostAccess`, `useSubscriberAccess`, and `GatedContent` now delegate to `canViewContent`.
- The public route no longer relies on a single audience filter; it response-filters confirmed posts through the shared policy, allowing explicitly ungated free/both records while excluding gated and premium records.
- Added an exhaustive 168-case audience/tier/status/gate matrix plus hook regressions for explicit ungated access and missing-metadata denial.
- Final evidence: lint passed, strict typecheck passed, 810 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: revert the shared policy flag/signature, PostInfo field, hook/component propagation, server export, generated templates, and tests/snapshots. No migration or persistent data change is involved.
- BR-004 marked `passes: true`.

## BR-018 iteration 1 - passed

- Bulk subscription creation now has a deny-by-default administrator authorization hook and checks it before request-body parsing or Beehiiv access.
- Authorized bulk input is constrained to 1 through 100 entries.
- The intentionally public single-subscribe route rejects declared or parsed bodies above 16 KiB and validates trimmed email syntax and the 254-character limit.
- Added a basic five-attempts-per-minute client limiter, a 10,000-client memory bound, `Retry-After`, and an explicit hook boundary for replacing the per-instance control with durable distributed rate limiting or CAPTCHA.
- Executable generated-route tests prove oversized bodies are not read, the sixth same-client signup is rejected without a Beehiiv call, and anonymous bulk bodies are not read or forwarded.
- Final evidence: lint passed, strict typecheck passed, 813 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: revert the public subscribe abuse controls, bulk authorization/validation, server type export, associated tests/snapshot, and Ralph state. No migration or persistent data change is involved.
- BR-018 marked `passes: true`.

## BR-005 iteration 1 - passed

- Split the generated route responsibilities: `/subscribe` now handles public creation only, while `/subscription` handles fail-closed email lookup alongside the existing `/subscription/[id]` route.
- Email lookup unwraps the list response to `{ data: SubscriptionInfo | null }`; ID lookup already returns the same one-record envelope.
- `useSubscription` and `useSubscriptionQuery` both target the generated email/ID URLs and now type the nullable no-match envelope correctly.
- Executable generated-module tests enable the authorization stubs in isolation and verify successful email and ID lookup envelopes; hook tests verify both URLs and null results.
- The new `subscription-route.ts.hbs` is included in generated output and the published template package.
- Final evidence: lint passed, strict typecheck passed, 815 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: restore the email GET handler to the subscribe template, remove the subscription root template/generator entry, revert nullable hook response types and contract tests. No migration or persistent data change is involved.
- BR-005 marked `passes: true`.

## BR-006 iteration 1 - passed

- The generated subscribe route now validates custom-field values and converts the client object shape to Beehiiv's required `{ name, value }[]` wire format.
- `SubscriptionForm`, `useSubscribe`, and the TanStack Query mutation now preserve UTM source, medium, channel, campaign, term, content, referring site, reactivation, and welcome-email controls.
- `reactivateExisting` is the explicit field; the existing `reactivate` alias remains supported for compatibility.
- Generated Server Actions now forward UTM term/content and caller-controlled welcome-email behavior while retaining the existing correct custom-field conversion.
- Executable generated-route tests assert the exact client payload, including scalar/list custom fields and every supported attribution/control field; form, hook, Query, template, and endpoint tests also pass.
- Final evidence: lint passed, strict typecheck passed, 816 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: revert the mutation field contracts, generated route conversion, Server Action fields, form propagation, tests/snapshots, and Ralph state. No migration or persistent data change is involved.
- BR-006 marked `passes: true`.

## BR-007 iteration 1 - passed

- Added a generated `/posts/[id]` route matching the URLs used by `usePost` and `usePostAccess`.
- The detail route always uses its configured publication, rejects camel/snake-case publication override probes, returns confirmed explicitly public posts, and denies restricted/draft posts until the application supplies server-side authorization.
- Deprecated the hook's publication override behavior and stopped forwarding it.
- Corrected the public list route to read `response.pagination` rather than nonexistent top-level pagination fields.
- Executable generated-route tests cover public detail success, restricted denial, override rejection before Beehiiv access, and exact nested offset metadata; hook tests cover the matching URL.
- Final evidence: lint passed, strict typecheck passed, 819 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: remove the post detail template/generator entry, restore the hook override behavior and old pagination mapping, and revert tests/snapshot/Ralph state. No migration or persistent data change is involved.
- BR-007 marked `passes: true`.

## BR-008 iteration 1 - passed

- Added generated `/authors/[id]` and `/tiers/[id]` handlers matching the URLs used by the exported detail hooks.
- Split list and detail responsibilities so list query parameters cannot silently select a different handler contract.
- Corrected author list responses to forward nested offset pagination and tier list responses to forward nested cursor pagination.
- Tier list routes now preserve cursor, type, active, and limit parameters when calling the client.
- Standardized bulk creation on the generated `/bulk-subscriptions` route across the CLI template and TanStack Query mutation.
- Executable generated-route tests cover both detail paths, exact client calls, both pagination styles, and the bulk mutation URL.
- Final evidence: lint passed, strict typecheck passed, 822 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: remove the author/tier detail templates and generator entries, restore list/detail query multiplexing and top-level pagination reads, restore the underscore bulk URL, and revert tests/Ralph state. No migration or persistent data change is involved.
- BR-008 marked `passes: true`.

## BR-009 iteration 1 - passed

- `createBeehiivClient` now resolves explicit credentials first, then `BEEHIIV_API_KEY`, then the `BEEHIIV_ACCESS_TOKEN` written by OAuth init.
- Exported the shared resolver from `beehiiv-react/server` and moved every generated route, Server Action, and blog artifact onto the shared client factory.
- Verified that an OAuth-only environment sends the stored access token as the Beehiiv Authorization bearer credential.
- Added an end-to-end OAuth init smoke that authenticates, fetches publications and fields, generates routes/actions/blog files, and verifies `.env.local` plus every generated server import.
- The first smoke run exposed invalid Handlebars parsing of JSX inline-style braces in the blog index. The template now uses typed style constants and the complete OAuth scaffold succeeds.
- Updated executable route mocks and template snapshots for the shared factory contract.
- Final evidence: lint passed, strict typecheck passed, 826 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: restore direct `BeehiivClient` construction in generated templates, remove OAuth fallback/resolver and the scaffold smoke, restore prior snapshots/mocks, and revert Ralph state. No migration or persistent data change is involved.
- BR-009 marked `passes: true`.

## BR-010 iteration 1 - passed

- Subscribe component generation now receives the selected transport capabilities instead of assuming Server Actions always exist.
- API-routes-only projects receive a CTA that posts to `/api/beehiiv/subscribe` and a wrapper, with no Server Action import.
- Server-Actions-only and combined projects receive the action-backed CTA, protected step-two enrichment component, and wrapper.
- Projects selecting neither transport no longer receive components that depend on missing generated infrastructure; the independent subscriber-status hook and analytics helper remain available.
- Added a four-way init matrix that generates complete projects, checks exact file presence/absence, compiles every generated TypeScript/TSX source, and scans for references to unselected transports.
- Updated the CTA template regression to cover both action-backed and route-backed output.
- Final evidence: lint passed, strict typecheck passed, 831 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: restore unconditional subscribe component generation and the action-only CTA template, remove the feature matrix, restore snapshots, and revert Ralph state. No migration or persistent data change is involved.
- BR-010 marked `passes: true`.

## BR-020 iteration 1 - passed

- `usePostAccess` now records the post ID associated with resolved data and requires it to match the current request before granting access.
- Starting a new request clears prior post data and its grant; failures also clear both rather than leaving an earlier public post authorized.
- Disabled mode and empty post IDs invalidate in-flight work, clear post state, and always deny access.
- Effect cleanup advances the fetch generation so stale responses cannot update state after an ID, enabled-state, or lifecycle change.
- Added hook regressions for successful resolution, empty responses, a failure after a prior grant, disablement, empty IDs, and an old success racing a newer empty result.
- Final evidence: lint passed, strict typecheck passed, 836 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: remove resolved-post identity tracking and the hook regressions, restore the prior effect and state retention behavior, and revert Ralph state. No migration or persistent data change is involved.
- BR-020 marked `passes: true`.

## BR-011 iteration 1 - passed

- Every publication-scoped TanStack Query hook now resolves `options.publicationId ?? context.publicationId` and includes that value in its cache key.
- Extended scoped keys across posts, subscribers, subscription lookups, custom fields, webhooks, segments, automations, referrals, tiers, authors, bulk creation/update jobs, and engagements; the account-wide publications list remains intentionally unscoped.
- Preserved entity-root prefixes, so existing broad mutation invalidation continues to match all filtered and publication-scoped descendants.
- Added a key-factory matrix proving all scoped resources differ between `pub_a` and `pub_b` and retain the publication value.
- Added a shared-QueryClient integration regression proving the same post ID under two provider publications performs two fetches and retains two independent cache entries.
- Verified root subscriber invalidation marks both publication caches invalidated.
- Added missing post and engagement expansion filters to their keys to prevent adjacent same-publication collisions.
- Final evidence: lint passed, strict typecheck passed, 839 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: remove publication scope from key options and hook call sites, restore unscoped detail/list factories, remove cross-publication tests, and revert Ralph state. No migration or persistent data change is involved.
- BR-011 marked `passes: true`.

## BR-012 iteration 1 - passed

- Added effect cleanup to every fetch-generation-backed hook so disablement, identifier removal, dependency changes, and unmount invalidate any request already in flight.
- Preserved existing manual refetch and pagination behavior while preventing an older success or failure from committing after the hook identity changes.
- Added deferred-response regressions for disablement, identifier removal, rapid identity changes, and unmount using the subscription detail hook as the representative contract.
- Final evidence: lint passed, strict typecheck passed, 843 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: remove the request-generation effect cleanups and deferred-response tests, then revert Ralph state. No migration or persistent data change is involved.
- BR-012 marked `passes: true`.

## BR-013 iteration 1 - passed

- Added synchronous positive-safe-integer validation for both requests-per-minute and maximum-concurrency scheduler limits.
- Invalid zero, negative, fractional, non-finite, and unsafe-integer values now throw descriptive `RangeError` instances before a queue can be created.
- Existing immediate dispatch, concurrency, spacing, rolling-window, error propagation, and FIFO coverage remains green.
- Final evidence: lint passed, strict typecheck passed, 855 tests passed, build passed, package smoke passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and build unused-import warnings remain assigned to BR-016.
- Rollback: remove constructor validation and its invalid-input matrix, then revert Ralph state. No migration or persistent data change is involved.
- BR-013 marked `passes: true`.

## BR-014 iteration 1 - passed

- Extracted a non-interactive scaffold orchestrator and routed the interactive `init` command through it, so CI exercises the same generation path shipped to users.
- Added a generated-project gate that packs the package, creates API-only, Server-Actions-only, combined, and transport-free Next.js workspaces, and installs the tarball once across the matrix.
- The gate resolves published library/server entry points through both CJS and ESM, runs strict TypeScript for every fixture, and completes four optimized Next.js 15.5.24 production builds.
- Added `npm run test:generated` to the pull-request/main CI workflow after the existing package smoke.
- The first fixture iteration exposed an ambiguous ESM module caused by generator `__dirname` usage; the fixture-only scaffold entry now correctly uses the same CJS runtime as the production CLI while published ESM consumers remain explicitly verified.
- Final evidence: lint passed, strict typecheck passed, 855 tests passed, build passed, package smoke passed, all four generated fixture builds passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and query-bundle unused-import warnings remain assigned to BR-016.
- Rollback: restore inline `init` orchestration, remove the scaffold entry and generated fixture script/CI step, then revert Ralph state. No migration or persistent data change is involved.
- BR-014 marked `passes: true`.

## BR-019 iteration 1 - passed

- Added explicit overload declarations to all 19 payload-bearing dual-signature endpoint methods, so an explicit publication ID cannot typecheck without the required create, update, tag, bulk, or query payload.
- Added shared runtime object and string-array guards with operation-specific `TypeError` messages for untyped JavaScript callers.
- Runtime validation occurs before every HTTP dispatch; the malformed-call matrix confirms all mocked HTTP methods remain untouched.
- Added a real TypeScript compile-fail fixture covering subscriptions, posts, webhooks, custom fields, automations and journeys, segments, tiers, bulk operations, and engagements.
- Preserved all existing valid default-publication and explicit-publication signatures and behavior.
- Final evidence: lint passed, strict typecheck passed, 857 tests passed, build passed, package smoke passed, all four generated fixture builds passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Existing React `act()` and query-bundle unused-import warnings remain assigned to BR-016.
- Rollback: remove overload declarations, runtime guards, contract matrices, and Ralph state. No migration or persistent data change is involved.
- BR-019 marked `passes: true`.

## BR-015 iteration 1 - passed

- Upgraded `vitest` and `@vitest/coverage-v8` together from 1.6.1 to 4.1.11, replacing the vulnerable Vite/Vite Node dependency chain.
- The complete development audit fell from 2 critical, 1 high, and 2 moderate findings to one low-severity transitive esbuild development-server finding.
- `npm audit fix` confirms there is no dependency-compatible automatic resolution for that remaining low finding; production dependencies continue to report zero vulnerabilities.
- All 857 tests pass on Vitest 4 without behavioral changes. The new Vite config-loader warning and pre-existing React/build warnings remain assigned to BR-016.
- Final evidence: lint passed, strict typecheck passed, 857 tests passed, build passed, package smoke passed, all four generated fixture builds passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Rollback: restore the prior Vitest and coverage versions plus lockfile, then revert Ralph state. No migration or persistent data change is involved.
- BR-015 marked `passes: true`.

## BR-016 iteration 1 - discovery

- Removed React `act()` warnings from the affected component and hook tests and eliminated the Vitest native-loader warning by using the ESM config extension.
- Split the provider context into a JSX-free module so the Query build no longer retains unused React/JSX imports or emits bundle warnings.
- Reconciled current documentation with the implemented 23 hooks, 9 components, 14 endpoint namespaces, and 22 templates. The final test baseline will be recorded after BR-021.
- During documentation reconciliation, found that `usePostBySlug` still forwards a caller-controlled publication override that the secured generated posts route rejects.
- Appended BR-021 as failing and added it to the final audit dependency list before implementation, per the Ralph discovery loop.

## BR-016 iteration 2 - passed

- The complete 859-test suite passes without React `act()`, Vitest config-loader, or other unexpected warnings. Its only stderr is five expected custom-field CLI progress messages.
- The dual ESM/CJS build completes with zero stderr and no unused React/JSX imports in the Query adapter.
- Current documentation now matches 23 hooks, 9 components, 14 endpoint namespaces, 22 templates, 859 tests, and 62 test files; version-specific historical release notes remain unchanged.
- Full evidence: lint passed, strict typecheck passed, 859 tests passed, warning-free build passed, package smoke passed, all four generated fixture builds passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Rollback: restore the prior context import, Vitest config filename, warning-producing test interactions, and documentation. No migration or persistent data change is involved.
- BR-016 marked `passes: true`.

## BR-021 iteration 1 - passed

- Retained the optional `publicationId` property as deprecated for source compatibility but removed it from slug URL construction and dependencies.
- The hook now agrees with the secured generated posts route: callers supply only an encoded slug, while the server owns publication scope.
- New hook regressions cover successful encoded slug resolution and suppression of a caller-controlled publication override; the generated posts security suite also remains green.
- Full evidence: lint passed, strict typecheck passed, 859 tests passed, warning-free build passed, package smoke passed, all four generated fixture builds passed, production audit reported zero vulnerabilities, and `git diff --check` passed.
- Rollback: restore publication override forwarding, remove the hook regression suite, and revert Ralph state. No migration or persistent data change is involved.
- BR-021 marked `passes: true`.

## BR-017 residual audit - discovery 1

- The fresh cross-route authorization audit found that the generated engagement analytics endpoint returned publication metrics without any application authorization check.
- The hook also forwarded a caller-controlled publication override even though generated routes must remain scoped to the server-configured publication.
- Appended BR-022 as failing and added it to BR-017 dependencies before implementation.

## BR-017 residual audit - discovery 2

- The public component contract review found that `SubscriptionForm.publicationId` has always been ignored even though its JSDoc and example implied it could override provider context.
- Appended BR-023 as failing and added it to BR-017 dependencies before changing the public documentation contract.

## BR-017 residual audit - discovery 3

- The post-list adapter scan found that `usePosts` and `usePostsQuery` still forwarded publication, visibility, and expansion inputs that the secured public posts route rejects by design.
- The Query adapter also exposed cursor pagination even though the generated posts route returns offset pagination.
- Appended BR-024 as failing and added it to BR-017 dependencies before implementation.

## BR-017 residual audit - discovery 4

- The final post-family scan found that `usePostQuery` still forwarded and cached under a caller publication override rejected by the secured generated detail route.
- Appended BR-025 as failing and added it to BR-017 dependencies before implementation.

## BR-017 residual audit - discovery 5

- The exhaustive generated-route inventory found the same silent publication-override mismatch in author and tier list/detail React and Query adapters.
- Appended BR-026 as failing and added it to BR-017 dependencies before implementation.

## BR-017 full-gate discovery 1

- The strict compile-contract subprocess took 6.2 seconds under full-suite contention and exceeded Vitest's unrelated 5-second default despite passing in focused runs.
- Appended BR-027 as failing and added it to BR-017 dependencies before assigning the heavyweight compiler test an explicit bounded timeout.

## BR-022 through BR-027 - passed

- Engagement analytics now deny by default before validation or Beehiiv access; authorized behavior stays server-scoped and validates the only supported expansion.
- Core and Query post adapters now match the generated public list/detail routes, suppress restricted parameters, use provider cache scope, and expose offset pagination.
- Author and tier list/detail adapters now match their server-scoped generated routes across both React and TanStack Query.
- `SubscriptionForm.publicationId` remains source-compatible but is accurately deprecated, and its example uses `BeehiivProvider`.
- The real strict TypeScript contract fixture has a test-local 15-second bound and passed twice in isolation plus in the full suite.
- BR-022, BR-023, BR-024, BR-025, BR-026, and BR-027 marked `passes: true`.

## BR-017 final audit - passed

- Re-reviewed every production change and generated route for authorization ordering, publication scope, unsafe HTML, stale requests, cache isolation, runtime/type contracts, package exports, and documentation drift.
- Every residual defect discovered during the audit was appended to the Ralph ledger before remediation; no failing or blocked story remains.
- Final evidence: lint passed, strict typecheck passed, 872 tests across 65 files passed, the dual ESM/CJS build produced zero stderr, packed CJS/ESM imports passed, all four generated Next.js 15.5.24 fixtures typechecked and production-built, the production audit reported zero vulnerabilities, and `git diff --check` passed.
- The complete development audit contains one low-severity transitive esbuild dev-server advisory with no compatible automatic fix; it does not ship in production, and no moderate, high, or critical findings remain.
- BR-017 marked `passes: true`; the Ralph loop is complete.
