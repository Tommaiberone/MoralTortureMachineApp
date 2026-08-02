---
id: decision-1
title: ADR Log
date: '2026-07-29 11:22'
status: accepted
---
## Context

This log records durable product and architecture choices inherited from the
social-growth roadmap. New non-trivial decisions must be appended here rather
than silently embedded in an implementation task.


## Decision

### ADR-001 — Social comparison before a social network

Build profiles, invitations, comparisons, rematches, and private group play
before feeds, followers, comments, DMs, or public UGC. This keeps the growth loop
focused and avoids moderation cost before product validation.

### ADR-002 — Anonymous-first, progressive authentication

The first result and invite participation remain anonymous. Authentication is
requested only when it preserves concrete value such as history, comparisons,
purchases, notifications, or cross-device access. Anonymous activity is claimed
idempotently after login.

### ADR-003 — Deterministic and versioned moral computation

Archetypes and compatibility are computed by tested, versioned deterministic
logic. Groq may enrich copy, but it never determines scores and every experience
has a deterministic fallback.

### ADR-004 — One AWS production stack

AWS contains a single `prod` stack; development is local-only. Do not recreate
dev/staging AWS resources. This supersedes the old roadmap checkbox proposing
separate dev, staging, and production resources.

### ADR-005 — Shared web/Android product with explicit platform attribution

Web and Capacitor Android should diverge as little as possible. Both use the
same schemas and flows, while every new analytics event identifies its exact
platform and version. Inferred historical data stays visibly separate.

### ADR-006 — Async HTTP before realtime infrastructure

Moral Duel uses ordinary idempotent HTTP APIs. API Gateway WebSockets are
introduced only for active Party Rooms, with reconnect, idle close, and TTL.

### ADR-007 — Free-tier-conscious monetization foundation

Groq remains free, DynamoDB stays on-demand, ephemeral records use TTL, and
generated content is cached. Paid packs precede subscriptions; any variable-cost
service requires explicit approval, budget alarms, and a fallback.

### ADR-008 — Private-by-default sharing

Profiles are unlisted by default and shared through non-enumerable identifiers.
Public responses exclude account identity, private scores/answers, and internal
tokens. Public UGC remains disabled until moderation exists.

### ADR-009 — Separate operational analytics design

The analytics workspace uses a clean Notion-like interface independent of the
public horror theme. Route-scoped styling removes public visual effects while
the dashboard is mounted and restores them on exit.

### ADR-010 — Native OAuth through system browser and encrypted storage

Android uses a dedicated public Cognito client with Authorization Code + PKCE,
opens managed login in the system browser, and returns through the private
`moraltorturemachine://auth/*` scheme. Session and PKCE state are encrypted with
an Android Keystore AES-GCM key. This adds no native Google SDK, keeps the web and
Android flows aligned, and requires APK 1.3.0 while older APKs remain anonymous-compatible.

### ADR-011 — AWS Free Tier as a hard default

Every new AWS capability and material infrastructure change must use a
technically adequate AWS Free Tier service and configuration whenever one
exists. Eligibility, Region, shared limits, forecast usage, and expiry are
verified from current official pricing before implementation; serverless and
pay-as-you-go are not assumed to be free. A paid path requires a pre-provisioning
stop, explicit user approval, cost and alternatives, an owner, budget guardrail,
fallback or kill switch, and a recorded Backlog.md exception. This supersedes
the on-demand-by-default DynamoDB clause in ADR-007: current on-demand tables are
an audited exception pending `TASK-88`, while paid PITR is pending `TASK-89`.

### ADR-012 — Privacy-safe abuse signals before paid enforcement

The first anti-abuse layer uses a configurable sliding-window guard held in each
warm Lambda container, avoiding DynamoDB writes, AWS WAF, or another paid service.
This is best-effort across concurrent containers, but immediately protects the AI
and analytics-ingestion endpoints from ordinary bursts. Analytics may persist an
HMAC-peppered network pseudonym derived server-side, while API Gateway access logs
drop the raw source IP and add the request path. The admin API exposes only a
short derived mask, aggregate activity, risk level, and reason codes. `watch` and
`suspicious` always mean human review is required; they are not bot verdicts.

### ADR-013 — Cognito-only analytics access and timezone segmentation

The analytics workspace accepts only a verified Cognito ID token containing the
`admins` group; the client-supplied SSM key fallback is removed. The existing
Standard SecureString is retained solely as a server-side HMAC pepper for abuse
pseudonyms. Analytics records a bounded IANA-style timezone reported by the
device, alongside the selected in-app language, rather than deriving location
from an IP. This enables useful regional-time and language segmentation without
collecting country, city, or raw network location.

### ADR-014 — Manual-only Google Play publishing from CI

The signed AAB is already built by `deploy.yml` on every push to `main`, but
publishing it to Google Play is a separate `play-store-publish` job gated
strictly behind an explicit `workflow_dispatch` run with
`publish_to_play_store: true`; it never fires on an ordinary push. Options
considered: auto-publish on every push to `main` (rejected: most commits do not
bump `versionCode`, so Play would reject duplicate uploads, and an unattended
publish to a public app conflicts with the repository rule against deploying or
publishing without an explicit ask); a dedicated release branch/tag trigger
(rejected for now: adds workflow complexity before the team has multiple
release branches). Consequence: authentication uses one Play Console service
account JSON kept only as the GitHub secret `PLAY_STORE_SERVICE_ACCOUNT_JSON`;
the default target track is `internal`; the operator must still bump
`versionName`/`versionCode` per the existing mandatory version-bump rule before
triggering a publish, and Google Play still requires one prior manual release on
a track before the API can publish to it.

### ADR-015 — Backlog In Progress column allows multiple concurrent tasks

The former "at most one task In Progress" rule is removed from `CLAUDE.md` at
the user's explicit request; multiple tasks may be In Progress at once. This
was a workflow-hygiene rule, not a product or architecture constraint, so
relaxing it does not affect anonymous continuity, data, or deployment
guarantees recorded elsewhere in this log.

### ADR-016 — Read-only SEO and ASO intelligence with a human publishing gate

