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
