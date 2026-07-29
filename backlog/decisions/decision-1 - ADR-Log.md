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