Search Console, GA4, PageSpeed and Google Play acquisition/Vitals data are
collected by a weekly GitHub Actions job into a private, short-retention report.
The system creates evidence-backed recommendations only: a scheduled run never
writes an issue, repository file, web page, Play listing, asset, release or
Android bundle. A human may explicitly request a GitHub review issue, while
any actual content or Play listing change remains a reviewed PR or a Play
Console experiment. Options considered: storing third-party analytics in a new
AWS data store (rejected: unnecessary cost/privacy surface) and granting the
service account Play store-presence edit permission to read listing text
(rejected: violates least privilege and makes accidental publication possible).
Consequently, the operational identity is read-only and current listing text is
kept as a human-maintained snapshot until `TASK-79` is eligible. GitHub uses
OIDC workload identity federation to obtain a short-lived token for the Google
service account, avoiding service-account JSON keys entirely.

### ADR-017 — Automatic direct-to-production Google Play publish on version bump

Supersedes ADR-014. At the user's explicit request (after being warned that this
removes any human review gate), `deploy.yml` now auto-publishes the signed AAB
straight to Google Play's `production` track whenever a push to `main` raises
`versionCode` in `frontend/android/app/build.gradle` (detected by diffing that
file between `github.event.before` and `github.sha`); an ordinary push that does
not touch `versionCode` still builds Android artifacts but skips publishing.
Manual `workflow_dispatch` with `publish_to_play_store` remains available and
keeps its selectable `play_store_track` input, for ad-hoc tests against
`internal`/`alpha`/`beta` without needing a version bump. Consequence: any
`versionCode` bump merged to `main` now goes live to every Play Store user with
no staged rollout and no human approval step between commit and public release;
the only safety net is Google's own app review and the existing mandatory
version-bump/Android-rebuild-warning rules in `CLAUDE.md`, so a bad release can
only be stopped by a fast-follow fix commit, a manual halt/rollback in Play
Console, or removing this job. This intentionally trades release safety for
release speed and must be revisited if it causes a production incident.

### ADR-018 — Web-only opt-in GA4 without advertising features

GA4 is introduced as a separate, optional web measurement layer, rather than
as a replacement for the existing privacy-safe first-party product analytics.
Before an affirmative choice, the app does not request the Google tag or set
Google Analytics cookies. On acceptance it grants only `analytics_storage`;
`ad_storage`, `ad_user_data`, and `ad_personalization` remain denied, while
Google signals and ad-personalisation signals are explicitly disabled. The
choice is retained in a first-party cookie for 180 days, and the fixed Privacy
preferences control lets a visitor withdraw or reconsider it. The GA4
Measurement ID is injected only into the web deployment build, so this change
does not alter Android runtime behavior or require an APK rebuild. The public
web privacy notice names Tommaso Bersani as controller, identifies the contact
email, and states the selected two-month GA4 data retention.

### ADR-019 — One-purpose GA4 retention administration workflow

The existing growth-intelligence identity remains read-only in normal use. To
apply the explicitly chosen two-month GA4 event and user data retention, a
separately gated job runs only when the `configure_ga4_retention` input of the
existing `workflow_dispatch` workflow is set to true; the scheduled report
cannot enter this job. It requests the `analytics.edit` scope through the same
GitHub OIDC federation, patches only the two retention fields for the
configured property, and reads the singleton setting back before succeeding.
This avoids local OAuth client credentials and limits the temporary GA4 Editor
role to one auditable change; the account owner should restore the service
account to Viewer afterwards.

### ADR-020 — Intent-led bilingual landing cluster before scaled SEO

The first non-brand SEO implementation consists of six hand-authored routes:
English and Italian pages for a moral dilemma test, ethical dilemmas, and a
moral dilemma game. Each page has a distinct canonical URL, reciprocal
`hreflang`, sitemap entry, visible FAQ, internal links, and a CTA into the
existing anonymous flow. Search Console and consented GA4 are used only to
evaluate these pages; the scheduled intelligence workflow remains read-only.
Options considered: creating many keyword/city/question variants (rejected as
thin or scaled content risk) and waiting for server rendering before publishing
any useful content (rejected for now because the existing application already
uses React routing and the small static cluster can be crawled and validated
without infrastructure or AWS cost). Consequence: future landing expansion is
editorial and evidence-gated; a pre-rendering evaluation remains appropriate if
crawl/indexation evidence shows the SPA is a material limit.

### ADR-021 — Demand radar separates discovery signals from demand claims

The Growth Intelligence report gains an outside-in demand radar using a small
checked-in EN/IT intent seed set and a read-only autocomplete request. It marks
candidate phrases as directional by default, observed only when the exact term
has Search Console impressions, and quantified only when a human-exported
Keyword Planner CSV supplies monthly volume and competition. It also marks
whether an idea is already covered and whether the current product or only a
future roadmap item can fulfil it. Options considered: an automated Google Ads
API integration (rejected for now because it needs a developer token and a
user-authorized Ads account) and treating autocomplete as keyword volume
(rejected as misleading). Consequence: the weekly report discovers adjacent
intent without AWS cost, Google Ads credentials, campaigns, or publication;
the owner may add a reviewed CSV later to quantify only the candidates worth
investigating.

### ADR-022 — Preserve market coverage and product-safety context in the radar

The radar renders its top candidates independently for each market rather than
using one global truncation, because a dense Italian or English suggestion set
must not make the other market disappear. Configured term rules can also mark a
candidate as requiring policy review, including psychological-claim and
minors-audience wording. Options considered: a single global ranking (rejected
after the first live run hid English entries) and silently dropping sensitive
phrases (rejected because they are useful research signals but unsafe content
instructions). Consequence: risky candidates remain visible with an explicit
do-not-publish-without-review label, and market comparison stays possible.

### ADR-023 — Search Console access failure is a property-identifier regression

The full report run `30619056214` successfully exchanged GitHub OIDC credentials
but received HTTP 403 from Search Console. The owner confirmed the service
account already has access to the Domain property, so the fault is the URL-prefix
identifier in the workflow configuration. The report must use the exact domain
property identifier `sc-domain:moraltorturemachine.com`; it must not widen the
workload identity, add a static key, or remove the source. A new run must confirm
the absence of 403. The related remediation is `TASK-97.5`.

### ADR-024 — Recommendation evidence is aggregated, staged, and historical

