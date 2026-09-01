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

### ADR-056 — Recharts legend/axis text forced readable globally, not per-chart (TASK-124)

TASK-102/107 fixed low-contrast *CSS* text colors but missed this: Recharts
renders its own legend and axis text with inline styles that default to
each data series' own color (here `--horror-crimson`/pale-green, the exact
values already flagged as unreadable as text) or an unstyled default,
neither controlled by the theme's CSS variables. Since Recharts sets these
as inline styles, only `!important` reliably overrides them; two global
rules in `shared.css` (`.recharts-legend-item-text`, `.recharts-text`) fix
every chart in the app (two pie charts, one radar chart) from one place
rather than passing color props per chart instance, so a future chart gets
readable text by default too. The pie charts' percentage labels needed a
custom label-render function per chart instead (`renderPieLabel`, duplicated
in `EvaluationDilemmasScreen.jsx`/`PassThePhoneScreen.jsx`) because Recharts
does not expose a fill override when `label` is a function returning a bare
string.

### ADR-057 — Party Room drops all visible timers in favor of consensus-driven advance (TASK-123)

At the user's explicit request (a game meant for in-person discussion, not a
race against a clock): `PARTY_ROOM_ROUND_DURATION_MS`/`PARTY_ROOM_REVEAL_DURATION_MS`
are replaced by `PARTY_ROOM_SAFETY_TIMEOUT_MS` (10 minutes), which is never
shown to a player - it exists purely so an abandoned room (someone never
votes, the host never returns) doesn't stay open forever. Voting now ends
only once every participant has voted; the reveal phase now ends only via a
new host-only `POST /party-rooms/{code}/advance`, mirroring the existing
host-only `start` precedent rather than introducing a new "everyone signals
ready" mechanic. `_advance_party_room_if_due` keeps its lazy-advance-on-every-read
architecture from ADR-051 unchanged - only what counts as "due" changed, so
no new state-machine paradigm was introduced for this. Options considered: a
much longer but still visible timer (rejected: the user specifically didn't
want a time pressure at all, not just a smaller one) and an "everyone ready"
toggle instead of host-only (rejected for this pass: adds a second piece of
per-participant UI state for a group size where a single host control is
already an established, understood pattern from the lobby's `start`).

The AI group verdict (`_generate_party_group_verdict`) is generated once
when a room first reaches `completed` and cached on the room record itself
(`groupVerdict` field, `attribute_not_exists` conditional write so a
concurrent duplicate generation never overwrites an already-cached one) -
same "persist and reuse AI output" rule as the main Results screen's verdict
(TASK-121). It receives only archetype *names*, never participant display
names, and always has a deterministic no-AI fallback sentence, so a
completed room's data is never blocked on Groq being available.

### ADR-058 — AnalyticsAdminScreen switches to single-panel tab navigation; registered-account count added (TASK-128)

The dashboard exposed no count of registered (signed-in) accounts at all -
every KPI was derived from anonymous event identities, so "how many people
have signed up" had no answer anywhere in the product. `_count_registered_users`
does a `Select=COUNT` scan of `users_table` filtered to
`attribute_exists(createdAt) AND attribute_not_exists(claimedAt)`, which
excludes the `anon#<id>` claim-lock rows written by `claim_anonymous_user_id`
(those never get a `createdAt`, only `claimedAt`) so the count reflects real
accounts only. It's a lifetime total, not scoped by the `days`/`platform`
query filters like the rest of the summary, since "how many signups do I
have" is inherently an all-time question; it reuses the endpoint's existing
60-second cache rather than adding a second cache layer. A scan failure logs
a warning and returns `null` (rendered as "—") instead of failing the whole
overview, matching the existing fallback pattern for a not-yet-deployed
`product_events` table just above it in the same handler.

Separately, and at the user's explicit request after finding the page "full
of detail with no essentials reachable by clicking": the five sections
(abuse, trends, funnel, breakdowns, recent events) move from one continuous
IntersectionObserver-driven scroll to single-panel tabs (`role="tablist"` /
`role="tabpanel"`) - clicking a sidebar item now shows only that section,
the rest unmount rather than merely losing scroll focus. Options considered:
a multi-open accordion (rejected by the user - explicitly wanted one section
visible at a time, not a scroll-with-collapsibles hybrid). The former
"Breakdowns" card (data sources/languages/time zones/app versions/top
dilemmas) becomes its own fifth tab instead of living inside the funnel
grid, since it was the densest single card and the funnel tab reads better
as just funnel + all-events-by-type. The always-visible KPI band above the
tabs drops `exactPlatform` (a data-quality/QA number, not a product metric)
in favor of the new registered-accounts count; exact-platform coverage moved
into the breakdowns tab as a caption instead of being removed.

### ADR-059 — Ops error alerts persisted to DynamoDB and coalesced by route signature, not literal path (TASK-129/130)

Triggered by two real production alert emails (`GET /party-rooms/V9NX5F
returned 429`, `GET /robots.txt returned 404`): the owner wanted them easier
to find and triage than "an email in an inbox", plus a way to periodically
clean up the ones that are clearly noise. Two changes, not one:

1. **Persistence**: `_notify_ops_of_error` now writes one item to a new
   `ops_error_alerts` table (provisioned 1/1, 30-day TTL - an audit trail,
   not permanent storage) every time it would send the SNS email, gated by
   the same cooldown so table growth stays bounded. Storage and the email
   toggle are deliberately decoupled (`_record_ops_error_alert` runs even
   when `OPS_ERROR_NOTIFICATIONS_ENABLED` is false) so disabling email noise
   can never silently stop the audit trail too.
2. **Coalescing key fix**: ADR-045's "one email per (status_code, path) per
   cooldown" turned out to barely coalesce anything on parameterized routes -
   `/party-rooms/V9NX5F` and `/party-rooms/AB12CD` are different literal
   paths, so every distinct room/profile/challenge got its own independent
   cooldown and its own email. `_request_path_signature` now prefers the
   matched route template (`request.scope["route"].path`, e.g.
   `/party-rooms/{room_code}`) when the router resolved one. The specific
   429 that prompted this never reaches the router at all -
   `enforce_zero_cost_burst_guard` short-circuits before routing - so for a
   429 the signature instead falls back to the burst guard's own rule name
   (`rate_limit:party_room_poll`, already parameter-independent by
   construction). Only a genuinely unmapped path (e.g. a bot on
   `/robots.txt`, see ADR-060) falls all the way back to the literal path,
   which is itself the useful signal there.

Options considered for the coalescing fix: hashing/truncating the literal
path to strip trailing segments (rejected - fragile against routes that
don't end in the varying segment); a global 429 cooldown regardless of rule
(rejected - would suppress an unrelated rate-limit rule going off while one
is noisy, same reasoning ADR-045 already rejected for a global 4xx cooldown).

`.claude/commands/ops-alerts-sweep.md` (TASK-130) is a new project skill,
modeled on `routine-serale.md`: it scans `ops_error_alerts` via the
`personal` AWS CLI profile, groups by `(statusCode, pathSignature)`, and
deletes only the groups whose cause it can determine from the code with
confidence and that need no further action (expected business-logic 4xx,
already-fixed causes, harmless bot noise). Anything else stays in the table
and is routed through the normal CLAUDE.md task-creation rules instead of the
skill silently modifying product code or infrastructure itself - this keeps
an unattended/periodic sweep from ever being the thing that changes
production behavior.

### ADR-060 — API domain serves a disallow-all robots.txt instead of 404 (TASK-131)

Found via the same alert email triage as ADR-059: `GET /robots.txt` on the
API domain (API Gateway/Lambda) was a genuine 404, because only the frontend
(CloudFront/S3) serves one - bots/scanners routinely probe robots.txt on any
host they hit, including an API that was never meant to be crawled. Since the
path never changes per-request, ADR-059's coalescing already limited this to
at most one email per cooldown per warm container, but that still means
recurring noise for as long as anything keeps scanning the API host. Added a
trivial `GET /robots.txt` returning a `200` disallow-all
(`User-agent: *\nDisallow: /`), which is both accurate (nothing on the API is
meant to be indexed) and removes the noise at the source rather than relying
on the alert pipeline or the sweep skill to keep absorbing it. The frontend's
own `robots.txt` (`frontend/public/robots.txt`, served for the actual
indexable site) is untouched.

### ADR-061 — Share cards enriched with real content instead of an emoji-and-quote label (TASK-133/134)

Growth review of the share/signup funnel found the share cards genuinely
weak: `generateShareCardDataUrl` rendered only an emoji, the archetype name,
and its `sharePhrase` - no data, nothing that reads as a real analysis. The
user's own words after seeing a first draft plan: "gli screenshot di share
fanno schifo, hanno pochissime info". Fix: the solo card now draws a mini bar
chart of the six dimension scores plus the archetype's `strength`/
`blindSpot` lines (data that already existed on the archetype/response, just
never reached the card). Separately, the Moral Duel comparison - the
highest-tension moment in the whole product - had no shareable card at all,
only a raw WhatsApp link for the rematch; `generateDuelCardDataUrl` fills
that gap (both archetypes, overall compatibility %, most/least aligned
dimension), reusing the Party Recap card's denser layout as the template
rather than the sparser solo-archetype one. Both stay canvas-rendered
client-side with no AI and no server round trip, unchanged from ADR's
original card-generation approach (TASK-31/32).

An earlier draft of this plan also proposed asking the sharer "who are you
challenging?" to personalize the share text. Rejected before implementation,
again at the user's explicit objection: the channel (a specific WhatsApp
chat) already personalizes the send target, so an extra input field would
have added friction for a benefit the channel gives away for free.

### ADR-062 — Duel pair insight (gated by login) replaces "save your result forever" as the login incentive (TASK-135, supersedes TASK-14's original framing)

TASK-14 (progressive login) had never actually been built - Google login
existed (TASK-5) but the `AuthButton` only ever rendered on the home page,
decontextualized from any moment of value. The first fix proposed was a
generic "save this result" prompt on the Results screen. The user rejected
it directly: "mi sa che il gancio del 'Salva il confronto per sempre' non mi
convince" - a deferred, abstract benefit is a weak incentive next to
immediate curiosity.

A second draft proposed gating the dilemma-by-dilemma breakdown of a
completed Duel behind login ("see exactly which 2 questions you disagreed
on"). This was caught during the mandatory doc-1 read *before* implementing
it: `TASK-39`'s own implementation notes and the `compare_challenge`
docstring are explicit that raw per-dilemma answers/choices are never
returned, even to the two participants themselves ("MAI risposte grezze ai
singoli dilemmi ne' testo delle scelte") - matching CLAUDE.md's blanket rule
against exposing "answer details" through an API. Gating that data behind
login would not have relaxed the rule for authenticated users; it would have
broken it outright.

Chosen instead: `pairInsight`, one short AI-enriched sentence (same
generate-once/cache-on-record/deterministic-fallback pattern as the Party
Room group verdict, `ADR-057`) interpreting what a specific archetype
pairing and its aggregate compatibility numbers mean - fed only archetype
names and already-public aggregate percentages, never per-dilemma data. This
keeps the "unlock something concretely interesting right now" psychology the
user was after without touching TASK-39's privacy decision, and without
regressing the existing aggregate comparison, which stays free for anonymous
callers.

### ADR-063 — Mandatory login from a second Moral Duel interaction (TASK-136), plus a CI bug that was silently blocking all Android login

The user asked, after the pair-insight redesign, for something stronger than
a dismissible prompt: "altrimenti mi sa che è meglio metterlo all'inizio
obbligatorio" (login mandatory at the very start). That conflicts directly
with an explicit product constraint (`doc-2`'s Social MVP definition of done,
"a visitor starts without an account"; `TASK-14` AC1) and with the baseline
74% test-completion rate doc-2 already measured, which is almost certainly
downstream of zero friction before the first result. Flagged as a conflict
per CLAUDE.md before implementing; the user, given that trade-off, chose the
narrower alternative instead of overriding the constraint outright.

Chosen design: the first Duel interaction (first challenge created, first
challenge joined) stays fully anonymous; from the second one on,
`require_authenticated_for_repeat_duel` requires a Cognito bearer token to
create or join a further challenge, and a rematch always requires one (it is
definitionally a repeat). "First interaction" reuses the existing
`moral_profiles` `OwnerIndex` GSI (`_has_prior_profile`) rather than adding a
new GSI or Scan - a profile only exists once someone has actually challenged
or been challenged before, so owning any profile besides the one for the
current action is a reliable, already-available signal.

While implementing this, auditing `TASK-18`/`TASK-86` (Android native login,
both `Blocked`, never device-verified despite complete-looking PKCE/Keystore
code) surfaced a real bug: `.github/workflows/deploy.yml`'s `android-build`
job never passed `VITE_COGNITO_DOMAIN`/`VITE_COGNITO_CLIENT_ID`/
`VITE_COGNITO_NATIVE_CLIENT_ID` into the web build it packages into the APK,
unlike `frontend-deploy`. Every distributed Android build therefore shipped
with Google/Cognito config empty, `isGoogleAuthAvailable()` permanently
`false`, and no login button ever rendered - almost certainly why those two
tasks could never be verified. Fixed in the same change.

This does not, by itself, prove Android login now works end to end - no
device test was run as part of this change (matches the existing "no browser
automation, verify UI changes by code review" rule; the same reasoning
extends to an Android device/emulator, which is equally unavailable here).
The user was told this explicitly and chose to proceed with the gate anyway
rather than wait for a device confirmation. `require_authenticated_for_repeat_duel`
is deliberately a single choke point so the gate can be disabled or narrowed
to web-only in one place if device verification turns up a problem, and
`TASK-18`/`TASK-86`'s acceptance criteria remain unchecked pending that
verification.

### ADR-064 — [regression] Invalid DynamoDB tag value silently blocked every deploy for five consecutive pushes (TASK-137)

Asked directly whether the just-pushed Cognito/login-gate work was actually
live on Play Store; checking `gh run list` to answer honestly showed every
deploy since `feat: persist ops error alerts to DynamoDB...` (2026-08-04
07:35, `TASK-129/130/131`) had failed in `Terraform Init & Apply`, including
this session's own push. Root cause: `aws_dynamodb_table.ops_error_alerts`'s
`Purpose` tag contained a comma ("...TTL, for offline triage") - AWS rejects
that character in a tag value, the exact same class of bug already found and
fixed twice on 2026-08-02 for the `party_rooms` and Duel tables (`ADR-055`).
That fix was never generalized into a lint/check, so the same mistake
recurred on the next new table added afterward. Consequence: five
consecutive pushes (roughly a full day of otherwise-good work, including
`TASK-133`-`136` from this same session) never actually reached
`Build Android APK`, `Build & Deploy Frontend`, or `Publish to Google Play` -
those jobs were skipped every time because `Deploy Backend (prod)` failed
first. The last successful deploy remained `TASK-128` (2026-08-03 18:08),
so the live Play Store build has no Cognito credentials in it either (see
`ADR-063`) until a push clears this and successfully republishes.

Fixed by dropping the comma (`Purpose = "Persisted 4xx/5xx alert history with
TTL for offline triage"`), `terraform validate` passing. Filed as a
`[regression]` task (`TASK-137`) per CLAUDE.md rather than silently patched,
since five failed production deploys is exactly the kind of thing that
belongs in the tracked history, not just a commit message. Not generalized
into an automated tag-character lint in this pass - flagged as a gap worth a
future task if this recurs a third time.

With the deploy unblocked, the user explicitly authorized a manual
`workflow_dispatch` publish (`publish_to_play_store: true`,
`play_store_track: production`) of the AAB already built by the fix commit,
rather than waiting for a future unrelated `versionCode` bump to carry it out
automatically. That publish itself failed at the upload step with
`Version code 15 has already been used` - Google Play version codes are
global to the app across every track, never reusable, and this repo's own
history shows no prior commit setting `versionCode 15`, so it was consumed
by an upload outside what's visible in this history (an earlier manual
test/internal-track upload is the most likely explanation, but unconfirmed).
Resolved pragmatically by bumping to `versionCode 16`/`versionName 1.6.1`
rather than spending time reconstructing exactly how 15 was consumed.

### ADR-065 — Android Google login verified working end-to-end on a real device; a separate, platform-agnostic claim gap found in the process (TASK-18/86/136/138)

The user reported Google login on Android silently doing nothing on tap and
asked for a real-device diagnosis, which no prior session had access to. This
session's environment had neither `adb` nor the `backlog` CLI on `PATH` either
(no Android SDK anywhere on the machine); both were installed mid-session
without admin rights — `backlog.md` via `npm install -g`, and `adb` by
extracting Google's official `platform-tools` zip (downloaded through
`winget`'s resolved URL after a direct `dl.google.com/.../repo/...` guess
404'd) into a user-writable folder, since `choco install adb` failed needing
elevation this session doesn't have. Once the user connected a physical
Xiaomi/POCO phone with USB debugging on, `adb install` still silently failed
(`INSTALL_FAILED_USER_RESTRICTED`, no on-device prompt) until the user also
enabled MIUI's separate "Install via USB" developer option, distinct from USB
debugging - worth knowing for any future device-based verification on a MIUI/
HyperOS phone.

The phone's Play-Store-installed build was still `versionCode 14`/`1.5.0`,
predating `ADR-063`'s CI env-var fix (`versionCode 16`/`1.6.1` had published
to production roughly an hour earlier per `gh run view 30911640401`, all jobs
including `Publish to Google Play (production)` green; the device just hadn't
pulled the store update yet). Rather than wait on Play propagation, that run's
`android-app-debug` artifact was downloaded directly, confirmed to actually
contain the Android Cognito client ID in its bundled JS, and sideloaded over
the uninstalled release build. With that build, `adb logcat` captured a
complete, error-free real login performed by the user by hand: PKCE
state/verifier written to `SecureAuthStoragePlugin`, a Custom Tab opened on
the Cognito hosted UI, the Google redirect returning through
`moraltorturemachine://auth/callback` with a matching `code`/`state`, a
successful `/oauth2/token` exchange (368ms), and session persistence - no
errors anywhere in the chain. Force-stopping and relaunching the app preserved
the session, and tapping "Sign Out" correctly returned to the signed-out
state. This closes `TASK-18` AC1 and `TASK-86` AC1/AC2 with direct evidence
rather than code review alone.

While confirming `TASK-18` AC3 ("Logout e claim anonimo funzionano su
Android"), the logout half checked out but the claim-anonimo half could not
be verified because it does not exist: a repository-wide grep found nothing
in `frontend/src` (web or Android, not an Android-specific gap) that ever
calls `POST /users/claim-anonymous-data`; `claim_anonymous_user_id` in
`backend_fastapi.py` is reachable only from that one route. `TASK-13`
(closed 2026-07-31) only ever scoped and tested the backend half
(idempotency, no-email, cross-device conflict) - linking it to an actual
post-login call was never one of its acceptance criteria, and nothing since
added it. Concretely, today, a real login never links any pre-login
`moral_profiles`/Duel activity to the new account on either platform, which
quietly undermines the continuity promise both `ADR-002` and the
login-value reasoning behind the `TASK-136` mandatory-login gate (`ADR-062`/
`ADR-063`, already live in production) depend on - not a regression (it never
worked), but a real gap surfaced by this verification pass rather than an
Android-specific defect. Filed as `TASK-138` rather than folded into `TASK-18`,
since it is not Android-specific and needs its own acceptance criteria;
`TASK-18`/`TASK-86` moved from `Blocked` to `To Do` (the device blocker is
resolved, `TASK-18` AC3 is the only remaining open item, gated on `TASK-138`)
rather than `Done`, and `TASK-136` AC1 stays unchecked for the same reason.
Options considered for AC3: marking it satisfied since the login/logout
mechanism itself is proven correct and treating claim-anonimo as purely
`TASK-13`'s concern (rejected: the AC's own wording bundles both, and closing
it would hide a real, live product gap instead of tracking it) and silently
wiring the missing frontend call in the same pass (rejected: expands scope
into the login flow beyond what was asked, without the user's go-ahead, for a
non-blocking gap - gameplay and login both work today, only continuity is
missing).

### ADR-066 — Anonymous-data claim wired to the single point both platforms already share (TASK-138)

Following `ADR-065`, the user explicitly asked for the missing frontend call to
be implemented. `claimAnonymousData` (`frontend/src/auth/authClient.js`) POSTs
`{ anonymousUserId: getAnonymousUserId() }` with
`getAuthenticatedApiHeaders(session.idToken)` - the same authenticated-fetch
pattern already shipped in `AccountDeleteScreen.jsx` - and is called once,
fire-and-forget (never `await`ed, errors only `console.warn`ed, never thrown),
from inside `completeGoogleSignIn` right after `persistSession`. That single
function is already the one place both the web callback
(`AuthCallbackScreen.jsx`) and the native Android deep-link listener
(`AuthProvider.jsx`'s `appUrlOpen` handler) funnel through after a real
sign-in, so this needed no per-platform duplication and, importantly, does
not also fire on the silent refresh-token path in `getValidAuthSession`
(which calls `persistSession` directly, not `completeGoogleSignIn`) - it only
runs once per actual login, not on every app-open session check. Options
considered: adding the call inside `persistSession` itself (rejected: would
also fire on every silent token refresh, an unnecessary write per the
project's "avoid noise/unnecessary writes" cost posture) and duplicating the
call in both `AuthCallbackScreen.jsx` and `AuthProvider.jsx` (rejected:
`completeGoogleSignIn` was already the shared choke point, so duplicating it
there would only add drift risk for no benefit). `eslint` and
`vite build --mode prod` both pass. Not verified with a live device login in
this pass, unlike the rest of this session's Android work: reproducing it
would mean serving a local build to the phone, and the Cognito web/Android
client's `redirect_uri` allowlist almost certainly excludes a
dev/LAN callback, so confirming the network call actually fires is deferred
to the next real deploy (`TASK-18` AC3 stays unchecked pending that).

### ADR-067 — [regression] Reserved-keyword crash made claim-anonymous-data fail 100% of the time in production (TASK-139)

The user forwarded two production ops-alert emails (`TASK-104`/`ADR-045`) to
check: a 500 on `POST /users/claim-anonymous-data` and a 401 on
`POST /challenges/{token}/rematch`. Investigation found two different
situations, not one bug:

1. **Real regression** — `claim_anonymous_user_id()`'s claim-lock `PutItem`
   (`backend_fastapi.py`) used
   `ConditionExpression="attribute_not_exists(sub) OR ownerSub = :owner"`
   with no `ExpressionAttributeNames`. `sub` is a DynamoDB reserved keyword;
   naming it directly in an expression string (as opposed to as a `Key`,
   where it's fine) is rejected server-side with a `ValidationException`,
   which the outer handler turned into an unconditional 500 - so every call
   to this endpoint failed, on both platforms, from the moment `ADR-066`
   wired up the first real caller. Every existing test in `test_users.py`
   mocks the `users_table`, so nothing client-side ever validated the
   expression string against DynamoDB's reserved-word list; this stayed
   invisible until real traffic hit it. Fixed by adding
   `ExpressionAttributeNames={"#sub": "sub"}` and rewriting the condition as
   `attribute_not_exists(#sub) OR ownerSub = :owner`, the same placeholder
   pattern already used elsewhere in the file (`#status`). A regression test
   was added asserting the expression never contains the bare literal and
   that the placeholder resolves to `sub` - it does not exercise DynamoDB's
   own validation (still a mock), so it guards this specific regression
   rather than the whole reserved-word class; introducing `moto` for real
   expression validation was considered and deferred as disproportionate to
   one call site, since `moto` isn't already a project dependency. Filed and
   closed as `TASK-139`.
2. **Not a bug** — the 401 on `rematch` is `ADR-063`/`TASK-136`'s intended
   `login_required` gate working as designed for an anonymous caller past
   their first Duel interaction; `ChallengeCompareScreen.jsx` already renders
   a login CTA for it instead of a generic error. `ADR-045` already decided
   every 4xx gets emailed anyway (business-outcome 4xxs are common and
   deliberately not filtered out at the source), with the `ops-alerts-sweep`
   skill (`TASK-130`) as the intended place to later recognize and prune
   exactly this kind of confirmed-expected alert from `ops_error_alerts`. No
   code change made for this one.

### ADR-068 — Narrow, explicit opt-out from the ops alert for the confirmed-expected `login_required` 401 (TASK-140)

Immediate follow-up to `ADR-067`: having confirmed the `rematch` 401 is
expected, the user asked to stop getting emailed for it specifically, rather
than wait for `ops-alerts-sweep` to prune it after the fact each time. Rather
than reopen `ADR-045`'s "alert on every 4xx by default" stance globally
(still correct for `409`/`404`/`403`, which are genuinely ambiguous without
route-specific knowledge), added a narrow, opt-in-only escape hatch:
`request.state.expected_business_error`, set by a new `_raise_login_required`
helper the instant the route itself already knows, with certainty, that this
specific outcome needs no alert - `notify_ops_of_errors` checks it via
`getattr(..., False)` so any request that never touches it (i.e. everything
else) keeps alerting exactly as before. Applied at both call sites of the
`TASK-136`/`ADR-063` login gate (`require_authenticated_for_repeat_duel`,
covering `create_challenge`/`join_challenge`, and `rematch_challenge`
directly) - the user only named the `rematch` case, but all three raise the
identical `login_required` 401 for the identical reason, so suppressing only
one would have been an arbitrary, inconsistent carve-out of the same design
intent. Considered and rejected: teaching `_should_notify_ops`/
`_notify_ops_of_error` to special-case `detail == "login_required"` by
string content (more fragile - couples an unrelated generic function to one
route's exact wording, whereas the request-scoped flag keeps the knowledge
at the point that already knows it); adding a general per-path exclusion
list (rejected as premature - this is the first, and so far only, confirmed
case that is unconditionally non-actionable regardless of context, unlike
e.g. a `404` whose triage still benefits from seeing it at least once).
Verified `request.state` set inside the route handler is actually visible to
the outer `@app.middleware("http")` after `call_next` returns (both share
the same ASGI `scope` dict) with a real `TestClient` request through the
full middleware stack, not just mocked unit tests. Backend suite: 138/138
passing.

### ADR-069 — Party Room poll rate limit keyed by IP + anonymous_user_id, not IP alone (TASK-132)

`enforce_zero_cost_burst_guard`'s `_rate_limit_source()` hashed only the
source IP for every rule, including `party_room_poll` (90/min) and `global`
(120/min). Party Room is designed for `PARTY_ROOM_MAX_PARTICIPANTS` (20)
people in the same room, commonly on the same WiFi/NAT, each polling at
`POLL_INTERVAL_MS` (~40 req/min); an IP-only bucket makes them share one
budget, so as few as 3 co-located participants already exceed both limits
and get false `429`s unrelated to actual abuse - reproduced from a real
`ops_error_alerts` entry (`GET /party-rooms/V9NX5F` → 429). Considered: (a)
raise the numeric limits enough to cover 20 co-located participants -
rejected, since any fixed number large enough for the max room size weakens
the abuse ceiling for every IP, including ones with no Party Room traffic at
all; (b) key by `anonymous_user_id` alone, dropping the IP - rejected, since
that header is entirely client-supplied and trivially rotated, so it would
have removed abuse resistance rather than adding granularity. Chose:
`_rate_limit_participant_source()` hashes `IP + X-Anonymous-User-Id`
(additive, not a replacement) and is used for both rules that fire on a
Party Room poll (`global` and `party_room_poll`); every other endpoint keeps
the plain IP-only `_rate_limit_source()` unchanged, so this cannot be used to
bypass rate limiting on any other route, and a single IP still cannot poll
Party Room without bound - each distinct `anonymous_user_id` still gets its
own, separately capped budget rather than an unlimited one. Residual
weakness accepted as consistent with the guard's existing "best-effort,
zero-cost" scope (its own docstring): a script on one IP rotating
`anonymous_user_id` per request could still evade the `party_room_poll`/
`global` ceiling specifically for `GET /party-rooms/*`; this endpoint is a
cheap, already-authorization-checked read, and no stronger guarantee was
promised anywhere else in this guard either. Added `PartyRoomPollRateLimitKeyTests`
covering: participant-source differs by `anonymous_user_id` on the same IP,
is deterministic, the plain IP-only source ignores `anonymous_user_id`
(control), the middleware consumes `global`+`party_room_poll` with the
participant key on a Party Room poll vs. the IP-only key on an unrelated
endpoint, and two same-IP participants no longer share a bucket at a poll
limit of 1. Backend suite: 144/144 passing.

### ADR-070 — Defer the Daily Moral Crime priority decision to the 2026-08-19 growth check (TASK-167)

Context: a direct read-only scan of the prod DynamoDB analytics tables on
2026-08-05 (no native tooling yet - `TASK-41` is still `To Do`) measured D7
retention at ~1.4% (6/429 identities in the 2026-07-15..2026-07-29 cohort
returned on any later day at all; 0% in a day+5..+9 window), far below
`doc-2`'s 12-15% gate. `doc-2` explicitly gates paid acquisition and any
subscription launch on measured, sufficient retention, and its delivery
sequence places "retention through a daily dilemma" immediately after Party
Room (already shipped). The only planned retention mechanic - Daily Moral
Crime (`TASK-42`/`43`/`44`) plus opt-in push (`TASK-45`) - sits in `Backlog`
with no priority assigned. `TASK-167` was created to put this in front of
the user as an explicit product decision rather than silently promoting or
silently ignoring it. Options presented: (a) promote `TASK-42`-`45` to `To
Do` now; (b) defer the decision to the next growth check, alongside
`TASK-166`'s share-rate re-measurement; (c) accept the failed gate for now
and keep working other planned tasks. Chose: (b) - defer to 2026-08-19,
the same date `TASK-166` re-measures result-to-share and challenge
open-to-complete post-`TASK-149`. Consequence: `TASK-42`-`45` remain in
`Backlog` unpromoted until then; `TASK-167` moved from `Open Points` to
`Backlog` with a hard dependency on `TASK-166` so both growth gates are
revisited together on one pass instead of two. Per `doc-2`, paid acquisition
and subscription work stay out of scope until retention is remeasured and
either clears the gate or a renewed decision is made.

### ADR-071 — Cognito MFA left off; the admins group has no native-password login path to protect (TASK-119)

`backend/terraform/main.tf`'s single Cognito user pool has `mfa_configuration = "OFF"`.
Before deciding, this session queried production directly (`aws --profile personal
cognito-idp list-users-in-group --user-pool-id eu-west-1_VOxU2Onzd --group-name
admins`): exactly one member, `UserStatus: EXTERNAL_PROVIDER`, confirming the
admins group is the owner's single Google-federated account, not a shared or
growing group. More importantly, both app clients
(`aws_cognito_user_pool_client.web`/`.android`) set
`supported_identity_providers = [google]` and
`explicit_auth_flows = ["ALLOW_REFRESH_TOKEN_AUTH"]` only - there is no
`ALLOW_USER_PASSWORD_AUTH`/`ALLOW_ADMIN_USER_PASSWORD_AUTH`/SRP flow enabled
anywhere in the pool. Every sign-in, admin or anonymous-to-authenticated, goes
exclusively through Google OAuth; Cognito's own username/password challenge
(the thing `mfa_configuration` actually gates) is never reached at all in this
architecture. Turning MFA on would add a setting with no login path to attach
to, not a real second factor - the actual second-factor boundary for the
`/admin/analytics` account today is whatever 2-Step Verification the owner's
own Google account has, which is outside this repo's control surface.
Options considered: `mfa_configuration = "OPTIONAL"` with software-token TOTP
(rejected - Cognito TOTP prompts during Cognito-native authentication, which
this pool's app clients never trigger, so it would be dead configuration, not
a control); requiring MFA at the Google IdP level from Terraform (rejected -
Google account 2-Step Verification is not a Cognito/Terraform-managed
setting). Decision: accept `mfa_configuration = "OFF"` as-is; revisit only if
the admins group ever grows past the owner, if a native
password/SRP auth flow is ever added to either app client, or if `TASK-119`'s
own cost note (Cognito Essentials includes TOTP at no extra charge) becomes
relevant because a different login path is introduced. No Terraform change
made.

### ADR-072 — Archetype catalog v2 intentionally reclassifies existing profiles (TASK-25.1)

The human review of `TASK-25` revised the bilingual archetype content and
changed three centroids in `backend/data/archetypes.json`, requiring its
version to move from v1 to v2. Moral profile records already retain the
`archetypeId` and `archetypesVersion` calculated at creation, but public
profile, Challenge teaser, and Duel comparison reads recompute an archetype
from the stored six dimension averages against the one current catalog. A v2
deploy would therefore alter the displayed archetype for some v1 profiles
when they are next read, while leaving their scores, answers, and compatibility
calculation unchanged.

Options considered: preserve v1 output by retaining historical catalogs and
selecting one from each record's stored version; or accept that the latest
reviewed scoring model reclassifies prior profiles. The owner explicitly chose
the latter on 2026-08-06. No historical catalog or data migration is added.

Consequences: a previously shared profile or an open/completed Duel can show a
v2 archetype on its next read. The stored v1 fields remain useful historical
attribution, but do not freeze the current display. Every future centroid
change must again bump the catalog version and receive an explicit product
decision/ADR before deployment.

### ADR-073 — Explicit data lifecycle, full account cascade, and manual Play Data Safety gate (TASK-15.1/63/64)

The owner confirmed the following lifecycle on 2026-08-06: first-party raw
analytics for 90 days; GA4 web data for two months; Moral Duel data for 30
days; Party Room data for six hours; operational alerts for 30 days and
CloudWatch/API logs for seven days; and accounts/Moral Profiles deleted after
12 months of inactivity. A deletion request must remove Cognito, the app
account, profiles, data linked to claimed anonymous IDs, and only leave truly
aggregated/non-linkable statistics. Groq inference prompts/outputs are not
stored by the app as account/analytics data, but its published reliability and
abuse retention can be up to 30 days unless the provider account enables Zero
Data Retention. The current product has no payment or entitlement data.

Options considered: retaining profiles indefinitely because they are shareable
(rejected: an unlisted public link is still personal game data); adding new GSIs
to every legacy/social table for rare privacy export/deletion operations
(rejected at present: permanent index cost and write amplification outweigh
bounded, retention-limited scans); or relying only on DynamoDB TTL (rejected:
TTL is asynchronous and cannot delete Cognito or clean related Duel/Party
objects). Chosen: keep existing useful indexes, use paginated scans only for
rare privacy workflows, hide an expired profile immediately in the API, and
run a daily EventBridge-triggered Lambda with a dedicated least-privilege role
for account/profile lifecycle work.

Deletion of a participant removes the whole affected Duel or Party Room,
rather than deleting only one row, because comparisons, group verdicts, and
derived scores would still contain the deleted person's moral inferences. The
export instead returns only the caller's participation fields and never the
counterparty's data. Cognito usernames are persisted for new users; the
retention job uses a sub lookup only for historic rows missing that field.
Authenticated routes confirm the Cognito user remains active so a locally
valid pre-deletion JWT cannot recreate an app account during its remaining
token lifetime.

Cost/Free Tier review: EventBridge rules and target delivery have no additional
charge; one daily invocation is about 30 invocations/month (and would also be
far below EventBridge Scheduler's 14 million monthly free invocations). Lambda
has one million requests/400,000 GB-seconds monthly free tier; the 512 MB/30-
second worst-case worker is about 450 GB-seconds/month. The design adds no
provisioned concurrency, NAT, database, or paid observability feature. The local AWS
`personal` CLI profile was unavailable during this review, so account-specific
shared usage must be rechecked by the owner before `terraform apply`; no apply
is authorised by this decision.

Consequences: Privacy, Cookie, and Terms routes now disclose the actual data
flows, sharing model, retention, AI processor, and non-diagnostic nature of the
game. `growth-intelligence/data-safety.md` is the versioned declaration source,
but the owner must manually submit/verify it in Play Console before TASK-63 can
be closed. The Android client changes require version `1.6.4`/`versionCode 19`;
because a push with that bump triggers automatic production Play publishing,
that push requires a separate explicit confirmation.

### ADR-074 — Remove Pass-the-Phone mode; keep and repoint its SEO landing cluster (TASK-161/173)

Context: TASK-161 (UX audit, TASK-111) flagged Pass-the-Phone as contributing
nothing to the North Star metric (completed challenges/week) despite equal
homepage weight with the recommended Evaluation flow - no archetype, no
comparison, no share, no path back into the challenge loop. It was logged as
an Open Point (bridge it into the challenge loop, or de-emphasize it).

Options considered: (a) add a bridge CTA from Pass-the-Phone into
Evaluation/Challenge after a round; (b) de-emphasize it on the homepage but
keep the mode; (c) remove the mode entirely. The user chose (c) directly,
2026-08-07, superseding the two options TASK-161 originally posed.

A dependent question surfaced during scoping: doc-2's organic-search
experiment names "a pass-the-phone moral-dilemma game" as one of three
measured SEO content clusters, with two live bilingual landings
(`/moral-dilemma-game`, `/it/gioco-dilemmi-morali`) and the bare
`/pass-the-phone` URL itself indexed directly in `sitemap.xml`. Deleting the
mode outright would have left indexed, ranked pages pointing at a dead route.
Chosen: keep both landings and their content/keyword targeting largely as-is
(the "pass the phone" search intent and instructions to take turns on one
device remain accurate - Evaluation shows the same per-dilemma aggregate
vote-split pie chart Pass-the-Phone did), but change their `mode` from
`passThePhone` to `evaluation` and drop CTA/FAQ copy that named a dedicated
mode. The bare `/pass-the-phone` route now client-side redirects to
`/evaluation-dilemmas` instead of 404ing, and was dropped from `sitemap.xml`
in favor of the two landings as the canonical indexed URLs for that intent.

Consequences: `PassThePhoneScreen.jsx`/`.css` are deleted; its `en.json` keys
are removed (`it.json` is left untouched per the TASK-101 drift exception -
its now-dead `passThePhone`/`infinite_*` keys simply stay unused, consistent
with letting `it.json` drift rather than spending effort on it). TASK-152 and
TASK-154, both still open, had their descriptions corrected to drop the
now-deleted file/CTA reference rather than silently going stale. This is a
packaged-app behavior change (a homepage mode disappears), so it counts
toward the next mandatory Android version bump before any new APK is built
or distributed; it was not bumped as part of this change alone since no APK
build/distribution is happening in this session.

### ADR-075 — Per-dilemma "Spread the Guilt" share CTA, single-player only, no Duel (TASK-172)

Context: the 2026-08-07 analytics read showed result-to-share at 4.1% against
doc-2's 15% gate (funnel: test_completed/result_viewed 541 -> shared 22).
TASK-149/156/166 only ever prompt for a share once, at the very end of the
test (Results screen). This adds a second, repeated prompt during the test
itself, on every dilemma reveal in EvaluationDilemmasScreen.

Constraint that shaped scope: the full Duel/Challenge flow
(`ResultsScreen.handleChallengeAFriend`, `POST /profiles` then
`POST /challenges`) needs the complete answer set to score an archetype, so
it cannot be reused mid-test. Chosen: a plain `navigator.share` call (text +
app link, clipboard-copy fallback, same try/AbortError/fallback shape as
`shareCard.js`'s `shareOrDownloadDataUrl`) rather than a new Duel-lite
mechanism - no new backend endpoint, no profile creation.

Flow scope: Evaluation only. Party Room was excluded because its audience is
already present live in the room, which already has its own room-code/QR
growth mechanism - a second outbound share here would duplicate it. Pass the
Phone was excluded because it no longer exists (ADR-074, same session).

Copy (finalized with the user, dark/sarcastic MTM voice, English only per
TASK-101): button `[ SPREAD THE GUILT ]`, microcopy "Misery, as always,
prefers company.", share text "I made a choice I'm not proud of. Now it's
your turn to feel bad too."

Consequences: a new `dilemma_audience_share_clicked` analytics event
(dilemma_id, question_number, platform - the last via the existing
`trackEvent` envelope) is now distinct from the existing `share_clicked` used
on Results, so the two prompts' effectiveness can be measured separately. A
version that deep-links straight into a specific dilemma, or only surfaces on
closely-split (near 50/50) dilemmas using existing vote counts, was
intentionally left out of this task's scope as a possible v2 once V1 data
exists.

### ADR-076 — CloudFront Function + pre-baked static HTML for bot-only Open Graph on /p/:publicId (TASK-113/30)

Context: `/p/:publicId` is a Vite SPA with no SSR; `react-helmet-async` only
updates `<meta>` tags client-side after JS runs. Link-preview bots
(WhatsApp/Facebook/Twitter/iMessage/Discord/Telegram) typically do not
execute JS, so a shared profile link renders only the generic site-wide
preview, not the archetype/share-phrase preview - directly undermining the
share-rate work already in progress this session (TASK-172/ADR-075).

Options considered: (a) as originally scoped in TASK-113, Lambda@Edge
generating HTML per bot request; (b) broader static prerendering (ADR-020
precedent, but that precedent is build-time landing pages with a fixed,
small URL set - it does not naturally extend to a large/unbounded set of
dynamic per-profile URLs unless rendering is decoupled from request time,
which collapses back into option (a)'s shape); (c) accept the generic
preview for now. Verified current pricing before choosing: CloudFront
Functions carry a real always-free tier (2M invocations/month, then
$0.10/million - blog.cdnsun.com/cloudfront-pricing); Lambda@Edge has
effectively none (billed from request 1, only the first 1,000/month
covered by CloudFront's own free tier - cloudzero.com/blog/lambda-pricing).
Option (a) as originally scoped would have run outside Free Tier from the
first real traffic.

Chosen: a hybrid, close to (b) but decoupling rendering from request time
without needing a second compute service. A CloudFront Function (free,
viewer-request, no external calls) matches known bot user agents on
`/p/*` and rewrites the request to `/og/profiles/{publicId}.html` on the
same origin. That HTML is not rendered per-request - it is written once,
synchronously, by the existing backend Lambda inside `POST /profiles`
(archetype/share-phrase data is already in hand there), via a new
least-privilege `s3:PutObject` permission scoped to that one prefix on the
*existing* frontend S3 bucket - no new bucket. `og:title`/`og:description`
are personalized (archetype name + share phrase, the same public/teaser
fields `PublicProfileScreen.jsx` already exposes client-side); `og:image`
reuses the existing generic `og-image.png` for V1 rather than 14 new
per-archetype renders - that image is what a preview card leads with, but
the title/description text is what most crawlers show most prominently, so
this ships the actual fix (a broken/generic preview becoming a correct,
personalized one) without a new image-generation dependency. Per-archetype
OG images are a reasonable v2 once this is live, not a blocker for it.

Cost: no new AWS service needs the Free Tier exception process - CloudFront
Functions and the existing S3 bucket both cover this with wide margin at
current volume (23 `moral-profiles` rows total as of this session; S3
Standard PUT/GET pricing is $0.005/$0.0004 per 1,000 requests even without
a free-tier line item applying, effectively fractions of a cent/month here).
No Lambda@Edge, no new bucket, no dynamic image-rendering compute.

Consequences: implementation (TASK-30) needs a Terraform change (CloudFront
Function resource + behavior, IAM permission) - `terraform apply` requires
the user's separate explicit confirmation per CLAUDE.md regardless of this
decision. Scope stays to `/p/:publicId`; Duel/Challenge share links
(`/challenge/:token`) have the same underlying SPA-meta-tags problem but are
out of scope here and would need their own follow-up task if revisited.

### ADR-077 — Fix three real bugs found during the ops-alerts-sweep triage of TASK-174/175/176

Context: the `ops-alerts-sweep` skill (TASK-130) triaged `ops_error_alerts`
and, per ADR-045/068's stance that `409`/`404`/`403` need route-specific
knowledge rather than blanket suppression, found three genuine client-side
bugs behind three still-open alert groups instead of pure noise, filed as
`TASK-174/175/176`, then implemented in the same session at the user's
request.

1. **`TASK-174` (422 `/analytics/events`, 14 rows)** — `flushAnalytics`
   (`frontend/src/utils/analytics.js`) re-queued *any* failed batch at the
   front of the queue and retried it every `FLUSH_INTERVAL_MS`, with no
   distinction between a transient failure (network/5xx, worth retrying) and
   a permanent one (4xx schema rejection, which will never succeed and would
   silently block every later event in the session behind it). Fixed by only
   retrying on `429`/`5xx`/network error; any other 4xx is now dropped.
   `429` stays retryable because `/analytics/events` is one of
   `_rate_limit_rules_for_request`'s rate-limited paths
   (`analytics_ingest`), unlike a genuine validation rejection. The exact
   field that originally failed validation could not be confirmed - the
   request body is intentionally never logged (privacy policy) - but the
   indiscriminate-retry behavior was independently confirmed as a bug from
   the code alone, regardless of which field triggered the first failure.
2. **`TASK-175` (404 `/party-rooms/{room_code}`, 9 rows)** — `PartyRoomScreen`'s
   polling `useEffect` only stopped on `status === 'completed'`; a 404/410
   set `fatalError` but left the `setInterval` running, so a room that
   stopped existing kept getting polled every 1.5s indefinitely. Distinct
   from `TASK-148` (Done), which covers only the network-error catch branch.
   Fixed with a `fatalRef` set alongside `setFatalError`, checked by the
   polling tick to clear the interval the same way `'completed'` already
   does. The root cause of the underlying 404 itself (why the room stopped
   existing while multiple participants were still polling it) stays
   unconfirmed - TTL is 6h, unlikely for an active room - but the
   poll-forever behavior was a fixable bug on its own regardless of that
   cause.
3. **`TASK-176` (403 `/challenges/{token}/rematch`, 2 rows)** — `GET
   /challenges/{token}/compare` is intentionally public (no participant
   check, unlike `rematch`/`join`), so a non-participant who received a
   shared comparison link could see and click the Rematch button and always
   get a 403. Fixed by having `compare_challenge` optionally read
   `X-Anonymous-User-Id` (never required, so anonymous public viewing is
   unchanged) and return a new `isParticipant` boolean; the frontend now
   only renders the Rematch action (button, login CTA, and share-link state)
   when `isParticipant` is true. Considered and rejected: keeping the button
   visible but disabled with an explanatory message (more UI/translation
   surface for a low-volume edge case; a spectator has no legitimate reason
   to rematch someone else's Duel, so hiding it entirely is simpler and
   loses nothing).

All three are additive/backward-compatible (new response field, client-only
retry/polling logic) - no breaking API contract, so no Android rebuild
warning applies; the fixes reach the native app whenever it next builds
`dist/` into the APK; not requested in this session. Backend: `compare`'s
two new unit tests plus the full suite, 169/169 passing. Frontend: `pnpm
lint` and `pnpm build:prod` both clean; no frontend test runner exists yet
(`TASK-170`).

### ADR-078 — `/account` redesign scoped to latest-archetype + Duel stats, authenticated-only, planned as a 5-task epic (TASK-177)

Context: the user asked to completely rethink `/account` ("la pagina del mio
profilo e' tutta sbagliata"), explicitly wearing a UI/UX-designer,
growth-hacker, and game-designer hat, and asked to be asked every useful
question first. Investigation found `AccountDeleteScreen.jsx` was never
designed as a profile page - it is `TASK-120`'s bare settings panel (login,
export, delete), styled with `.legal-screen`'s beige/tan palette borrowed
from the legal pages, visually inconsistent with the rest of the app's dark
`--creepy-*` horror theme. It also has no logout button (`TASK-155`,
pre-existing).

Four scoping questions were asked and answered before any design work:
1. **Data scope**: "riassunto risultati" = latest archetype + Duel stats
   (completed count, avg. compatibility, distinct archetypes met, recent
   Duels), explicitly *not* a full multi-retake test-history/collection
   view. This matters technically: latest-archetype reuses the existing
   `moral_profiles` `OwnerIndex` GSI (no new infra); Duel stats have no
   existing index at all (`challenges`/`challenge_participants` have none) -
   scoped as a denormalized counter+recent-list on `users_table`, updated
   incrementally at Duel completion plus a one-time backfill inside
   `POST /users/claim-anonymous-data` (reusing the same
   infrequent-Scan-is-acceptable reasoning already used for `GET
   /users/export`'s duel/party lookups, `backend_fastapi.py:1603-1607`),
   rather than a new always-on GSI queried on every page view.
2. **Page role**: trophy/dashboard and growth-launchpad in equal weight, not
   one or the other.
3. **Audience**: the results recap is authenticated-only, not shown to
   anonymous visitors - an intentional activation lever alongside the
   existing pair-insight login incentive (`TASK-135`), not a duplication of
   it.
4. **Size**: a planned multi-task epic across sessions, not one task.

A design mockup was produced and published as an Artifact
(https://claude.ai/code/artifact/32590b56-c0ab-482e-9632-7b4afd21ea82),
built strictly from the app's own existing design tokens (`horrorTheme.css`,
`.results-archetype`, `.btn-primary`) rather than a new visual language -
real archetype content from `backend/data/archetypes.json` was used instead
of placeholder copy. The mockup is proposed, not yet confirmed by the user.

A concrete gap surfaced during design, independent of the "profile" framing:
the "challenge a friend" CTA exists *only* on `ResultsScreen`, immediately
after finishing a test - once a user leaves that screen there is no way to
start a new Duel without retaking the entire test. Given `doc-2`'s North
Star metric is completed multi-participant challenges per week, this is a
real, previously-unflagged hole in the growth loop; a persistent CTA on
`/account` (`TASK-177.5`) closes it independent of the rest of the redesign.

Filed as `TASK-177` (parent) with five subtasks using this project's
existing parent/subtask epic convention (`TASK-97.x`/`TASK-63.x` precedent,
no milestone feature in use): `177.1` (theme + logout fix, no dependency,
independently shippable), `177.2`→`177.3` (latest-archetype endpoint then
its card) and `177.4`→`177.5` (Duel-stats endpoint then its UI), the two
pairs linked via `--depends-on` since the frontend halves have no data
without their backend half. All five are `To Do`, not `In Progress` -
planning and the mockup were the deliverable this session; `TASK-177`'s
description explicitly says not to start implementation before the user
confirms the mockup direction, since none of it has been built or reviewed
yet.

### ADR-079 — `TASK-177` implementation: a Duel-stats GSI replaces the planned denormalized counter, applying it is the one step withheld pending approval

Context: the user confirmed the `ADR-078` mockup direction and asked to
implement all five `TASK-177` subtasks in one session.

`177.1`/`177.2`/`177.3` implemented exactly as planned: `AccountDeleteScreen`
rebuilt on `--creepy-*` tokens with a working logout button (also closing
`TASK-155`), and `GET /users/me/archetype` (resolves every claimed
`anonymous_user_id` via the existing claim-lock rows, queries
`moral_profiles.OwnerIndex` - no new infra) feeding the archetype card.

`177.4` diverged from `ADR-078`'s plan. That ADR proposed a denormalized
counter on `users_table`, updated at Duel completion plus a one-time claim
backfill, specifically to avoid a new GSI. Building it surfaced a flaw the
planning pass missed: Duel completion does not require authentication (a
caller's *first* Duel interaction stays fully anonymous, `TASK-136`), so at
the moment a challenge completes there is frequently no `sub` yet to key a
`users_table` write by - the "backfill at claim time" idea does not remove
the need to list a caller's historical duels at least once, it only makes it
rarer, and there is still no index to do that listing with. A `ParticipantIndex`
GSI on `challenge_participants` (hash `anonymousUserId`, range `submittedAt`)
turned out simpler than the workaround it was meant to avoid, and matches
the exact pattern already used twice (`moral_profiles.OwnerIndex`,
`product_events.AnonymousUserIndex`). `GET /users/me/duel-stats` queries it
capped at the 50 most recent participations (bounded cost regardless of
table growth), filters to `challenges_table.status == "completed"`, and
recomputes compatibility/opponent archetype from stored dimension averages
on every read rather than caching them at completion time - deliberately
matching `ADR-072`'s "never freeze a derived value" rule, so a future
archetype-catalog or compatibility-formula change reclassifies Duel-stats
output the same way it already reclassifies profile/compare reads.

Verified current AWS pricing before writing the Terraform (CLAUDE.md cost
mandate): DynamoDB's 25 RCU + 25 WCU provisioned-capacity Free Tier is
Always Free (not a 12-month allowance), shared per account/region across
every provisioned table and GSI. Current total from `backend/terraform/main.tf`
(`users`, `moral_profiles` base+`OwnerIndex`, `challenges`,
`challenge_participants`, `party_rooms`, `party_participants`,
`ops_error_alerts`, each 1/1): 8 RCU / 8 WCU provisioned. The new GSI at 1/1
brings this to 9/25 RCU and 9/25 WCU - comfortable headroom, well inside the
Free Tier by the same math either way.

The Terraform is written but was initially left **not applied**: per
CLAUDE.md, `terraform apply` always needs the user's separate explicit
approval regardless of Free Tier headroom, and pushing `177.4`/`177.5`'s
code before the GSI exists in AWS would make `GET /users/me/duel-stats` fail
on every authenticated `/account` visit (a self-inflicted regression the
`ops-alerts-sweep` skill would then have to catch). All five subtasks and
the parent stayed `In Progress`, not `Done`, and the branch was committed
locally but not yet pushed, specifically to avoid shipping that broken
window.

**Resolution**: a local `terraform plan`/`apply` attempt (with the user's
approval already given) failed for an unrelated reason - `google_oauth_client_id`/
`google_oauth_client_secret` have no local value (no `prod.tfvars`, no
`TF_VAR_*` env vars; this repo has never applied Terraform locally). Checking
`.github/workflows/deploy.yml` showed the actual mechanism: `terraform apply
-auto-approve` already runs automatically in CI on every push to `main`
(`TF_VAR_google_oauth_client_id`/`_secret` supplied from GitHub Actions
secrets), which is how every prior Terraform change in this project's
history has actually been applied - the CLAUDE.md "never run terraform
apply without explicit approval" rule is about *this agent* invoking it
directly, not about the standing, already-authorized CI pipeline a normal
push already triggers. With the user's explicit approval for this specific
change already given, pushed directly (commit `3df91b7`) rather than
attempting a redundant local apply. All five subtasks and the parent moved
to `Done`.

Backend: 5 new tests across `MyLatestArchetypeTests`/`MyDuelStatsTests`,
full suite 174/174 passing. Frontend: `pnpm lint` and `pnpm build:prod` both
clean.

### ADR-080 — [regression] `GET /users/me/duel-stats` deployed without IAM access to its own GSI

The user asked for a full app walkthrough immediately after `ADR-079`'s
deploy. A backend research pass (not yet aware the deploy had already
finished) flagged that `aws_iam_role_policy.lambda_permissions`
(`backend/terraform/main.tf`) granted `dynamodb:Query` on
`challenge_participants`' base table ARN but never added the
`"${arn}/index/*"` wildcard the new `ParticipantIndex` GSI needs - every
other GSI-backed table already in that same policy (`user_analytics`,
`product_events`, `moral_profiles`) had it; this one didn't. Missed during
`ADR-079` because local tests mock DynamoDB directly and never exercise real
IAM, and I never manually re-read the full policy block after adding one
resource line to it. By the time this was caught, the endpoint had already
been live in production for roughly 14 minutes, returning
`AccessDeniedException` to any authenticated caller. Fixed immediately
(single-line addition, `db03990`) and redeployed; total confirmed exposure
window was one deploy cycle, and the failure mode was a clean 500/403, not
silent wrong data. No test currently guards against this class of drift
(an IAM policy missing a resource ARN a real deployed Lambda actually
calls) - worth a real integration/smoke check against deployed
infrastructure if this pattern recurs, but not filed as its own task for a
single-line fix already shipped.

### ADR-081 — Resolved all 11 tasks from the post-TASK-177 app walkthrough (TASK-178..188)

Context: the user asked to resolve every task filed by the walkthrough
(`TASK-178`-`188`) and turn the walkthrough process itself into a reusable
skill. One of the eleven, `TASK-185` (dormant Story Mode code), was
explicitly scoped as a decision for the user rather than something to
resolve unilaterally; asked, and the answer was to remove it now rather
than wait for `TASK-52` - `TASK-52` is `Backlog`/`Low` and depends on two
other unstarted tasks (`TASK-50`/`53`), so by the time it is picked up,
rebuilding fresh for its actual episodic-premium requirements is likely
cheaper than adapting months-old scaffolding.

Removing Story Mode turned out to simplify two other tasks in the same
batch: `TASK-187`'s duplicate `decimal_to_float` closures and part of
`TASK-186`'s scope both lived inside `get_story_flow`/`story_node_vote`,
which no longer exist. Deliberately did **not** touch the `story_flows`
DynamoDB table or its Terraform resource, even though it now has zero
readers - dropping a table (2 rows, but real data) is a materially
different, harder-to-reverse action than deleting dead application code,
and the user's answer was scoped to "the code", not "and delete the
table too". Also left `it.json`'s now-orphaned `storyMode` section alone,
per the existing it.json drift exception (touching it beyond that
exception is explicitly out of scope).

`TASK-184` split on inspection: `MobileButton.jsx` was genuinely orphaned
and removed, but `LanguageSelector.jsx` is not ordinary dead code - it is
referenced by an explicit comment (`i18n.js`, `HomeScreen.jsx`) tied to the
documented `TASK-101` Italian-reactivation exception in `CLAUDE.md`. Removed
only `MobileButton.jsx` and the genuinely-unused `API_ENDPOINTS` entries,
left `LanguageSelector.jsx` in place.

The other nine (`178`, `179`, `180`, `181`, `182`, `183`, `186`, `187`,
`188`) were straightforward: a 404 route, AboutScreen content, one stale
SEO line, i18n migration for the consent banner and a handful of button
labels, gated debug logs, and three backend correctness fixes (`/vote`'s
miscategorized 500, four endpoints' leaked exception text, `/health`'s
dead status code). Backend: full suite 174/174 passing. Frontend: `pnpm
lint` and `pnpm build:prod` both clean.

### ADR-082 — New `/app-walkthrough` skill, codifying this session's read-only rough-edge sweep (TASK-190)

The user asked to turn the process just used (parallel frontend/backend
research, dedup against Backlog.md, route findings per CLAUDE.md's table)
into a reusable skill, same request pattern as `TASK-130`
(`ops-alerts-sweep`) - so it followed the same convention:
`.claude/commands/app-walkthrough.md`, frontmatter `description` naming its
tracking task, a numbered protocol, never modifies code (read-only sweep
that only files/enriches Backlog tasks, mirroring `ops-alerts-sweep`'s own
scope boundary). One thing this session's own run got wrong is now written
directly into the skill's dedup step: `TASK-184` initially grouped
`LanguageSelector.jsx` with genuinely-orphaned `MobileButton.jsx`, but
`LanguageSelector.jsx` turned out to be intentionally-dormant scaffolding
for the documented `TASK-101` Italian-reactivation exception, not ordinary
dead code - the skill's step 3 now explicitly calls out checking for a
comment explaining *why* something looks unused before treating it as
debt, and routing it to Open Points instead of Backlog when scaffolding
status is unclear (as `TASK-185`/Story Mode already correctly was). Not
tested against a second, independent invocation yet - first real
validation will be whenever `/app-walkthrough` next runs.

### ADR-083 — Two live incidents from real usage: Party Room capacity (TASK-191) and a multi-device Duel-creation 400 (TASK-192/193/194)

Context: the user reported "a huge number of errors" seen live, then
separately pasted a failing `POST /challenges` request from browser
DevTools with the status code cut off. Both traced to real, current
production failures, not noise.

**Party Room (`TASK-191`)**: ~80 `ProvisionedThroughputExceededException`
500s on `/party-rooms/{room_code}` and `.../vote` between 12:28 and 13:38
UTC today (`ops_error_alerts`). `party_rooms`/`party_participants` were
provisioned at 1 RCU/1 WCU each; live polling (`POLL_INTERVAL_MS` per
participant) exceeds that with only a handful of concurrent players. This
is exactly what `TASK-49` (load test 2-20 participants) was scoped to
measure before choosing real numbers - deliberately deferred by the user
on 2026-08-02 ("non ora"). Bumped both tables to 5/5 as an immediate
stopgap sized from the observed failure, not from a load test (still ~17/25
RCU and WCU on the shared Free Tier pool); `TASK-49` remains the correct
path to a properly justified target and is unchanged.

**Multi-device Duel creation (`TASK-192`/`193`)**: the pasted request
matched `ops_error_alerts` exactly - `POST /challenges` → 400 "Complete a
moral profile before creating a challenge" at 13:56:52 UTC, from
`/account`'s "Challenge someone new" button (`TASK-177.5`). Root cause: that
button calls `POST /challenges` with no `profilePublicId`, relying on
`create_challenge`'s fallback (`get_latest_profile_for_anonymous_user`),
which resolves only the *current device's* `X-Anonymous-User-Id` header.
But the button is only shown when `GET /users/me/archetype` found an
archetype - and that endpoint (`TASK-177.2`) deliberately resolves *every*
`anonymous_user_id` ever claimed to the account, not just the current
device's. `/account` was the first UI to surface claimed-identity data at
all, so this mismatch had no way to surface before today. Fixed narrowly:
`/users/me/archetype` now also returns `profilePublicId`, and the frontend
passes it explicitly instead of relying on the fallback. `rematch_challenge`
has the identical class of bug (participant-match check against only the
current device's id) and was very likely why the user also found the
account page's Rematch button broken - instead of applying the same fix
there, the user asked to remove that button entirely (`TASK-194`, along
with Export My Data, unrelated to this bug). The general fix - making
`create_challenge`/`rematch_challenge` resolve across claimed identities
for an authenticated caller, the way the two new `TASK-177` endpoints
already do - is filed as `TASK-192` for whenever a current-device-only
action needs to work again from a multi-device context.

Backend: full suite 174/174 passing (one test updated for the new
`profilePublicId` field). Frontend: `pnpm lint` and `pnpm build:prod` both
clean.

### ADR-084 — New `/seo-analytics-status` skill, codifying this session's SEO/analytics status read (TASK-195)

The user asked for an analysis of where SEO and analytics stand, then to
turn that process into a reusable skill - same request pattern as
`ADR-082`/`TASK-190` (`app-walkthrough`) and `TASK-130`
(`ops-alerts-sweep`), so it followed the same convention:
`.claude/commands/seo-analytics-status.md`, frontmatter `description` naming
its tracking task, a numbered protocol, read-only (files/enriches Backlog
tasks only if it finds something untracked, otherwise pure reporting).

The concrete lesson encoded from this session's own run: a Backlog.md
`Done`/`Blocked` label alone was not enough to answer "where do we stand" -
`TASK-97` (parent) is `Blocked` while five of its eight subtasks are `Done`;
`TASK-97.1`'s GA4 wiring is fully implemented per doc-1 and both of its
first two acceptance criteria are checked, yet it sits `In Progress` because
its third criterion (a real organic conversion row) is waiting on traffic
volume, not on more code. The skill's step 1 now explicitly calls out
reading each matched task's actual body, not just its column, and
distinguishing a technical blocker from one waiting on the product owner's
own action (Play Console Data Safety submission for `TASK-63`, Play Console
read-only grant for `TASK-98`, a Keyword Planner export or Google Ads API
approval for `TASK-97.4.1`) - conflating the two would have told the user to
write code that does not need writing. The skill also pulls the real
`growth-intelligence.yml` artifact (`gh run list`/`gh run download`) rather
than trusting doc-1's architecture description, since that is where the
session found the actual signal: Search Console traffic in the latest run
was almost entirely the branded query itself plus a competitor-app mix-up
("dilemmo"), not organic traffic to the six non-brand landings yet. Noted
for the skill: this environment's Bash tool has no working `python`/`python3`
(Windows App Execution Alias stub), so JSON artifacts must be read via
`Grep`/`Read`, not a Python one-liner. Not tested against a second,
independent invocation yet - first real validation will be whenever
`/seo-analytics-status` next runs.

### ADR-085 — Launch the Daily Moral Crime as a measured, global one-question ritual (TASK-42/43/44)

Context: ADR-070 had deferred deciding whether to promote the Daily until the
2026-08-19 growth check because the 2026-08-05 D7 measure (1.4%, 6/429) was
well below doc-2's 12–15% gate. On 2026-08-10 the user explicitly chose to
start now as a retention experiment, then specified the product rules rather
than leaving them inferred: one question, everyone sees the same question,
two options only, no archetype effect, post-vote aggregate reveal plus an
editorial reflection, no streak/gamification, only Ask the Audience sharing,
no FCM, reuse the existing dilemma set, EN-only, and measure the return/share
loop.

Choice: the release uses `daily_moral_crime_v1.json`, a fixed 29-id deck from
the existing EN catalog. The server, not the device timezone, defines the
Daily window at 09:00 UTC; the UI shows the next reset in local time. This
preserves one shared social moment globally and avoids a device-clock or
timezone split. A private anonymous participant row and a public aggregate
row live in one `daily_moral_crime_votes` table. A conditional DynamoDB
transaction writes both, so the first choice is immutable and a retry cannot
double-count. `GET /daily-moral-crime` withholds the aggregate until that
identity has voted; only percentages/counts, never another person's answer
or identifier, are returned after reveal. Participant data has a 90-day TTL,
is exportable/deletable after anonymous-data claim, and its non-linkable
aggregate is intentionally retained on account deletion. Client analytics
records only generic daily view/vote/reveal/share events, without a choice,
dilemma text, identifier, or share URL.

Cost: AWS's current official DynamoDB pricing documents an always-free 25
provisioned RCU and 25 WCU plus 25 GB for Standard-table usage. The existing
provisioned domains use 15/15; the 5/5 Daily table and 1/1 deletion GSI bring
the shared planned floor to 21/21, with no new paid service, schedule, AI,
notification provider, backup, or commitment. At the current 500–800 monthly
session baseline this is a deliberately small experiment; measure throttling
and reassess capacity/sharding before material acquisition growth. The
user-facing shared frontend requires an Android version bump 1.6.4/code 19 →
1.7.0/code 20; its auto-publishing consequence remains an explicit push-time
confirmation, not an automatic expansion of release authority.

Consequences: TASK-42–44 are promoted and delivered in sequence; TASK-45
remains Backlog. The historic bilingual/streak/friends/challenge acceptance
criteria were replaced by the user's explicit EN-only/no-gamification/Ask the
Audience scope. This is a measured retention experiment, not evidence that
the failed D7 gate has been cleared or permission for paid acquisition or
subscription work.

### ADR-086 — Let frontend CI read the committed esbuild build-script policy (TASK-196)

Context: the Daily verification exposed a recurrence of the tooling failure
previously closed as TASK-168. `frontend/pnpm-workspace.yaml` correctly sets
`allowBuilds.esbuild: true`, but both frontend jobs in `deploy.yml` invoked
`pnpm install --ignore-workspace`. That flag made pnpm discard the committed
policy, report `ERR_PNPM_IGNORED_BUILDS`, and leave Vite without its required
esbuild binary. The regression blocked the very CI build that protects any
frontend feature.

Choice: remove `--ignore-workspace` from both the web and Android install
steps. The existing allowlist remains narrowly scoped to esbuild's required
platform-binary postinstall; no arbitrary dependency scripts are enabled.

Consequences: the same lockfile and workspace policy now govern local CI-mode
verification and both deploy jobs. TASK-196 tracks the regression separately
from the Daily so a future change cannot silently re-close it as unrelated
feature work.

### ADR-087 — Keep Daily analytics aggregate-only and key-addressed (TASK-197)

Context: the Daily launch adds four generic privacy-safe events (view, vote,
reveal, Ask the Audience share), but the existing Analytics Center had no
dedicated way to see whether its retention ritual converted. The dashboard
also needs the current two-option split without exposing a participant choice,
identifier, dilemma text, or a misleading platform-specific vote result.

Choice: add one admin-only Daily tab to the existing `/admin/analytics/overview`
response. Its funnel derives unique identities from the already-filtered
generic events, so the selected period and platform apply exactly there. Its
current result uses one projected DynamoDB `GetItem` for the server-owned
current `(dayKey, "aggregate")` key, returning only first/second counts and
percentages. The aggregate is labeled global across platforms because that
row deliberately has no platform field. A read failure leaves the rest of the
dashboard available and explicitly marks this one result unavailable; it is
never rendered as a false zero.

Consequences: this creates no public API, schema, index, service, or recurring
write. The existing admin authorization and 60-second overview cache apply.
The current 1.7.0/code 20 frontend release is still unpushed, so this shared
frontend addition needs no second version bump unless that build is distributed
first.

### ADR-088 — Party Room account-deletion cascade leaves a privacy-safe tombstone instead of a hard delete (TASK-199)

Context: a deeper pass on the `ops-alerts-sweep` (TASK-130) triage of TASK-199's
404 alert group narrowed the mechanism to near-certainty from the code alone:
the only way a `party_rooms` row can disappear before its own 6h TTL is
`_delete_party_data`, called only from the account-deletion cascade
(interactive `DELETE /users/me` or the daily retention sweep). Per its own
docstring and ADR-073, this is deliberate - a room containing a deleted
participant's derived data (votes, awards, group verdict) would otherwise show
an incoherent comparison to the remaining participants. But the existing
behavior (a hard `delete_item`) gave every other still-open, still-polling
participant a bare, unexplained 404 the moment it happened - correct on
privacy grounds, poor on UX, and indistinguishable from "this room never
existed." Git history rules out the retention-sweep path for any occurrence
seen so far: Cognito/authenticated login only shipped starting 2026-07-29,
so no account could be anywhere near the twelve-month inactivity threshold
yet - meaning today's occurrences are near-certainly the owner's own manual
Party Room testing (delete a test account from one tab while another tab/
device is still in the same room), not a real end-user hitting this. Still
worth fixing now, cheaply, before organic multi-participant traffic exists.

Options considered: keep the hard delete and only soften the frontend's
generic error copy (rejected - the frontend still can't tell "never existed"
apart from "just ended," so the message could not actually explain what
happened); retain the room row with participant data scrubbed but derived
scores/awards intact (rejected outright - directly reintroduces the exact
"incoherent comparison" ADR-073 was written to prevent, since group
verdict/awards were computed using the deleted participant's answers).

Choice: `_delete_party_data` still deletes every `party_participants` row for
the room exactly as before (all personal/derived data removed, matching
ADR-073 in substance), but now writes the room row to a minimal tombstone
(`roomCode`, `status: "participant_left"`, a short `expirationTime`, nothing
else) instead of calling `delete_item`. `get_room_or_404` raises a distinct
410 (`"A participant left the platform and this game has ended"`) for that
status before any caller can read the fields a real room would have -
mirroring the existing revoked/expired-challenge 410 pattern (ADR-038) rather
than inventing a new error shape. `PartyRoomScreen.jsx`'s existing 404/410
fatal-stop-polling branch (TASK-175) already covers this for free; it only
needed to distinguish the message by matching the exact `detail` string,
falling back to the generic "room expired" copy for any other 410 (including
a genuinely just-expired room) so an older, not-yet-rebuilt Android client
degrades gracefully instead of breaking.

Consequences: additive and backward-compatible - no existing 404/410 handling
breaks, and an APK that predates this change simply shows the older generic
message for this one specific case instead of the more precise one, so no
Android rebuild warning applies. `frontend/public/locales/en.json` gained one
key (`party.roomParticipantLeft`); per the TASK-101/it.json-drift exceptions,
`it.json` was not touched. Tests added: `test_party_room.py` (tombstone shape,
410 on a tombstoned room) and an update to `test_users.py`'s account-deletion
cascade test, which previously asserted the old hard-delete call. Full backend
suite: 184/184 passing.

### ADR-089 — Privacy-safe logging for 422 validation errors, replacing a misleading placeholder (TASK-198)

Context: a deeper pass on TASK-198's 422 `/analytics/events` alert group found
that `notify_ops_of_errors`' generic detail, "See CloudWatch logs for the
request detail," is actually false for a 422 specifically: FastAPI's default
`RequestValidationError` handler returns the error to the *client* but never
logs anything server-side, so there was nothing in CloudWatch to check -
matching TASK-174's own earlier note that the failing field "could not be
determined from CloudWatch." Several candidate causes (a `challenge_token`
analytics property, PII-shaped `error_message`/`error_stack` values, an
`eventName`/`language` pattern violation) were individually checked against
the actual frontend code and ruled out; the strongest remaining candidate -
`occurredAt` landing outside the accepted range on a device with a wrong
system clock - could not be confirmed further without real failing requests,
which the privacy policy already forbids logging in full.

Options considered: logging the full Pydantic error (including `msg`/`input`)
to finally see the failing value (rejected outright - `input` can echo back
whatever the client sent, e.g. a raw property value, which is exactly the
request-body content the no-logging privacy rule exists to protect); doing
nothing further and continuing to guess from code alone (rejected - TASK-198's
own AC requires empirically identifying the dominant failure mode, which
guessing from code cannot fully deliver).

Choice: register an explicit `@app.exception_handler(RequestValidationError)`
that logs only `error["loc"]` (which field) and `error["type"]` (which
constraint) per error - never `msg` or `input` - then returns the exact same
`{"detail": exc.errors()}` / 422 shape FastAPI's default handler already
produced, so no client-visible behavior changes for any existing caller. The
next real occurrence will answer AC#2 from an actual production log line
instead of another guess.

Consequences: purely additive/observability-only - no request/response
contract changed, so no Android rebuild warning applies. TASK-198 is left
`Blocked` rather than `Done`: its diagnostic is shipped, but the actual
dominant-failure-mode confirmation and the resulting client-or-schema-fix
decision (AC#2/#3) can only happen once the new logging catches a real 422 in
prod. Tests added: `ValidationExceptionHandlerTests` in
`test_ops_error_notifications.py` (asserts the log line contains only
`loc`/`type` and never a planted `msg`/`input` value, and that the response
body/status still match FastAPI's default shape).

### ADR-090 — Backlog grooming for TASK-201-205: drop IT translation for new dilemmas, retire the 3/5/7 length experiment, scope the choice-color fix against ADR-044 (TASK-201/202/203/204/205)

Context: a review of the newly created TASK-201 through TASK-205 (requested by
the user before implementation started on any of them) surfaced three
conflicts with existing state. (1) TASK-201 required Italian translations for
15 new dilemmas in `dilemmas_it.json` while the app is forced English-only
(TASK-101) and Italian sits under 1% of historical events - the same
reasoning behind the existing `en.json`/`it.json` drift exception, even
though that exception's text names only the i18next dictionaries, not the
dilemma content catalog. (2) TASK-203 proposed hard-coding Solo Evaluation
and Party Room back to a fixed 5 dilemmas, directly reversing the still
`In Progress` TASK-23 3/5/7 length experiment, whose own AC#3 was
deliberately left open on 2026-08-07 pending roughly two weeks of real
traffic across all three variants before any comparison. (3) TASK-202's plan
to neutralize the red/green dual-choice colors touches the exact same
`btn-yes`/`btn-no` pairing ADR-044 (TASK-102/107) already modified for a
WCAG AA contrast fix; that ADR explicitly scoped a full palette redesign as
out of scope for that narrower accessibility task, not as a permanent
rejection of one.

Options considered: keep TASK-201's Italian-translation requirement as
originally scoped (rejected by the user as wasted effort given the current
English-only exception); add TASK-23 as a formal TASK-203 dependency and
require pulling its completion/share comparison data before hardcoding 5
(the user stated explicit confidence that 5 is the right call and chose to
retire the experiment outright instead); leave TASK-202's four modes as
separately hardcoded per-screen color values (rejected in favor of shared
neutral tokens applied everywhere a dual ethical choice exists, per the
user's explicit "ovunque ci sia la doppia scelta" instruction).

Choice:
- TASK-201: dropped the Italian-translation acceptance criterion;
  `dilemmas_it.json` is not updated for these 15 dilemmas and is allowed to
  drift, the same posture as the existing `en.json`/`it.json` exception.
  TASK-66 (dilemma sensitive-content classification/age gate, still
  `Backlog`/not started) is archived at the user's explicit instruction
  rather than left as an unresolved dependency for this or future dilemma
  content work - the bioethics dilemmas in this pool (euthanasia/genetics)
  ship without a dedicated age gate.
- TASK-203: TASK-23 (3/5/7 length experiment, `In Progress`) is archived.
  The decision to fix both Solo Evaluation and Party Room at exactly 5
  dilemmas is made directly by the user rather than derived from the AC#3
  comparison TASK-23 was built to produce; that comparison will never be
  completed. TASK-203 is expanded to also revert `EvaluationDilemmasScreen`'s
  SEO description to name the fixed count again, since TASK-180's generic
  wording existed only to avoid contradicting the now-removed experiment.
- TASK-202: expanded to explicitly require preserving ADR-044's >=4.5:1 text
  contrast (no regression), and to introduce the new neutral palette as
  shared CSS variables applied consistently across every confirmed
  dual-choice surface - Solo Evaluation (buttons + pie chart), Party Room
  (buttons + reveal bar/vote text), Daily Moral Crime (buttons + result
  bars), Moral Duel/`ChallengeLandingScreen` (buttons) - instead of four
  separate ad-hoc per-screen fixes. TASK-204's new reveal donut/pie chart is
  made to depend on TASK-202 so it is built with the neutral tokens directly
  rather than repainting a freshly-added red/green chart.

Consequences: TASK-23's own AC#3 stays permanently unresolved (task
archived, not completed) - a future reader of `backlog/archive/tasks/task-23
...` should treat the archive as a deliberate supersession by TASK-203, not
an abandoned/forgotten task. TASK-66 remains unimplemented indefinitely; any
future dilemma content work involving genuinely graphic or traumatic
material should re-raise sensitive-content classification as a fresh task
rather than assume TASK-66's old scope still applies. `dilemmas_it.json`
drift now explicitly extends to new dilemma content, not just UI translation
strings - if Italian is ever reactivated (per the TASK-101 exception note in
`CLAUDE.md`), TASK-201's new dilemmas will need their own IT translation pass
at that time. TASK-205 was also rewritten (without disputing its
description) to state the TASK-123 baseline explicitly and scope the spike
to only the three genuinely new asks, since its original draft re-described
already-shipped awards (`contrarian`, `moralMinority`, `closestPair`) as if
proposing them for the first time. No AWS/infrastructure change from any of
this - pure backlog, content, and frontend scope adjustments.

### ADR-091 — TASK-201's 15 new dilemmas ship as content only; production DynamoDB repopulation stays a separate, explicit step (TASK-201)

Context: implementing TASK-201 required understanding how `backend/data/
dilemmas_en.json` actually reaches players. Nothing in `backend_fastapi.py`
reads the JSON files at request time - `GET /get-dilemma` and
`GET /dilemmas/by-ids` both `table.scan`/`get_item` directly against the
single production `moral-torture-machine-dilemmas` DynamoDB table. The JSON
files are seed content only, loaded by `backend/scripts/
populate_dynamodb_multilang.py`, which is wired into `.github/workflows/
deploy.yml`'s `populate-dynamodb` job - itself gated behind an explicit
opt-in (`[populate-db]` in the commit message, or a manual `workflow_dispatch`
run with `populate_dynamodb: true`), not run on an ordinary push to `main`.
That script's `clear_dynamodb_table` step deletes every existing item in the
table before reloading both language files from scratch, on the one
production stack this repo has.

Options considered: include `[populate-db]` in this task's commit so the new
dilemmas go live immediately as part of the ordinary push-to-main deploy the
user has standing authorization for (rejected - a full clear-then-reload of
the only production dilemma table is exactly the kind of hard-to-reverse,
production-data-affecting action that warrants asking first, and the
workflow's own opt-in gate signals the repo already treats it that way,
similar to how `versionCode` bumps get a separate confirmation despite the
general deploy authorization); skip pushing the content until population is
confirmed (rejected - the JSON content itself is inert until that job runs,
so committing and pushing it carries no production risk on its own and
matches the existing authorization for ordinary commits).

Choice: the 15 new dilemmas are appended to `dilemmas_en.json` only (new,
collision-checked 24-hex-char `_id`s not overlapping either language file;
none of the existing 29 entries or their `_id`s were touched), pushed to
`main` through the ordinary deploy path without the `[populate-db]` marker,
and the user is asked explicitly whether/when to run the population step
that actually clears and reloads the production table.

Consequences: TASK-201 is `Done` (its acceptance criteria are about the
content file, which is complete and validated - 44 total EN entries, no
duplicate or malformed IDs, all 12 dimension weights per entry within
0.0-1.0, `compute_dimension_averages`/`archetype_engine.py` have no
hardcoded dilemma-count assumption per TASK-23's prior implementation notes)
but the 15 new dilemmas will not appear to real players until someone
explicitly runs `populate_dynamodb_multilang.py` against the production
table (via the `[populate-db]` commit marker or `workflow_dispatch`) -
future readers should not assume `Done` here means "live in production."

### ADR-092 — Add a non-destructive append-only DynamoDB populate mode; discovered the local AWS CLI profile is a root credential (TASK-201 follow-up)

Context: asked to just "insert the 15 dilemmas manually," the only local AWS
credential available (`aws --profile personal`) turned out to authenticate as
the account's root user (`arn:aws:iam::586250839220:root`), which `CLAUDE.md`
explicitly forbids using "for routine development or automation." A direct
local write, even a narrowly-scoped one, was therefore not an option
regardless of how safe the write itself was.

Options considered: run the write anyway since only 15 new items were being
added (rejected outright - the credential-scope rule in `CLAUDE.md` doesn't
carve out an exception for "safe" writes, and root credentials are exactly
what least-privilege IAM is supposed to replace); ask the user to reconfigure
a non-root profile before proceeding (rejected as the immediate fix - out of
scope for this task and the user's own AWS account setup to decide, not
something to change unprompted); trigger the existing CI `populate-dynamodb`
job as-is, which only does a full clear-then-reload (available, but strictly
more destructive than the user's own framing of "just insert them"); build a
non-destructive append-only mode and run it through CI's own scoped
credentials instead of the local root ones (chosen, and the option the user
picked directly when asked).

Choice: `backend/scripts/populate_dynamodb_multilang.py` gained an
`--append-only` flag. In that mode the script skips `clear_dynamodb_table`
entirely and writes each dilemma with a conditional `put_item`
(`ConditionExpression='attribute_not_exists(#pk)'` on `_id`), catching
`ConditionalCheckFailedException` to silently skip any item that already
exists rather than overwriting it - so it is safe to re-run at any time,
against a table in any state, without a batch_writer's inherent inability to
express per-item conditions. `.github/workflows/deploy.yml` gained a
`populate_dynamodb_mode` (`append`/`full`, default `append`) `workflow_dispatch`
input and a `[populate-db-append]` commit-message marker, both wired through
a new "Determine populate mode" step; the pre-existing `[populate-db]` marker
and a `workflow_dispatch` run without setting the new input keep meaning
"full" (no silent behavior change to the existing trigger). The existing
pre-populate `aws dynamodb create-backup` step is left unconditional for
both modes - cheap insurance either way.

Consequences: TASK-201's 15 dilemmas can now go live via the CI job's own
`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets (whatever IAM identity
those represent - not inspected here, but distinct from the local root
profile) without ever clearing the table, superseding ADR-091's assumption
that reaching production required the destructive full-reload path. The
local `personal` AWS CLI profile authenticating as root is a pre-existing
condition of the user's own AWS account, left unchanged and unaddressed here
- it was only discovered as a side effect of this task, not fixed, and
should be treated as a standing reason to route any future local-credential
AWS write through this same "ask, then prefer CI" pattern rather than
assuming a scoped profile is available.

### ADR-093 — Neutral shared color tokens for the two dilemma options, extending rather than redoing ADR-044 (TASK-202)

Context: `.btn-yes`/`.btn-no` (shared.css, reused identically by Solo
Evaluation, Party Room, Daily Moral Crime, and Moral Duel's
`ChallengeLandingScreen`) painted the first option in `--creepy-blood` (dark
red) and the second in a charcoal fill with a `--creepy-pale-green` border;
`EvaluationDilemmasScreen.jsx`'s reveal pie chart hardcoded the same red/
green pair as bespoke hex (`#7a4a4a`/`#2a3a2a`, not even the named theme
variables); Party Room's reveal bar/vote-list text and Daily Moral Crime's
result bars repeated the pattern with their own scattered tokens
(`--creepy-rust`/`--creepy-sickly-green`, `--text-danger-readable`/
`--creepy-pale-green`). For a genuine ethical dilemma with no right answer,
this consistently color-coded one option as "bad" and the other "good."
Auditing every screen also surfaced a second, unrelated problem in the same
buttons: `.btn-yes` had a solid, saturated fill while `.btn-no` was a neutral
button with only a thin colored border, so the first option already carried
more visual weight than the second regardless of hue - not something the
original task description called out, but squarely inside its "paritetiche
per importanza gerarchica" acceptance criterion.

`ADR-044` (`TASK-102/107`) had already touched this exact button pair, but
only to fix `--text-danger`'s WCAG contrast as a *text* color; it explicitly
declined a full palette redesign as out of scope for that narrower
accessibility fix - not as a permanent rejection of one.

Options considered: reuse existing theme variables (e.g. repaint
`--creepy-blood`/`--creepy-pale-green` in place) - rejected, because those
variables also drive unrelated UI (`.btn-primary` hover, `progress-dot`,
error/warning text) that must keep its original meaning, and doing so would
have been exactly the broad repaint ADR-044 already declined; leave each
screen's hardcoded/scattered values as-is and just swap hues per call site -
rejected, defeats the task's own AC3 request for one shared definition
instead of four independent ones and would drift again the next time a new
dual-choice surface is added; a full theme redesign - rejected for the same
reason ADR-044 rejected it (out of scope, not requested).

Choice: added six new tokens to `horrorTheme.css` - `--choice-a`/
`-border`/`-text` (a desaturated slate blue-gray) and `--choice-b`/`-border`/
`-text` (a desaturated bronze/amber), deliberately avoiding any single
dominant R/G/B channel so neither reads as a primary hue the way red/green
did. The two `-text` variants were hand-computed against the WCAG relative-
luminance formula to verify >=4.5:1 against all three dark backgrounds in
use (measured ~7.9-9.7:1, well clear of the ADR-044 floor), and the fill/
border pairs were tuned to near-identical relative luminance to each other
(0.047 vs 0.046 for the fills) for genuine visual parity, not just
distinguishability. Applied only at the six actual dual-choice touch points
identified above; left untouched every other red/green use that isn't
comparing the two dilemma options (real error/warning text, the "is-caller"
list highlight, the "most divided so far" round badge, conventional green
"next/continue" buttons, and `progress-dot`'s active-vs-completed progress
indicator) - same non-goal ADR-044 already established, just re-confirmed
against the current codebase rather than assumed.

Consequences: fixing `.btn-yes`/`.btn-no` in `shared.css` and the DynamoDB-
adjacent pie/bar spots in three other files covers all four game modes in
one change, since they share the same CSS classes. Any new dual-choice UI
added later should reuse `--choice-a`/`--choice-b` rather than reintroducing
red/green or a fifth set of hardcoded hex values. No AWS/infrastructure
change; `pnpm lint` and `pnpm build:prod` both clean.

### ADR-094 — DailyMoralCrimeScreen's 100%-of-visits crash was a pre-existing bug ADR-091's fix finally made reachable (TASK-208)

Context: the user reported a live production crash on `/daily` -
`TypeError: Cannot read properties of null (reading 'dilemma')`, caught by
the app's ErrorBoundary. The cause was in `DailyMoralCrimeScreen.jsx`'s
`selectedAnswer` computation, which ran unconditionally on every render
(outside the `{!loading && daily && (...)}` guard the rest of the component
uses): `daily?.choice === 'first' ? daily.dilemma?.firstAnswer :
daily.dilemma?.secondAnswer` - the `:` branch read `daily.dilemma` without
optional-chaining `daily` itself. Since `daily` starts as `null`
(`useState(null)`) and that branch is exactly the one taken while it's still
null, this threw on the component's very first render, before the
`/daily-moral-crime` fetch could ever resolve - a 100%, not intermittent,
crash. The code has been on `main` since `TASK-42/43/44` (commit `a1c26b3`,
2026-08-10) and was never touched since, meaning it never worked, at any
point, once. It was invisible until now only because `ADR-091`/`TASK-206`'s
Terraform tag bug had kept the entire deploy pipeline (and therefore this
exact frontend code) from ever reaching production for three weeks; fixing
that bug earlier today made this pre-existing frontend bug reachable by
real traffic for the first time.

Choice: added the missing `?.` after `daily` in both ternary branches
(`daily?.dilemma?.firstAnswer` / `daily?.dilemma?.secondAnswer`) - a
two-line diff. Grepped the rest of the file for other `daily.` accesses
without optional chaining; every other one is already inside the
`daily &&`-guarded JSX block or a function that early-returns on `!daily`,
so no second instance of the same mistake exists in this file.

Consequences: this is the second distinct latent bug `TASK-206`'s pipeline
fix has surfaced in code that looked "Done" but had never actually run in
production (the first being the Terraform tag itself). Any other feature
merged during the 2026-08-10 to 2026-08-31 freeze window should be treated
as unverified-in-production until someone actually exercises it, regardless
of its Backlog.md status - a `Done` label from that window recorded that
the code was merged and reviewed, not that a real user ever successfully
loaded it. TASK-208 (pre-existing task, filled in and closed here) tracks
this fix; no other freeze-window feature has been audited yet.

### ADR-095 — One shared `.tease-text` class and stricter shared.css reuse instead of per-screen CSS drift across game modes (TASK-214)

Context: the user asked to make fonts/sizes/colors consistent across all four
game modes (Solo Evaluation, Party Room, Moral Duel, Daily Moral Crime) and to
create reusable snippets so they stop diverging again. Auditing the four
screens' CSS against `shared.css` found concrete, not cosmetic, drift:
`DailyMoralCrimeScreen.css` was the only game-mode stylesheet using `rem`
(the app's root font-size is a non-standard `21px`, so its sizes silently
drifted out of the `px` convention every other screen uses, and would resize
under browser text-zoom while sibling screens would not); `.daily-kicker`/
`.daily-choice-label`/`.daily-inline-error` painted text with the raw
`--text-danger` token, the same sub-3:1-contrast bug `ADR-044`
(`TASK-102`/`107`) had already fixed everywhere else via
`--text-danger-readable` - a regression by omission in a screen written after
that fix landed; the dilemma question is wrapped in the shared
`.text-box-default` panel in Evaluation, Duel, and Party, but rendered as
larger unboxed text in Daily; and the post-answer commentary panel
(`.evaluation-tease-text`/`.challenge-tease-text`/`.party-reveal-tease`) was
three near-byte-identical CSS blocks copy-pasted into three separate files -
only one of the three had a mobile breakpoint, so the panel's mobile size
silently differed by mode. `.daily-choice` also forced
`text-transform: none` while `btn-yes`/`btn-no` uppercase this exact kind of
free-text dilemma answer everywhere else, an unexplained one-off exception.

Choice: added one `.tease-text` class to `shared.css` (with its own mobile
breakpoints) and pointed all four screens at it, deleting the three duplicated
blocks; switched Daily's dilemma prompt to `.text-box-default`; converted
`DailyMoralCrimeScreen.css` off `rem` to the same `px` convention as its
siblings (1:1 value conversion, no visual-size change beyond the fixes below);
fixed the three `--text-danger` text-color instances to
`--text-danger-readable`; removed `.daily-results .screen-title`'s local
font-size override so it matches Party Room's equivalent nested heading; and
removed `.daily-choice`'s `text-transform: none` so free-text answers
uppercase consistently with every other mode. Documented the shared-first
convention in `doc-1` ("Frontend styling conventions") and in this repo's
`CLAUDE.md` as a standing instruction: check `shared.css` before writing a new
visual pattern, and promote something to a shared class once it is duplicated
across two or more screens instead of leaving it copy-pasted.

Consequences: game-mode screens now render the same dilemma-box, tease-panel,
and label treatment; a future tweak to any of these (e.g. tease-panel padding)
changes once in `shared.css` instead of needing four synchronized edits. The
`--text-danger`-as-text-color bug class is worth a repo-wide grep
(`var(--text-danger)`) the next time a contrast issue is reported, since this
is the second time it has resurfaced in a screen written after ADR-044. No
visual regression is expected from the `rem`→`px` conversion (same computed
sizes at default zoom) or from the label/prompt/panel changes, but this was
verified by `pnpm lint`/`pnpm build:prod` and code review only - per
`CLAUDE.md`'s browser-automation ban, no live browser check was performed, so
a manual visual pass on `/daily`, `/party/:code`, `/challenge/:token`, and the
evaluation flow is still worth doing before/at next deploy.

### ADR-096 — Dedicated Party Room/Duel funnels, property-level click breakdowns, and stacked mobile tables for the analytics dashboard (TASK-215/216/217)

Context: the user judged the analytics dashboard "behind", with bad mobile UX
and no visibility into the individual game modes or key clicks. Auditing
`AnalyticsAdminScreen.jsx` and `build_analytics_overview` (backend) found this
was concrete, not a vague impression: the dashboard's only generic funnel
(`test_started` -> `answered` -> `test_completed` -> `result_viewed` ->
`shared`) is Solo-Evaluation-shaped, and only Daily Moral Crime (`TASK-197`)
had ever gotten its own dedicated panel - Party Room and Moral Duel, despite
having rich dedicated events, were invisible beyond flat rows in the raw
`eventCounts` list (i.e. `TASK-40`, "Strumentare e reportizzare il loop
challenge", closed `Done` without ever actually building a Duel-specific
report - the TASK-138 lesson about not trusting a `Done` label applies here
too). Separately, `mode_selected` - the one event that should say which mode
people actually pick from the home screen - turned out to be broken at the
instrumentation layer, not just undisplayed: the Party Room home button fired
no `trackEvent` call at all, and the Daily button only fired its own distinct
event, so in practice `mode_selected` only ever carried `mode: "evaluation"`.
Building a dashboard breakdown on top of that without fixing it first would
have shipped a breakdown that confidently reported the wrong thing. The two
widest tables (abuse: 9 columns, recent events: 8, the latter with nested
`<details>`) were also confirmed pure horizontal-scroll strips below the
dashboard's own existing 45rem/28rem breakpoints, unlike every other section
already reworked by `TASK-128`/`189`.

Choice: (1) `TASK-215` added `build_party_room_analytics` (per-participant
funnel entered -> voted -> shared, with host-only actions counted
separately so they cannot narrow the participant funnel) and
`build_moral_duel_analytics` (challenge created -> landing viewed -> joined
-> completed -> compared, deliberately counting identities across both
sides of the invite), both built on one shared `_build_identity_funnel`
helper factored out of Daily's inline version rather than a third copy
(CLAUDE.md's reuse-over-duplicate rule from ADR-095, applied the same day it
was written). (2) Fixed `HomeScreen.jsx` so all three home CTAs
(evaluation/daily/party) fire `mode_selected` before navigating, then added
`build_interaction_breakdowns` (`TASK-216`): `mode_selected` by `mode`,
`share_clicked` by `channel`+`object_type`, and an
`auth_prompt_shown`/`auth_prompt_clicked` click-through rate by `surface` -
confirmed none of these properties are on the ingest or dashboard-display
forbidden-property lists (`challenge_token` is, per the pre-existing,
unrelated `TASK-200`, but neither new funnel depends on it). Both new
backend blocks are wired into the existing `/admin/analytics/overview`
response, respecting the same `days`/`platform` filters and 60-second cache
as every other block, at zero extra AWS cost (pure Lambda computation over
already-fetched events, no new DynamoDB reads or writes). (3) `TASK-217`
added a `.analytics-table-wrap--stack` modifier that turns both dense tables
into one card per row below 45rem, using `data-label` attributes already
present on every `<td>` plus a CSS `::before { content: attr(data-label) }`
label - chosen over hiding "less important" columns because it is strictly
non-lossy and requires no subjective judgment about which of the 8-9 columns
matters most on a phone.

Consequences: two of the four game modes have a real read on how far people
get, not just how many raw events fired; `mode_selected` is now a trustworthy
"which mode did they pick" signal instead of a Solo-only stat masquerading as
global. New i18n strings went into `en.json` only, per the `it.json` drift
exception. All three tasks' 189-test backend suite, `pnpm lint`, and
`pnpm build:prod` pass; per `CLAUDE.md`'s browser-automation ban no live
browser/device check was performed, so the stacked-table mobile layout in
particular is worth a manual phone check before treating `TASK-217` as fully
verified. `TASK-200` (challenge_token dropped from every analytics event)
remains open and unrelated to this work, but blocks any *future* per-challenge
(as opposed to per-identity) Duel report.

### ADR-097 — Scoped read-only IAM user for analytics scans instead of the root AWS CLI profile; TASK-166 re-measured, TASK-33/156 escalated (TASK-166)

Context: `TASK-166` had sat unactioned in `Backlog` twelve days past its own
unblock date (it was gated to "not before 2026-08-19", fourteen full days
after `TASK-149`'s 2026-08-05 deploy) until the user asked for a full
analytics/SEO status pass. The task's only two documented measurement paths
were the admin dashboard (needs an interactive Google/Cognito login this
agent cannot perform) or a direct DynamoDB scan per `ANALYTICS_GUIDE.md`. The
only AWS CLI credentials configured in this environment (`default` and
`personal` profiles) both resolved to IAM **root** on their respective
accounts - confirmed via `aws sts get-caller-identity` - which `CLAUDE.md`
explicitly forbids using "for routine development or automation" (the same
class of problem `ADR-092` had already flagged once). The user's first
instruction was to delete that CLAUDE.md rule and proceed with root; this was
declined and explained rather than executed, because the rule's purpose (cap
the blast radius of any mistake made while a credential is active during a
session) doesn't stop applying just because one particular command is
read-only - the credential itself carries full account permissions regardless
of what command is typed. The user then asked for the safer alternative
instead: create the scoped credential.

Choice: created a new IAM user `mtm-analytics-readonly` (account
`586250839220`, confirmed as the one actually hosting the product's tables by
`describe-table` against both candidate accounts) with one inline policy
granting only `dynamodb:Scan`/`Query`/`DescribeTable` on
`prod-moral-torture-machine-user-analytics` and
`prod-moral-torture-machine-product-events` (plus their indexes) - nothing
else, no other table, no IAM/other-service permission. Bootstrapping this
one-time IAM user *with* the root credential was treated as the legitimate
exception CLAUDE.md's rule already implies (root's proper role is one-time
account/IAM setup, not routine reads) rather than a second violation, since
its entire purpose is eliminating the need to reach for root again. Verified
the new profile with three probes: read access to the intended table
succeeds, `iam:ListUsers` is denied, and `Scan` against an unlisted table
(`...-users`) is denied. All subsequent analytics reads used only this
profile. Used it to re-run `TASK-166`'s measurement on the clean
2026-08-06→2026-08-31 window (25.6 days, well past the 14-day minimum):
share rate (`share_clicked`/`result_viewed`, matching the pre-`TASK-172`
baseline definition) came out 11.86%-14.29% depending on whether the
`result_viewed` denominator includes the legacy schema union or not - still
under the 15% gate in every variant tried, versus 3.4% on 2026-08-05's
contaminated pre-fix window. A broader "any sharing action" definition
(also counting `dilemma_audience_share_clicked`/`TASK-172`, which fires
per-dilemma *during* the test rather than after a result exists, so it isn't
really a "result-to-share" action) reaches 35.46%, but was not used as the
gate metric for that conceptual reason. Challenge open-to-complete came out
24/82 = 29.27%, above the 25% gate, on 65 `challenge_share_ready` events -
comfortably past the ~30-event minimum sample the task itself required
before trusting the number (the original 2026-08-05 read had only 14 total
challenges). Per `TASK-166`'s own AC#2, applied the escalation exactly as
specified: `TASK-33` and `TASK-156` both moved to `High` priority,
`TASK-156` also moved `Backlog` → `To Do`.

Consequences: a real least-privilege credential (`mtm-analytics-ro` local AWS
CLI profile) now exists for this kind of read-only analytics work going
forward, so the root-credential question shouldn't recur for scans against
these two tables specifically - any *new* table this credential doesn't cover
still needs either a policy update or a fresh scoped identity, never a reach
for root. `TASK-33`/`TASK-156` (sharing attribution/A-B testing and
unifying the fragmented share-card flow) are now `High`/`To Do` and should be
picked up before the next share-rate remeasurement. One loose end surfaced but
not chased down: the legacy `user_analytics` table recorded 860 fresh
`results_analyzed` events in this same 25-day window, more than the 589
`result_viewed` events the new-schema `product_events` table recorded for the
same conceptual action - the legacy write path looks more active than
expected for a table doc-1 frames as historical-only; worth a follow-up scan
to identify the source (an old cached client version, a stale endpoint) if
someone revisits this area.

### ADR-098 — Growth plan Phase 0/1: cohort retention, per-channel/per-variant viral coefficient via UTM tagging, and a unified primary share action (TASK-41/33/156)

Context: asked for an expert growth-hacker read on the accumulated analytics
(SEO near-zero, `TASK-166`'s share rate/open-to-complete numbers, Party/Duel
funnels) and a concrete plan to make the product spread. The honest
diagnosis: the referral conversion half of the loop already works
(open-to-complete 29.27%, above gate) but the initiation half does not
(share rate 11.86-14.29%, below the 15% gate) and there is no compounding
return-visit loop, giving an estimated K-factor around 0.04-0.05 - nowhere
close to self-sustaining virality. The plan sequenced Phase 0 (instrument
what growth actually depends on - cohort retention, real per-channel viral
coefficient) before Phase 1 (fix the share-rate bottleneck directly), both
approved by the user with "usa il 100% del tuo cervello."

Choice: built `TASK-41`'s two AC-required numbers -
`build_retention_cohorts` (D1/D7, pooled not per-day given traffic volume,
withheld below a 30-identity sample) and `build_viral_coefficient`
(completed referrals per share attempt, by channel). The per-channel
requirement turned out to depend on attribution that didn't exist yet for
the Duel loop specifically: `challenge_token` is deliberately excluded from
analytics (`TASK-200`, same treatment as `room_code`/`public_id`), so
per-channel/per-variant attribution needed a non-identifying join key
instead. Discovered that one already existed and was silently unused: the
`utm` field has been captured client-side and written to DynamoDB since
Daily Moral Crime's "Ask the Audience" share, but nothing on the read side
ever parsed it back out - a dead, one-directional pipe. Extended
`normalize_analytics_event` to read it, then built `TASK-33` on top: every
outbound Duel share link (`ResultsScreen.jsx`, `ChallengeLandingScreen.jsx`,
`ChallengeCompareScreen.jsx`) now carries `utm_source`/`utm_medium`/
`utm_campaign` (channel/creative attribution, `attribution.js`'s
`withShareAttribution`) and `utm_content` (a creative variant - `archetype`,
`radar`, or `provocative` framing for the invite, deterministically bucketed
per sharer's `anonymousUserId` via `getShareCreativeVariant` so the same
person keeps seeing/sending the same one). `build_creative_variant_breakdown`
exposes conversion per variant the same way `build_viral_coefficient` does
per channel. For `TASK-156`, replaced ResultsScreen's five equal-weight,
partially-broken share buttons (WhatsApp/Facebook text-only that couldn't
carry the image; two separate "download" buttons with no send action) with
one primary action - the stories-format share card, which already opened the
native share sheet with the image attached where supported
(`shareOrDownloadCard`, pre-existing) - keeping the rest as a smaller,
de-emphasized "share another way" row rather than deleting any of them.

Consequences: the dashboard's new Growth tab can now show which channel and
which invite framing actually converts, not just how often a share button
was clicked - the two numbers a grow­th-hacking iteration loop needs to know
what to change next. All three tasks' new backend functions are covered by
unit tests (193 backend tests total, up from 189), and `pnpm lint`/
`build:prod` pass. This is the second time an accidentally-unused,
already-implemented mechanism turned out to be the missing piece for a
growth task in one day (UTM capture here; the Daily-only dedicated dashboard
gap in `ADR-096`) - worth remembering that "build it" is sometimes actually
"wire up what already exists" once the codebase gets audited properly. No
version-numbers were fabricated for the "radar" creative variant copy
(CLAUDE.md/`shareCard.js` explicitly ban invented percentiles); it hooks the
six-dimension test itself as the curiosity driver instead of a fake stat.
App version bump required before this ships to Android (packaged frontend
code changed); per `CLAUDE.md` a `versionCode` bump auto-publishes to Google
Play production with no review gate, so that specific push needs the user's
explicit go-ahead every time, independent of this session's general
commit/push authorization.

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
