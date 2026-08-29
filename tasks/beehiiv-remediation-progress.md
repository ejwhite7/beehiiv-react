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