Search Console retains its detailed query/page/device/country response for
diagnosis but adds a separate query/page aggregate for recommendation thresholds
and radar matching, avoiding small-traffic fragmentation. The demand radar can
produce at most two current-fit, autocomplete-confirmed validation briefs per
market; it never produces a publication instruction, and future-fit or
policy-review ideas are excluded. Recent report artifacts are read through the
GitHub Actions read-only API and retained for 90 days so that material,
non-brand query changes can be compared week to week without AWS storage.
PageSpeed runs per configured landing and Play Vitals uses bounded retry for
transient errors. Options considered: lowering all thresholds (rejected as
noise), a database for history (rejected for cost/privacy surface), and
auto-publishing content from radar output (rejected as unsafe/scaled SEO).

### ADR-025 — Deterministic nearest-centroid moral archetype engine

`TASK-25`/`TASK-26` add a moral archetype to `POST /analyze-results` without
touching the existing Groq analysis. Fourteen archetypes, each an editorial
bilingual (IT/EN) content record plus a fixed six-dimension centroid, live in
`backend/data/archetypes.json` (versioned as a whole via a single `version`
field). `backend/src/archetype_engine.py` averages a user's per-dilemma
dimension scores, exactly as `/analyze-results` already did, then assigns the
archetype with the lowest Euclidean distance to that average; a tie resolves
to the lowest archetype id so the result never depends on dict/iteration
order. The engine takes no AI input and is covered by fixtures that recover
every archetype exactly at its own centroid plus one verified equidistant
boundary case. Options considered: a rule-based decision tree per dimension
threshold (rejected: harder to keep symmetric/testable across six axes and to
version as a single unit) and letting Groq name the archetype (rejected:
violates the product rule that AI enriches but never determines scores).
Consequence: the archetype is fully available even when Groq is down or
rate-limited, which also derisks `TASK-27`'s Groq-fallback and
persistence work still to come; adding an archetype only requires appending
one entry to the JSON file and bumping `version`. `TASK-25`'s copy is
AI-drafted and stays open pending an explicit human content/visual review
before that task is marked Done.

### ADR-026 — Lambda package gains flat sibling modules with layout fallback

`backend_fastapi.py` had no internal module dependencies before ADR-025, and
`.github/workflows/deploy.yml` copies only that single file (flat, no `src/`
or `data/` subfolder) into the Lambda zip, with `backend_fastapi.handler` as
the configured entry point. Restructuring the zip into `src/`+`data/`
subfolders would also require changing the deployed Lambda `handler` setting,
a higher-risk production change for a content/algorithm task. Instead,
`archetype_engine.py` and `archetypes.json` are added as two more flat `cp`
lines in the same build step, and both the import in `backend_fastapi.py` and
the data-path lookup in `archetype_engine.py` try the flat (Lambda) layout
first and fall back to the repository's `backend/src/` + `backend/data/`
layout. Verified locally against all three real invocation shapes: unit tests
importing `backend.src.backend_fastapi` from the repo root, local `uvicorn
src.backend_fastapi:app` from `backend/`, and a flat directory simulating the
deployed zip. Consequence: no Terraform or handler change was needed for this
task; a future restructuring of the Lambda package should revisit this
fallback.

### ADR-027 — Users table with a single-table anonymous-claim lock

`TASK-12`/`TASK-13` add a `users` DynamoDB table keyed by immutable Cognito
`sub`, with two dependency shapes (`require_authenticated_user`,
`get_optional_user`) rather than one, so anonymous endpoints can stay
anonymous while new authenticated ones exist side by side. Claiming an
`anonymous_user_id` uses a claim-lock item in the *same* table
(`sub = "anon#<id>"`) with a conditional `PutItem` (`attribute_not_exists(sub)
OR ownerSub = :owner`) instead of a second table or a read-then-write check:
this makes a repeat claim by the same account a no-op and a claim by a
different account an atomic, race-free 409, with one table and no additional
IAM surface. Options considered: a GSI-based reverse lookup (rejected: more
moving parts for the same guarantee) and read-then-write (rejected:
race-prone). The table uses provisioned 1/1 RCU-WCU within the always-free
allowance rather than on-demand, per the CLAUDE.md instruction not to copy
the legacy tables' on-demand default; PITR is left disabled pending
`TASK-89`.

### ADR-028 — Account export/deletion scope matches what currently exists

`TASK-15` ships `GET /users/export` and `DELETE /users/me` scoped to exactly
the `users` table record (no other domain stores data keyed by `sub` yet), and
a public, unlinked `/delete-account` web route that reuses the existing
Cognito web/Android auth flow rather than building a parallel one. Deletion
also releases every claimed `anon#<id>` lock item so that anonymous activity
becomes claimable again rather than orphaned. Consequence: no retention
exception exists to document today; this scope must be revisited as soon as
`TASK-28`+ introduces account-linked data.

### ADR-029 — Dedicated rate-limit bucket for authenticated writes

`TASK-17` adds an `auth_write` bucket (default 10/minute) to the existing
zero-cost sliding-window guard, applied only to
`/users/claim-anonymous-data`, `/users/me`, and `/auth/me`. Reusing the
existing guard (rather than a new mechanism) keeps public reads unaffected
and keeps the 429/Retry-After behavior identical across all buckets.

### ADR-030 — Production analytics ingestion was silently broken; fixed

While validating web/Android funnel parity (`TASK-7`) against the real
production account (read-only AWS CLI access), `prod-moral-torture-machine-
product-events` was found to have zero items since launch. CloudWatch Logs
showed why: the Lambda IAM role was missing `dynamodb:BatchWriteItem` (used
by `product_events_table.batch_writer`), so every `POST /analytics/events`
batch — web and Android identically — failed with `AccessDeniedException`
and was silently requeued client-side forever. `dynamodb:DeleteItem` was also
missing before it would have hit the same failure via `TASK-15`'s new
`DELETE /users/me`. Both actions were added to `backend/terraform/main.tf`'s
`lambda_permissions` policy. This is a production-config bug fix, not a
platform-parity gap: both platforms failed identically, so today's
essentially-zero "exact platform" coverage is an artifact of this bug, not a
web-vs-Android instrumentation difference. Consequence: requires
`terraform apply` to take effect; until then, every new-schema analytics
event continues to be lost.

### ADR-031 — One shared SNS topic for budget and operational alarms

`TASK-8`/`TASK-9` add one AWS Cost Budget ($200/month, notifications at
$10/$50/$200 actual spend) and four CloudWatch alarms (Lambda errors,
Lambda duration, API Gateway 5xx, API Gateway latency), all posting to one
new `aws_sns_topic.ops_alerts` with an email subscription
(`backend/terraform/observability.tf`). Alarms use absolute-count thresholds
(≥5 events/15 min) rather than an error *rate*, and `treat_missing_data =
"notBreaching"`, specifically to avoid noise at this project's low traffic
volume, where a rate metric's small denominator would make ordinary
variance look alarming. Recipient and first-response steps for every
notification are documented in the new `docs/OPERATIONS_RUNBOOK.md`, per
`TASK-8` AC2/`TASK-9` AC2. Consequence: requires `terraform apply`; the email
subscription remains `PendingConfirmation` until the confirmation link is
clicked once.

### ADR-032 — Auto-load and background-prefetch the evaluation dilemmas

`TASK-22` removes the separate click previously required to fetch the first
dilemma (a mount-time `useEffect` now calls it automatically) and prefetches
the next dilemma in the background as soon as a choice is recorded, while the
reveal/tease for the current one is on screen. The prefetched dilemma is held
in a ref (not React state) since nothing renders from it directly; the
"next dilemma" click consumes it instantly instead of triggering a new
network call when it's already available. Onboarding-skip-for-returning-users
(the third acceptance criterion) was already correctly implemented before
this task.

### ADR-033 — Frontend error reporting reuses the analytics pipeline

`TASK-74` reports uncaught errors, unhandled promise rejections, and React
error-boundary catches through the *existing* `trackEvent`/`/analytics/events`
pipeline as a `frontend_error_reported` event, rather than introducing a
separate error-tracking service or endpoint. This gives correlation to
platform/appVersion/schemaVersion and non-blocking, fire-and-forget delivery
for free, and keeps the payload to five fixed technical fields (error
name/message/stack, component stack, route), each truncated to 200 characters
client-side (the backend rejects rather than truncates longer property
values). Options considered: a third-party error-tracking SDK (rejected: new
variable-cost service requiring the same Free Tier review as any other
addition, for a need the existing pipeline already covers).

### ADR-034 — Canvas-rendered share cards omit percentile until real data exists

`TASK-31` renders the Stories (9:16) and square (1:1) archetype share cards
entirely client-side on an HTML canvas (`frontend/src/utils/shareCard.js`),
with a font-fitting routine that shrinks text until it fits a fixed line
count rather than shipping separate IT/EN layouts. The card deliberately
omits a "percentile" element that the original task description mentioned:
computing one honestly requires a real population of stored profiles
(`TASK-28`, not built yet), and fabricating a number would conflict with the
product rule that archetypes and any comparison built on them stay
deterministic and testable. Consequence: revisit the card layout once
`TASK-28` ships to add a real percentile.

### ADR-035 — Italian temporarily hidden app-wide, SEO landing pages exempt

`TASK-101`, at the user's explicit request: the app (test/tutorial/results/
home/account screens) is forced English-only by removing `LanguageDetector`
and setting `lng: 'en'`/`supportedLngs: ['en']` in `frontend/src/i18n.js`,
and by no longer rendering `LanguageSelector` on `HomeScreen`. Nothing
Italian is deleted — `it.json`, Italian dilemmas/story flows, and the
component itself all still exist, so this is a config-level, reversible
change. The user explicitly chose to exempt the bilingual EN/IT SEO landing
pages (ADR-020): they are a running, already-indexed acquisition experiment
with real Search Console history, and undoing their indexing for a same-day
internal-app-only decision would discard weeks of data for no reason tied to
the app change. Making that exemption actually work required also removing
`SeoLandingScreen`'s `i18n.changeLanguage(locale)` call: that screen never
used `t()`/the global i18next instance for its own rendering (its content is
locale-prop-driven from `seoLandings.js`), but the call was silently flipping
the whole app's cached language to Italian for any visitor who reached an
`/it/...` landing page and then continued into the actual app. Consequence:
re-enabling Italian later means reverting `i18n.js` (commented inline) and
restoring the `HomeScreen` import; the SEO landing pages required no change
either way.

### ADR-036 — 1.4.0 (versionCode 10) release, at the user's explicit request

Backend/web (Users table, claim/export/delete account, auth-write rate limit,
AWS Budget + CloudWatch alarms, the `dynamodb:BatchWriteItem`/`DeleteItem` IAM
fix, evaluation auto-load/prefetch, frontend error reporting, share cards,
Italian hidden, trimmed homepage SEO links) already deployed automatically via
`.github/workflows/deploy.yml` on the `#9` merge push to `main` — verified
directly against production, not just from a green CI run: a live
`POST /analytics/events` test now returns `{"accepted":1}` (was a silent
`AccessDeniedException` before), `prod-moral-torture-machine-product-events`
went from 0 to real items, and the 4 CloudWatch alarms plus the
`prod-moral-torture-machine-monthly-cost` budget exist in the account. The SNS
email subscription remains `PendingConfirmation` until the owner clicks the
confirmation link. `versionCode` 9 → 10, `versionName`/`package.json` 1.3.2 →
1.4.0 (minor: new backward-compatible features, no breaking change) is the
one remaining piece: per ADR-017 this makes the next push to `main`
auto-publish straight to Google Play production with no human review gate.
The user was explicitly warned this is an immediate, live, all-users publish
(not a staged/internal one) before it was triggered, per their own
instruction to flag hard-to-reverse actions going forward, and confirmed
production.

### ADR-037 — Moral Duel data model: profiles own dilemma sets, tokens are non-enumerable

`TASK-28`/`34` implement the core social loop's data layer. A `moral_profiles`
record is owned by `ownerAnonymousUserId` (never the Cognito sub), matching
the anonymous-first product rule (ADR-002): a profile — and therefore a
challenge created from it — can exist before any login. Each profile stores
the `dilemmaBaseIds` it was built from (language-neutral, shared across
`dilemmas_en.json`/`dilemmas_it.json`) so that creating a Duel challenge from
that profile fixes the exact same dilemma set for the invitee, served in
their own language via a new `GET /dilemmas/by-ids` batch lookup. Both new
non-enumerable token families (`publicId`, `challengeToken`) use
`secrets.token_urlsafe(16)`, matching the existing claim-lock/user-record
pattern's cryptographic rigor. `moral_profiles` has no TTL (a profile is
persistent, shareable product content); `challenges`/`challenge_participants`
do (30 days), so an abandoned invite disappears without manual cleanup. All
three tables are provisioned 1/1 within the shared Free Tier, following the
`TASK-12` Users-table precedent rather than the legacy on-demand default.

### ADR-038 — Duel state transitions are idempotent at the DynamoDB level, not just in application code

`TASK-35`/`36`: every write endpoint (`join`, `submit`, `revoke`, status
updates) uses a `ConditionExpression`, not a read-then-write check, so a
retried request can never duplicate a participant, overwrite a submitted
answer, or race a concurrent request into an inconsistent state. A repeated
`join` by the same invitee succeeds as a no-op (`ConditionExpression`
allows the same `anonymousUserId`); a second, different invitee gets a 409
from the same conditional check failing. `submit` guards on
`attribute_not_exists(submittedAt)`, making answers genuinely immutable
once recorded — not just discouraged by convention. Expired/revoked
challenges return 410 (with distinct messages); state conflicts (already
completed, not yet completed) return 409; a non-participant gets 403. Every
endpoint accepts only the existing anonymous identity header, so the
invitee never needs an account, matching the growth loop in `doc-2`.
Added `POST /challenges/{token}/revoke` during this work after noticing
`TASK-34`'s "revocable" acceptance criterion had no actual endpoint; a
completed challenge cannot be revoked, since that would retroactively hide
an already-unlocked comparison from the invitee.

### ADR-039 — Compatibility scoring never depends on which dilemmas were used

`TASK-37`: `compute_compatibility` in the new `backend/src/compatibility_engine.py`
compares two participants' six-dimension averages by simple per-dimension
distance, entirely independent of AI and of the specific dilemma set behind
those averages. This keeps it naturally symmetric
(`compute_compatibility(A, B)` and `(B, A)` agree on every aggregate field,
only the raw `a`/`b` per-dimension values swap) and reusable beyond the
token-based Duel flow if a direct profile-to-profile comparison is ever
wanted later. `COMPATIBILITY_VERSION` is returned in every comparison,
mirroring `archetypesVersion`'s pattern.

### ADR-040 — Public profile CTA scoped to attribution, not cross-owner challenge creation

`TASK-29`: visiting `/p/:publicId` cannot spin up a Duel challenge *as* the
profile owner without their consent — `POST /challenges` already rejects a
`profilePublicId` the caller doesn't own (404, not distinguishing "not
found" from "not yours"). The public profile's CTA therefore sends the
visitor into their own evaluation flow instead, firing a
`profile_cta_clicked` event with the referring `public_id` for attribution
before navigating. Options considered: auto-creating a challenge from the
visited profile (rejected: lets anyone spawn challenges in a stranger's
name) and a direct profile-to-profile compare endpoint bypassing the
Duel/token flow (rejected for this pass: adds a second comparison mechanism
alongside the well-tested token-based one for a case doc-2's growth loop
doesn't call for). Consequence: the one canonical way two people compare
remains the attributable `/challenge/:token` link.

### ADR-041 — Challenge deep links degrade to web; native Android opening deferred

`TASK-38` ships `/challenge/:token` as a plain React Router route, reachable
identically on web and inside the already-open Android WebView. Tapping a
shared link from outside the app (e.g. a messaging app) opens the mobile
browser rather than the native app — the AC's explicit "or degrades to web"
path — because making it open the app directly would need Android App
Links (a hosted `assetlinks.json`, signing-certificate fingerprints for
every keystore, and Android's own asynchronous, sometimes-flaky
verification), the same trade-off already discussed and declined for
native auth earlier this session. Consequence: revisit only as a deliberate
follow-up task if native-app opening on share proves to matter for
conversion; today's web fallback is fully functional, not broken.

### ADR-042 — Own-challenge viewing shows a share view, not an Accept button (TASK-103)

Root cause of the live `[ CHALLENGE UNAVAILABLE ]` bug report: `join_challenge`
already correctly rejects joining your own challenge with a 400 (a creator
opening their own just-created share link), but `GET /challenges/{token}` gave
the frontend no way to know the viewer *was* the creator, so
`ChallengeLandingScreen` always rendered the generic invitee teaser with an
"Accept" button, and any non-OK `/join` response collapsed to the same generic
"unknown" error. Options considered: (a) leave the Accept button and only
improve the error message shown after the 400 — rejected, since it still lets
a real user click into a dead end; (b) have the backend compare the caller's
`X-Anonymous-User-Id` against the creator participant and return
`isOwnChallenge`, and have the frontend render a share-your-link view (with
WhatsApp/copy-link, matching the existing `ResultsScreen` share pattern)
instead of Accept whenever `isOwnChallenge` is true — chosen. The 400 guard
in `join_challenge` is kept as defense in depth, and the frontend now maps a
400 from `/join` to a specific `error_own_challenge` message rather than the
generic unknown-error copy, in case that path is still reached (e.g. a stale
tab). Consequence: creators previewing their own share link now see a share
prompt, never a broken "Accept" action; en/it locale keys added for parity
even while Italian app UI stays hidden per TASK-101.

### ADR-043 — "Routine serale" autonomous batch runner, gated only at deploy/email

`TASK-108`: added `.claude/commands/routine-serale.md`, a project slash
command (`/routine-serale`, or the trigger phrase "Vai con la routine
serale") that works through the Backlog `To Do` column autonomously,
prioritized High→Medium→Low then by `ordinal`, skipping `Open Points`/
`Blocked` and tasks whose `dependencies` aren't `Done` yet. Each task is
triaged before implementation: it proceeds unattended if it's code/tests/docs
with an objective target, and is left in place with a reason recorded in the
run's recap if it needs real device/manual QA, legal/content sign-off, an
open business decision, new external credentials/paid services, or any
irreversible production action beyond the run's own end-of-run deploy. Options
considered: a fully unattended run including deploy/publish (rejected: this
repo's `CLAUDE.md` already requires an explicit ask before every deploy/push,
and ADR-017 makes a `versionCode`-bumping push to `main` auto-publish straight
to Google Play production with zero human review, so folding that into a
"never ask" loop risks an unattended public release); a fully manual runbook
with no reusable artifact (rejected: defeats the point of a repeatable
routine). Consequence: the commit/push/SNS-recap step always requires one
explicit user confirmation in the same session even though everything before
it runs unattended, and the routine hard-stops instead of pushing if the
diff includes a `versionCode` bump, specifically because of ADR-017's
no-gate Play publish. The recap email reuses the existing `aws_sns_topic.ops_alerts`
topic (`backend/terraform/observability.tf`) via `aws sns publish`; no new
topic, subscription, or email service is introduced.

### ADR-044 — Accessible danger-red text variable, borders untouched (TASK-102/107)

Both tasks reported the same measured problem: `--text-danger`/`--horror-crimson`
(`#7a4a4a`) is used as a text color on `ResultsScreen`, `SeoLandingScreen`,
`ChallengeCompareScreen`, and `StoryModeScreen`, at 2.1-2.6:1 against the
theme's dark backgrounds — below WCAG AA. Rather than changing the shared
variable (which also drives button backgrounds and borders elsewhere and
would have altered more of the horror aesthetic than necessary), a new
`--text-danger-readable: #ce7e7e` keeps the same red hue at >=4.5:1 against
every dark background in use and is applied only where the color paints
text. `--creepy-sickly-green`/`--creepy-pale-green` (used only as borders, per
both tasks' own description) were brightened by mirroring the existing
red pair's RGB structure (`#5a2020`/`#7a4a4a` → `#205a20`/`#4a7a4a`, swapping
which channel dominates) rather than inventing new values, keeping the same
low-saturation, dark horror palette while making the yes/no button and
progress-dot color pairing distinguishable. Options considered: repainting
`--text-danger` globally (rejected: same variable also backs Story Mode
button backgrounds, so this would have changed non-text elements the tasks
explicitly called lower-priority) and a full palette redesign (rejected by
both tasks' AC4: fix values, don't redesign the theme). TASK-107 was a
duplicate of TASK-102's more detailed report and was closed alongside it.

### ADR-045 — Per-(status, path) cooldown on the new backend-error email alert (TASK-104)

Every 4xx/5xx response (and any uncaught exception) now emails the existing
`ops_alerts` SNS topic (ADR-031) through a new outermost middleware,
`notify_ops_of_errors`, registered after the burst guard so it also observes
429 rejections and exceptions raised further down the stack. A literal
per-request email for every 4xx would flood the owner's inbox: this API
raises `HTTPException` with 4xx status codes constantly as normal, expected
business outcomes (already-joined, already-submitted, not-found, invalid
token), not as bugs. Instead, `_should_notify_ops` coalesces to at most one
notification per `(status_code, path)` pair every
`OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS` (default 600s) per warm Lambda
container, mirroring the "avoid noise" reasoning already established for the
CloudWatch alarms in ADR-031. Options considered: emailing only 5xx
(rejected: the task explicitly asked for 4xx too, and an unusual/unexpected
4xx pattern is still useful signal); a global rate limit instead of per-signature
(rejected: would suppress an unrelated new failure mode while one endpoint is
noisy). IAM grants only `sns:Publish` on the existing topic ARN, no new AWS
resource is created, and a notification failure is caught and logged so it
can never affect the response it describes.

### ADR-046 — Analytics PII guard extended from property keys to property values (TASK-65)

Auditing TASK-65 found the architecture already correct: `users_table` (email,
keyed by Cognito `sub`) is never read by the analytics/abuse code paths,
which only touch `product_events`/`user_analytics` keyed by
`anonymousUserId`/`sessionId`, and `/admin/analytics/overview` already
returns only `_masked_identity()` hashes, never a raw identifier. The one
gap: `AnalyticsEvent.validate_properties` only rejected a property by its
*key* name (e.g. a field literally called `email`), so a client bug sending
an email address or bearer token under an innocuous key (e.g. `note`) would
have passed validation and been persisted. Added `_EMAIL_LIKE_PATTERN`/
`_JWT_LIKE_PATTERN` checks against the property *value* as well, at the same
ingestion-time Pydantic validator, so this is rejected before it ever reaches
DynamoDB rather than filtered later at read time. Options considered:
scrubbing/redacting matching values instead of rejecting the whole batch item
(rejected: silent data mutation makes a client-side bug invisible instead of
surfacing it) and value scanning at read/dashboard time only (rejected:
already-stored raw rows would remain the actual privacy exposure).

### ADR-047 — Share card tries the Web Share API before falling back to an anchor download (TASK-32)

`downloadShareCard`'s `<a download>` approach is a fine web fallback but
does not reliably save a file inside the Android WebView the Capacitor app
runs in. `shareOrDownloadCard` (`frontend/src/utils/shareCard.js`) now
converts the generated PNG data URL to a `File` and, when
`navigator.canShare({files})` is true, calls `navigator.share({files})` to
open the native share sheet directly - this is a standard Web Share API
capability of the WebView's underlying Chrome engine, so it needed no new
Capacitor plugin and therefore no native project change or Android rebuild.
Only when file sharing isn't available (mainly desktop browsers) does it
fall back to the existing anchor download; a user-cancelled share
(`AbortError`) is treated as a completed interaction, not a failure that
should also trigger a download. Options considered: adding
`@capacitor/filesystem` plus the native `@capacitor/share` `files` option
(rejected for this pass: a new native dependency requires `npx cap sync` and
a fresh Android build, which `CLAUDE.md` requires warning the user about
before doing, and the Web Share API route reaches the same outcome without
that cost). `ResultsScreen.jsx`'s `share_card_downloaded` event now also
records which method actually ran (`native_share`/`native_share_cancelled`/
`download`), which is needed to tell whether Android users are actually
getting a working share path.

### ADR-048 — PITR cost accepted as-is; not worth an active decision (TASK-89)

`TASK-89` asked whether to keep Point-in-Time Recovery enabled on the three
legacy tables that have it (`dilemmas`, `user-analytics`, `story-flows`).
PITR is billed per GB of table size per month, and the largest of the three
(`user-analytics`) is ~7MB - at current size the real monthly cost is a
fraction of a cent, not a meaningful line item even before Free Tier
considerations (PITR has no Free Tier allowance at all, so this is pure
out-of-pocket cost, just a negligible one). Spending effort to evaluate
disabling it would cost more attention than it would ever save in dollars,
and disabling it removes a genuine safety net (accidental delete/overwrite
recovery) for a real cost difference of essentially $0. Decision: leave PITR
enabled on all three tables as-is; revisit only if one of them grows large
enough (multiple GB) that the PITR line actually becomes visible in the AWS
Cost Explorer breakdown. No infrastructure change made.

### ADR-049 — Archetype and AI verdict merged into one card, AI prompt now archetype-aware (TASK-120/121)

`TASK-121`, at the user's explicit request: `ResultsScreen` previously showed
two separate cards - a deterministic archetype card (name, description,
strength, blind spot) and a separate Groq-generated "verdict" card - with no
connection between the two other than both being computed from the same
dimension averages. They are now one `.results-archetype` card: the
archetype name is the card's `<h2>` title, and the Groq-generated text
renders immediately below it as the card's description, with strength/blind
spot still listed underneath. To make that pairing make sense, the
`/analyze-results` prompt (both language branches) now also sends the
already-assigned archetype's name and description, with an explicit
instruction that the generated text will be shown as the description right
under that name and must read as a natural elaboration of it, not a
contradiction or a verbatim repeat. The archetype assignment itself is
unaffected (still computed by the deterministic engine before the Groq call,
per ADR-025/ADR-003) - only the prompt for the AI's own text changed.
Consequence for failure handling: since the merged card used to be gated on
`archetype` alone, a totally failed `/analyze-results` call (archetype never
set) would have made the whole card - including the existing fallback error
text - disappear instead of just losing its title; the card is now shown
whenever there's an archetype, a loading state, or an AI text/fallback
message, and the title/strength/blind-spot rows only render when an
archetype is actually present. `results.archetype_title` and
`results.verdict` (the two old card headings) and their now-orphaned CSS
rules were removed. Options considered: keeping both cards side by side and
just visually grouping them (rejected: doesn't match "una sola scheda", and
the point of passing archetype context to the AI is specifically so the
verdict text itself can stand in for the description); dropping
strength/blind-spot entirely since the user only asked for title+AI text
(rejected: no instruction to remove already-useful deterministic content, and
keeping them costs nothing extra now that they're inside the same card).

`TASK-120`, also at the user's request, separately added a discoverable
account entry point: a round icon in the top-right corner of `HomeScreen`
only (not a global nav element) linking to a new `/account` route, which
renders the existing `AccountDeleteScreen` component (already covering
login/logout/export/delete since `TASK-15`/ADR-028) rather than a new
duplicate screen. Privacy Policy and Cookie Policy links were added to that
screen's three render branches. `/delete-account` keeps working unchanged
(no route removed) since nothing in-repo hardcodes it as the only entry
point.

### ADR-050 — Party Room uses HTTP polling, not API Gateway WebSocket (TASK-46/47/49/91)

Supersedes the WebSocket assumption in ADR-006 for Party Room specifically.
`TASK-91` existed to compare API Gateway WebSocket against polling HTTP and
other AWS alternatives before any Party Room provisioning, flagging that the
WebSocket API Gateway Free Tier is limited to a new account's first 12
months and so cannot be assumed free on the existing `personal` account. At
the user's explicit request, that comparison resolved in conversation
(not via a live AWS pricing check, since the decision to avoid WebSocket
entirely made one unnecessary) in favor of polling HTTP: the client polls
room state periodically over the same API Gateway HTTP + Lambda + DynamoDB
pattern already proven for Moral Duel and already fully covered by the
DynamoDB/Lambda always-free tier per the `doc-1` Free Tier audit - no new
AWS resource type, no `$connect`/`$disconnect` connection lifecycle to
manage, no connection-minutes billing, and no introductory-Free-Tier expiry
risk. The reveal countdown is synchronized by sending a deadline timestamp
from the server; the client computes and renders the countdown locally
rather than requiring a push at each tick. Options considered: API Gateway
WebSocket as originally scoped in `TASK-46` (rejected: real risk of losing
Free Tier coverage on this account, plus meaningfully more implementation
surface for connection lifecycle and reconnect); Server-Sent Events
(not evaluated in detail: still a persistent connection with its own Lambda
concurrency/timeout shape, without polling's advantage of reusing the exact
already-audited request/response pattern). Consequence: `TASK-46`/`47`/`49`
descriptions were updated to specify polling instead of WebSocket;
`TASK-91` is closed since the comparison it asked for is resolved, and its
cost/limits question is now `TASK-49`'s load test to answer (request volume
under polling, not connection-minutes). The tradeoff accepted: presence and
vote updates lag by roughly one poll interval (1-2s) instead of arriving
instantly, judged acceptable for a party game typically played among people
in the same physical room; if `TASK-49` later shows polling request volume
becoming a real cost or scaling problem at higher concurrent room counts,
this decision should be revisited.

### ADR-051 — Party Room core loop: lazy phase advance, short human-shareable room codes (TASK-46/47)

Implements the core loop for ADR-050's polling design. Two provisioned 1/1
tables (`party_rooms`, `party_participants`, 6h TTL) hold room and
per-participant state; `party_participants` stores each participant's votes
as a nested map keyed by round index, with `chosenValues` serialized to a
JSON string rather than a native DynamoDB Map (boto3's resource API rejects
raw Python floats in attribute values - this mirrors the same `json.dumps`
pattern `moral_profiles.dimensionAverages` already uses, and avoids returning
mixed Decimal/float types that would break the archetype engine's
arithmetic). The room code is 6 characters from a 32-symbol alphabet
excluding visually ambiguous characters (0/O/1/I/L), not a long
`secrets.token_urlsafe` token like Duel's: it is meant to be read aloud,
typed, or QR-scanned by people who are typically in the same physical space
for a session lasting hours, not a long-lived link shared over an
untrusted channel, so it does not need the same entropy.

There is no dedicated "advance to next round" endpoint. `_advance_party_room_if_due`
runs at the start of every read (`GET /party-rooms/{code}`) and write
(join/vote), and moves `lobby -> question -> reveal -> question... ->
completed` purely from a stored `phaseEndsAt` timestamp and a live count of
votes for the current round, applying the transition with a DynamoDB
`ConditionExpression` so a concurrent double-advance from several
simultaneously polling clients is a no-op, not a bug. This means no single
client - in particular not the host's, which could be backgrounded or
closed - needs to stay active for the room to progress, and every poller
observes the same lazily-computed state. Options considered: a host-driven
"advance" endpoint (rejected: makes the host device a single point of
failure for the whole room) and a scheduled Lambda sweeping active rooms
(rejected: adds a new invocation trigger and moving part for something a
read-time check already gives for free).

Never expose a participant's raw `anonymous_user_id` to other participants
in the same room (only `isCaller` on their own entry) - the same
non-enumerable/no-internal-IDs rule applied everywhere else, initially
missed in a first draft of the participant list and caught before merging.

Deferred to follow-up work: `TASK-48` (group awards - closest pair, moral
minority, most controversial - and a shareable recap card) and `TASK-49`
(load test 2-20 participants, which is what should validate or invalidate
the specific rate-limit and round/reveal duration constants chosen here:
`PARTY_ROOM_ROUND_DURATION_MS`=20s, `PARTY_ROOM_REVEAL_DURATION_MS`=8s,
`ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE`=90).

### ADR-052 — Party Room group awards reuse the Duel compatibility engine; each award can be legitimately absent (TASK-48)

`backend/src/party_awards.py` computes Party Room's three group awards
(closest pair, moral minority, most controversial dilemma) as pure,
deterministic functions over participant-index keys, deliberately reusing
`compatibility_engine.compute_compatibility` instead of a new pairwise
distance formula, so Party Room and Duel agree on what "aligned" means and
the same fixture-style tests apply. Moral minority is only returned for
rooms with 3+ participants: with exactly 2 people, there is no majority for
either one to be a minority *of*, so returning one would fabricate a signal
rather than measure one - the same "don't invent a number the product can't
honestly support" reasoning as ADR-034's dropped percentile. Each award key
is independently nullable in the response for this reason, rather than the
endpoint failing or omitting the whole `awards` object when one doesn't
apply. The recap card (`generatePartyRecapCardDataUrl`/`sharePartyRecapCard`
in `shareCard.js`) required refactoring `shareOrDownloadCard`'s native-share
logic into a shared `shareOrDownloadDataUrl` helper so both the archetype
card and the new recap card get the same Web-Share-then-download fallback
(TASK-32/ADR-047) without duplicating it.

### ADR-053 — it.json allowed to drift; en.json is the only frontend target for new work (2026-08-02)

At the user's explicit request, after checking production analytics: Italian
is 153 of 20,174 events (0.8%) in `user-analytics` historically, and ~0 of
467 in `product_events` since `TASK-101` hid it app-wide. `CLAUDE.md` now
carries an explicit exception - new frontend work updates `en.json` only;
`it.json` is left as-is rather than kept in lockstep, reversing the practice
used through `TASK-120`/`121`/`122` (e.g. ADR-042's "en/it keys added for
parity even while hidden"). The bilingual EN/IT SEO landing pages (ADR-020)
are explicitly unaffected: their content lives in `seoLandings.js`, not
`it.json`, and continue to be maintained in both languages since they are a
running, already-indexed acquisition experiment, unlike the app UI. Options
considered: deleting `it.json`/Italian content outright (rejected: the user
asked to let it drift for a possible future re-merge, not to remove Italian
as an option) and keeping both maintained regardless of the low usage
(rejected given the measured signal - the user's own reasoning for asking).

### ADR-054 — Privacy/cookie footer moved from every screen to the account page only

At the user's explicit request: the small fixed Privacy/Cookies/preferences
widget (`PrivacyFooter` in `AnalyticsConsent.jsx`) was mounted globally in
`App.jsx` outside `<Routes>`, so it persisted on every screen including the
home screen even after the user had already made a consent choice - reported
as an unwanted permanent banner. `PrivacyFooter` itself is unchanged; only
where it mounts moved, from global to inside `AccountDeleteScreen.jsx`
(`/account`, `TASK-120`'s profile page), replacing the separate Privacy/
Cookies links added there in `TASK-120` so the page doesn't show two
redundant link groups. `AnalyticsConsent` (the first-run accept/reject
dialog, which already auto-hides once a choice is made) stays mounted
globally and unchanged - it was not what was reported as a persistent
nuisance. Consequence: the persistent privacy/cookie entry point is now one
tap away via the profile icon (`TASK-120`) rather than always on screen;
revisit if this proves too hard to find for a compliance-relevant control.

### ADR-055 — AWS tag values reject parentheses and commas, not just the characters already documented

Deploying the Party Room tables (`TASK-46`) failed `terraform apply` twice in
a row on `aws_dynamodb_table.party_rooms`'s `Purpose` tag: first for
containing `(`/`)`, then again after removing those for containing `,` -
both outside DynamoDB's tag `Value` character set, which in practice is
letters, numbers, spaces, and only `+ - = . _ : /  @`. This is the same
class of bug as the Duel table tags fixed in `6322b8a1`, so it is now
recorded here explicitly: **write new resource tag `Value`s (`Purpose`,
`Name`, etc.) in plain words with only `-`/`_`/`/` as punctuation, never
parentheses, commas, or other symbols**, and check them against the existing
tags already applied successfully in `backend/terraform/main.tf` before
adding a new one, rather than re-discovering this per resource. Each of the
two bad tag values required its own `versionCode` bump (`12` then `13`, both
never actually distributed since Terraform failed before the Android
build/publish jobs ran) purely to make the deploy pipeline's push-triggered
Google Play publish step re-fire on retry; the release that actually shipped
is `versionCode 14` / `versionName 1.5.0`.

## Consequences

- Growth is evaluated through attributable challenge completion and retention,
  not vanity engagement.
- Auth, profiles, duels, billing, and analytics must preserve anonymous continuity.
- Backend/API changes must remain compatible with distributed Android builds or
  trigger the mandatory pre-change APK rebuild warning.
- The backlog board, documents, and ADR log are the mutable source of truth; the
  former roadmap file is retained only as a migration notice.
- AWS pricing and Free Tier eligibility are implementation inputs that must be
  revalidated, not static assumptions copied from this audit.
