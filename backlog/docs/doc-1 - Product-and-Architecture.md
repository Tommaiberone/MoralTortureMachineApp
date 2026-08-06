---
id: doc-1
title: Product and Architecture
type: architecture
created_date: '2026-07-29 11:22'
---

# Moral Torture Machine — Product and Architecture

This document is the architectural source of truth for implementation work.
Product tasks and their delivery state live in `backlog/tasks/`; strategic goals
and validation gates live in `backlog/docs/doc-2`.

## Product boundary

Moral Torture Machine is evolving from a solo ethical-dilemma quiz into a social
comparison game. The core loop is short test -> moral archetype -> challenge a
specific person -> both complete -> comparison -> rematch/share.

During validation, do not build a public feed, comments, direct messages,
followers, or public user-generated content. Invitation and comparison loops
take priority over a generic social graph.

## Runtime architecture

| Layer | Technology | Location |
|---|---|---|
| Web frontend | React 19, Vite, React Router, i18next, Recharts | `frontend/src/` |
| Android | Capacitor 8 wrapper around the shared frontend | `frontend/android/` |
| Backend | FastAPI on AWS Lambda through Mangum | `backend/src/` |
| API | API Gateway HTTP API | `backend/terraform/` |
| Data | DynamoDB on-demand in `eu-west-1` | `backend/terraform/` |
| Hosting | S3 and CloudFront | `frontend/terraform/` |
| AI | Groq free tier, called only by the backend | backend integrations |
| Infrastructure | Terraform | `backend/terraform/`, `frontend/terraform/` |

AWS has exactly one production stack. Development and validation are local-only:
never create a parallel dev stack, Terraform workspace, dev bucket, dev API,
dev table, or `/dev` SSM hierarchy.

## Cross-platform contract

- Web and Android share product behavior, translations, analytics schemas, and
  API contracts wherever technically possible.
- Platform-specific code must be isolated behind narrow adapters.
- Every analytics event carries an exact `platform` value for new data (`web` or
  `android`) and the app version where available.
- Historical platform inference remains explicitly labeled `inferred`.
- Before changing the backend in a way that makes the distributed Android APK
  insufficient or incompatible, stop and warn the user before implementation.

## Identity and authentication

- Anonymous play remains available through the first useful result.
- `anonymous_user_id` persists per browser/installation; `session_id` is scoped
  to the current tab/session; native builds also expose an `install_id`.
- Request identity uses `X-Anonymous-User-Id` and `X-Session-Id`.
- Web authentication uses Cognito managed login with Google, authorization code
  plus PKCE. Browser tokens use `sessionStorage`, never `localStorage`.
- Android uses a separate public Cognito app client, the system browser, PKCE,
  and the `moraltorturemachine://auth/callback` deep link. Native session and PKCE
  material are encrypted by an AES-GCM key stored in Android Keystore.
- The backend validates JWT signature, issuer, audience, expiry, token use, and
  the `admins` group for both explicit app-client audiences. Analytics access
  has no key fallback.
- Authenticated ownership is keyed by immutable provider subject, never email.
- Public profile IDs and invite tokens are non-enumerable.
- `backend/src/backend_fastapi.py` has two auth dependency shapes: mandatory
  (`require_authenticated_user`, 401 if missing/invalid) and optional
  (`get_optional_user`, returns `None` instead of raising so anonymous
  endpoints stay anonymous). Both call the same `verify_cognito_id_token`.
- The `users` DynamoDB table (`backend/terraform/main.tf`) is keyed by the
  immutable Cognito `sub`, provisioned capacity (1/1 RCU-WCU, within the
  always-free allowance) rather than on-demand, and has PITR disabled by
  default pending `TASK-89`. `upsert_user_record` idempotently creates/updates
  a user record on every authenticated call (wired into `GET /auth/me`).
- `POST /users/claim-anonymous-data` links an `anonymous_user_id` to the
  authenticated account via a single-table claim-lock item
  (`sub = "anon#<id>"`, conditional `PutItem` on `ownerSub`): idempotent for
  the same account, rejected with 409 for a different one.
- `GET /users/export` has schema v2 and uses the account's authoritative
  `anon#<anonymous_user_id>` claim-lock rows to include only that user's
  account, profiles, social participations, and raw analytics. It never
  exports a counterparty's profile, choices, display name, or derived data.
  `DELETE /users/me` is an idempotent cascade: it removes Cognito, the app
  account, claim locks, profiles, raw analytics, and any Duel/Party object
  that contains the deleted participant's derived data. The whole shared
  object is removed rather than retaining an incoherent comparison. The
  public `/delete-account` route reuses the existing Cognito web/Android auth
  flow, and the current client clears local IDs, queued events, challenge
  progress, and cached game state after a successful deletion.
- Accounts and profiles have a twelve-month inactivity policy. A restored
  authenticated session calls `/auth/me`, and authenticated social paths also
  refresh `lastActiveAt`; profile creation/access (including Duel use) refreshes
  `lastAccessedAt` without recreating a row deleted concurrently.
  DynamoDB TTL is enabled for profiles but is asynchronous, so API reads hide
  expired profiles immediately. A daily EventBridge-triggered Lambda applies
  the same cascade to expired accounts, including Cognito deletion, because
  TTL alone cannot safely delete a federated account or related social data.
  Its dedicated IAM role has only lifecycle-table and required Cognito access.
- The `auth_write` burst-guard bucket (`ABUSE_AUTH_WRITE_REQUESTS_PER_MINUTE`,
  default 10/minute) rate-limits `/users/claim-anonymous-data`, `/users/me`,
  and `/auth/me`, independent of the `global`/`ai`/`analytics_ingest` buckets.

## Data and scoring rules

- Archetypes and compatibility are deterministic, testable, symmetric where
  applicable, and versioned.
- The moral archetype engine (`backend/src/archetype_engine.py`) assigns one of
  the 14 archetypes defined in `backend/data/archetypes.json` (versioned
  bilingual content: name, description, strength, blind spot, share phrase,
  visual identity) by nearest-centroid Euclidean distance over the six scored
  dimensions (Empathy, Integrity, Responsibility, Justice, Altruism, Honesty).
  It never calls Groq, so it works identically whether or not Groq is
  available. Ties resolve to the lowest archetype id for reproducibility.
  `POST /analyze-results` returns it alongside the AI prose as `archetype`,
  carrying `archetypesVersion` from the content file. Since `TASK-121`, the
  archetype's own name/description are also fed into the Groq prompt (in
  addition to the dimension averages and per-dilemma choices already sent),
  with an instruction that the generated text will render as the
  description directly under the archetype's name on `ResultsScreen` - the
  archetype assignment itself stays entirely independent of Groq either way.
- A profile stores the `archetypeId` and `archetypesVersion` matched when it
  was created, but profile and Duel reads deliberately recompute the
  archetype from its stored dimension averages using the *current* catalog.
  Per `TASK-25.1` / ADR-072, a catalog version that changes centroids
  intentionally reclassifies existing profiles on their next read; the
  stored version is historical attribution, not a display-freeze key.
- Because the Lambda deployment package (`.github/workflows/deploy.yml`) copies
  `backend/src/backend_fastapi.py`, `backend/src/archetype_engine.py`, and
  `backend/data/archetypes.json` as flat siblings (no subfolders), the import
  in `backend_fastapi.py` and the data-path lookup in `archetype_engine.py`
  both try the flat Lambda layout first and fall back to the repository's
  `backend/src/` + `backend/data/` layout, so the same code runs unmodified
  locally, in tests, and deployed.
- **Moral Duel** (`TASK-28`/`34`-`40`) adds three tables, all provisioned 1/1
  within the shared Free Tier: `moral_profiles` (shareable profile, PK
  `publicId` — a `secrets.token_urlsafe(16)` token, GSI `OwnerIndex` on
  `ownerAnonymousUserId`+`createdAt` to find the caller's latest profile, TTL
  on `expirationTime` plus API enforcement after 12 months of inactivity),
  `challenges` (PK `challengeToken`, same token scheme, TTL on
  `expirationTime` so an abandoned challenge expires), and
  `challenge_participants` (PK `challengeToken`, SK `role` = `creator`|
  `invitee`). A profile stores its `dilemmaBaseIds` (the language-neutral IDs
  shared across `dilemmas_en.json`/`dilemmas_it.json`, per
  `scripts/populate_dynamodb_multilang.py`'s `{baseId}-{lang}` composite key)
  so a Duel invitee can be served the exact same dilemmas in their own
  language via `GET /dilemmas/by-ids`.
- The Duel API (`POST /profiles`, `GET /profiles/{publicId}`,
  `POST /challenges`, `GET /challenges/{token}`, `POST .../join`,
  `POST .../submit`, `GET .../compare`, `POST .../rematch`,
  `POST .../revoke`) only requires the base `X-Anonymous-User-Id` identity for
  a caller's *first* Duel interaction; `require_authenticated_for_repeat_duel`
  (`TASK-136`) additionally requires a Cognito bearer token from the second
  one on for `create_challenge`/`join_challenge`, and unconditionally for
  `rematch_challenge` (a rematch only exists after completing a first one, so
  it is always a repeat). "First interaction" is detected by
  `_has_prior_profile`, a bounded `Limit=5` query against the existing
  `moral_profiles` `OwnerIndex` GSI (no new table/index, no Scan) checking
  whether the caller already owns a profile besides the one just used for the
  current action - a profile is only ever created by "challenge a friend" or
  by an invitee's submit, so owning any other one means this is not the
  caller's first Duel interaction. An unmet gate raises `401` with
  `detail: "login_required"`, which the frontend (`ResultsScreen.jsx`,
  `ChallengeLandingScreen.jsx`, `ChallengeCompareScreen.jsx`) renders as a
  dedicated login CTA instead of a generic error, never a hard crash. Every
  state transition is still validated (`ensure_challenge_is_actionable`) and
  idempotent at the DynamoDB level via `ConditionExpression`, not just an
  application-level check: a repeated join by the same invitee is a no-op, a
  second distinct invitee gets 409, and a second submit is rejected because
  `submittedAt` already exists. The opponent's dimension averages and
  archetype are never returned before the challenge reaches `completed`; the
  pre-unlock `open_challenge` response is a teaser (archetype name/visual/
  share phrase only).
- `backend/src/compatibility_engine.py` computes Duel compatibility from two
  participants' dimension averages by per-dimension distance, with no AI and
  no dependency on which dilemmas were used. `compute_compatibility(A, B)`
  always equals `compute_compatibility(B, A)` (only the `a`/`b` per-dimension
  labels swap); `COMPATIBILITY_VERSION` is returned in every comparison.
- `GET /challenges/{token}/compare` additionally returns a `pairInsight`
  (`TASK-135`) - one short AI-enriched sentence about what the specific
  archetype pairing means - only when `get_optional_user` resolves a caller
  (`pairInsightUnlocked: true`); an anonymous caller still gets the full
  aggregate comparison above for free, just not this one extra sentence. This
  is the concrete, contextual login incentive for `TASK-14`, replacing an
  earlier "save your result" framing. Generated once via
  `_generate_duel_pair_insight` and cached on the `challenges` record
  (`pairInsight` field, `attribute_not_exists` conditional write, same
  never-regenerate-per-view pattern as the Party Room group verdict) with a
  deterministic `_fallback_duel_pair_insight` when Groq is unavailable. The
  prompt receives only archetype names and aggregate percentages
  (`overallAgreementPct`, `mostAlignedDimension`, `mostDivergentDimension`) -
  never raw per-dilemma answers/choices, which `TASK-39` already decided
  never to expose even to the two participants themselves.
- AI can enrich presentation but cannot determine scores or core outcomes.
- Generated AI output is persisted and reused; every core flow has a
  deterministic fallback when Groq is unavailable.
- Profiles are private/unlisted by default. Public APIs never expose emails,
  answer details, private IDs, tokens, or other private attributes.
- Ephemeral records use TTL. Current DynamoDB tables remain on-demand only while
  `TASK-88` evaluates a safe migration; new tables must first use DynamoDB
  Standard provisioned capacity within the shared Free Tier when the measured
  workload makes that configuration technically adequate.
- **Party Room** (`TASK-46`/`47`, ADR-050/051) is the same-room live variant:
  `party_rooms` (PK `roomCode`, a short 6-character human-shareable code, not
  a long opaque token like Duel's, since it is read aloud/typed/QR-scanned by
  people together in person and the room expires in hours) and
  `party_participants` (PK `roomCode`, SK `participantId` = the caller's
  existing `anonymous_user_id`, with per-round votes in a nested map, both
  provisioned 1/1 with a 6h TTL). There is no WebSocket. Every `GET`/`POST`
  first runs `_advance_party_room_if_due`, which moves `lobby -> question ->
  reveal -> question... -> completed` via a conditional DynamoDB update so
  concurrent pollers never double-advance. Since `TASK-123`/ADR-057 there is
  no visible timer driving this: voting ends only once everyone has voted,
  and the reveal phase ends only via the host-only `POST
  /party-rooms/{code}/advance` (mirroring the lobby's host-only `start`) -
  the stored deadline is purely a long safety-net timeout for an abandoned
  room, never surfaced as a countdown. `GET /party-rooms/{code}` never
  returns another participant's raw `anonymous_user_id`, only `isCaller` on
  the caller's own entry. `backend/src/party_awards.py` (`TASK-48`/`123`,
  ADR-052/057) computes five group awards once the room is `completed` -
  closest pair, moral minority, and its inverse "most aligned with the
  group" reuse `compatibility_engine.compute_compatibility` over
  participant-index keys (both minority and most-aligned need 3+
  participants and are `null` otherwise, never fabricated); "the contrarian"
  counts how often each participant picked a round's minority option; and
  most-controversial-dilemma picks the round with the closest first/second
  split. A one-line AI group verdict (`_generate_party_group_verdict`,
  archetype names only, never participant names) is generated once and
  cached on the room record, with a deterministic no-AI fallback. `shareCard.js`'s
  `sharePartyRecapCard` renders the awards client-side onto the same canvas
  approach as the archetype share card (no AI, no server round trip).
  A load-tested tuning of the polling rate limit and the abandoned-room
  safety-net timeout is deliberately deferred to `TASK-49`.

## Analytics contract

- Client analytics is buffered, batched, idempotent, non-blocking, and unable to
  break gameplay.
- `frontend/src/utils/errorReporting.js` reports uncaught errors, unhandled
  promise rejections, and React error-boundary catches as a
  `frontend_error_reported` event through the same `trackEvent` pipeline. The
  payload is a fixed set of technical fields (error name/message/stack,
  component stack, route), each truncated client-side to 200 characters; it
  never carries PII, tokens, dilemma/answer text, or AI output, and a
  reporting failure can never affect the UX it describes.
- Event names use `snake_case`; schemas are versioned; `event_id` is the
  idempotency key.
- Never collect raw email, auth tokens, IP addresses, full dilemma response
  text, or AI analysis in client event properties.
- Shared fields include anonymous and session identity, occurrence time,
  platform, app version, locale, device-declared IANA-style timezone, referrer
  origin, filtered UTMs, and experiment assignment. No analytics property may
  carry unlisted public-profile IDs, room codes, link paths, email, tokens,
  answer/dilemma text, or AI analysis; backend validation enforces the same
  rule for malicious or stale clients. Timezone is never inferred from an IP
  and is presented as `unknown` for historical rows. Raw first-party analytics
  have a 90-day TTL.
- `/admin/analytics` consumes privacy-safe aggregates from
  `/admin/analytics/overview` and intentionally has a separate, Notion-like
  operational visual language from the public horror-themed product.
  `summary.registeredUsers` (TASK-128, ADR-058) is a lifetime `Select=COUNT`
  scan of `users_table` excluding `anon#` claim-lock rows, not scoped by the
  `days`/`platform` filters like the rest of the summary; it reuses the same
  60-second overview cache and falls back to `null` on a scan error. The
  screen itself (`AnalyticsAdminScreen.jsx`) is single-panel tabs
  (`role="tablist"`/`tabpanel`, one section mounted at a time) driven by
  sidebar clicks, not the former continuous scroll-spy: only the KPI band
  (including `registeredUsers`) stays always visible above the active tab.
- Abuse monitoring groups events using a server-generated, HMAC-peppered network
  pseudonym where available, falling back to anonymous or session identity. The
  dashboard returns only a short derived mask, behavioral counts, thresholds,
  and reason codes; it never returns the source IP or full user-agent.
- `watch` and `suspicious` are review signals, not proof that an identity is a
  bot. Platform filters also apply to abuse aggregates so web and Android remain
  directly comparable.
- Analytics administration is restricted exclusively to a verified Cognito ID
  token with `cognito:groups` containing `admins`. The existing Standard SSM
  SecureString is retained only as an internal HMAC pepper for network
  pseudonyms, not as a client-supplied access credential.
- Growth intelligence runs as a scheduled GitHub Actions report, not in the
  product runtime or AWS. It reads only aggregate Search Console, GA4,
  PageSpeed, Google Play acquisition-report and Android Vitals signals, then
  produces a private artifact and optional manually requested review issue.
  It has no publishing, listing-edit, asset-upload, release, or web-content
  mutation capability. GitHub OIDC exchanges a short-lived token for a
  keyless Google service account restricted to this repository; no static
  credential is available to the frontend, Lambda, Android APK, or GitHub
  Secrets.
- Google Play listing text is supplied as a checked-in human-maintained
  snapshot for character-limit review; the reporting identity intentionally
  lacks the store-listing edit permission. Actual ASO listing changes belong to
  `TASK-79` after the social MVP and require explicit human approval.
- GA4 is optional and web-only. The Google tag must not be requested before
  explicit consent stored in the first-party `mtm_web_analytics_consent` cookie
  (180 days). The deployment pipeline injects `GA4_MEASUREMENT_ID` only into
  the web build. All Google advertising-related consent states remain denied,
  Google signals and ad-personalisation signals are disabled, and consent can
  be changed from the persistent Privacy preferences control. The native app
  continues to use only the existing first-party analytics pipeline.
- The `configure_ga4_retention` input of
  `.github/workflows/growth-intelligence.yml` enables a manual-only, narrowly
  scoped administration job. The scheduled report remains read-only; this
  separately gated job exchanges GitHub OIDC for the existing Google service
  account, updates only GA4 event and user retention fields to `TWO_MONTHS`,
  then reads them back to verify the result. It never deploys the web app or
  APK.
- The public Privacy, Cookie, and Terms routes are `/privacy`, `/cookies`, and
  `/terms`. `growth-intelligence/data-safety.md` is the versioned source for
  the Google Play Data Safety declaration; it maps the Android data flows and
  retention to the form, but an owner must still manually verify and submit the
  declaration in Play Console before it can truthfully be called published.
- Groq receives the prompt data necessary to generate requested analysis.
  First-party storage does not retain the prompt/output as an account profile or
  analytics field; Groq's published inference policy permits up to 30 days for
  reliability/abuse monitoring unless its Zero Data Retention control is enabled.
  The current product has no payment, receipt, or entitlement data; any future
  billing design must define its retention and legal-obligation exception first.

## Organic discovery architecture

- Non-brand organic discovery is served by six hand-authored, intent-led React
  routes: English and Italian versions of the moral-dilemma test, ethical
  dilemmas, and moral-dilemma game. Content lives in
  `frontend/src/content/seoLandings.js`; the shared screen is
  `frontend/src/screens/SeoLandingScreen.jsx`.
- Each landing has its own canonical URL, reciprocal `hreflang` pair,
  visible FAQ, internal links, FAQ/WebPage/Breadcrumb structured data, and a
  matching `sitemap.xml` entry. These routes must remain editorial pages, not
  programmatically scaled keyword variants, and must not claim to diagnose a
  person or determine moral worth.
- GA4 remains web-only and optional. Once its tag was loaded after affirmative
  consent, the first displayed result sends only the parameter-free
  `result_viewed` event to GA4. First-party analytics remains the complete
  product telemetry source; no email, user ID, answer, token, or event
  property is sent to GA4.
- The scheduled Growth Intelligence report also contains a zero-AWS-cost demand
  radar. It starts from a small, checked-in bilingual seed set, uses a
  read-only autocomplete signal for wording, compares candidates with current
  coverage and Search Console rows, and can optionally enrich exact queries
  from a human-exported Keyword Planner CSV. Directional suggestions are never
  presented as volume or certain demand; no Google Ads credential, campaign,
  or mutation capability exists in the workflow.
- Search Console is collected twice in the same read-only window: a detailed
  query/page/device/country dataset for diagnosis and a query/page aggregate
  for thresholds, ranking and radar matching. The workflow retains compact,
  private aggregate report artifacts for 90 days and reads prior artifacts only
  through the GitHub Actions read permission; unavailable history is non-fatal.
- PageSpeed is measured for home plus every configured bilingual discovery
  landing, with mobile/desktop results named by route. Play Vitals retries only
  transient rate/server failures with bounded backoff; it never performs a
  Play mutation or turns a source outage into a product failure.

## Cost and operational constraints

- AWS Free Tier is a mandatory architecture default. For every new AWS
  capability or material change, verify official current pricing, account and
  Region eligibility, shared allowances, expiry conditions, and forecast usage;
  select and configure a technically adequate Free Tier option whenever one
  exists. Serverless or pay-per-use is not equivalent to Free Tier.
- If a Free Tier solution is not technically adequate or will be exceeded, stop
  before provisioning. Present cost, alternatives, trade-offs, owner, budget
  guardrail, and kill switch; require explicit approval and record the exception
  in Backlog.md and the ADR log.
- Groq remains free-tier-only unless explicitly approved.
- Batch analytics writes and cache/persist generated content.
- Use ordinary HTTP for both asynchronous Moral Duel and Party Room (ADR-050
  supersedes the earlier WebSocket-for-Party-Room default): Party Room state
  (presence, current dilemma, timer, votes) is read via client polling over
  the same API Gateway HTTP + Lambda + DynamoDB pattern, with the reveal
  countdown synchronized by a server-provided deadline timestamp rather than
  a push per tick. This avoids API Gateway WebSocket's introductory-only
  Free Tier and its `$connect`/`$disconnect` connection lifecycle entirely.
- Generate social cards client-side or from cached deterministic templates:
  `frontend/src/utils/shareCard.js` renders the Stories (9:16) and square
  (1:1) archetype cards on an offscreen canvas, with no AI and no server
  round trip. `shareOrDownloadCard` (`TASK-32`) tries `navigator.share({files})`
  (Web Share API) first, so the Android WebView opens the native share sheet
  with the generated PNG instead of relying on `<a download>`, which does not
  reliably save a file inside that WebView; it falls back to the anchor
  download only when file sharing isn't available (mainly desktop browsers).
  `generateShareCardDataUrl` (`TASK-133`) also takes an optional `dimensions`
  array (the same `{subject, value}` shape as the Results radar chart) to draw
  a mini bar chart plus the archetype's `strength`/`blindSpot` lines, since an
  emoji-and-quote card alone carried no real content to share. `shareCard.js`
  also exports `generateDuelCardDataUrl`/`shareDuelCard` (`TASK-134`), a
  Stories-sized card for the Moral Duel comparison itself (both archetypes,
  overall compatibility %, most aligned/divergent dimension) rendered from
  `GET /challenges/{token}/compare`'s response only - never raw per-dilemma
  answers, same constraint as the JSON response itself.
- Avoid SMS. Use FCM only after an explicit opt-in value moment.
- Reassess Cognito at 8,000 MAU and before exceeding the 10,000 MAU free tier.
- Every new variable-cost service needs an owner, budget alarm, and fallback.
- The first abuse-protection layer is an in-memory sliding-window guard in each
  warm Lambda container: 120 total requests/minute, 12 AI requests/minute, 30
  analytics batches/minute, 10 authenticated-write requests/minute, 15 Moral
  Duel write requests/minute, and 60 public unauthenticated read
  requests/minute (profile reads, challenge teaser/compare, batch dilemma
  lookup - `TASK-67`) per transient network source by default. It adds no AWS
  service, is configurable through Terraform, and is deliberately best-effort
  rather than a globally consistent distributed limit.
- `TASK-104`/`TASK-129`: every 4xx/5xx response (including an uncaught
  exception) emails the existing `ops_alerts` SNS topic (ADR-031) through a
  `notify_ops_of_errors` middleware and also persists one item to the
  `ops_error_alerts` DynamoDB table (`backend/terraform/main.tf`, provisioned
  1/1, 30-day TTL), coalesced to at most one notification+row per
  `(status_code, path signature)` pair per
  `OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS` (default 600s) per warm Lambda
  container, so an ordinary burst of the same expected 4xx (e.g. a repeated
  Duel 409) cannot flood the owner's inbox. The "path signature" is the
  matched route template (`request.scope["route"].path`, e.g.
  `/party-rooms/{room_code}`) when the router resolved one, so different
  resource instances of the same endpoint coalesce together instead of one
  alert each; a burst-guard 429 never reaches the router, so it falls back to
  the burst guard's own rule name (e.g. `rate_limit:party_room_poll`) instead
  of the literal parameterized path (ADR-059). IAM grants only `sns:Publish`
  on the ops_alerts topic and the usual table CRUD on `ops_error_alerts`; a
  notification/persistence failure is caught and never affects the response
  it describes. `.claude/commands/ops-alerts-sweep.md` (`TASK-130`) is a
  project skill that scans/groups/triages that table and deletes only the
  rows it can confidently resolve, routing anything else through the normal
  Backlog.md process instead of touching product code itself.
- `TASK-131`: `GET /robots.txt` on the API domain returns a `200` disallow-all
  instead of a `404` - the API is not the indexable site (the frontend serves
  its own via CloudFront/S3), so a bot probing the API host directly used to
  keep triggering the ops error alert above for pure noise.
- `AnalyticsEvent.validate_properties` screens both the property *key* (blocks
  `email`/`password`/`token`/`secret`/`ip`/`analysis` tokens) and, since
  `TASK-65`, the property *value* (rejects a string that looks like an email
  address or a JWT/bearer token), so an innocuously-named field can't leak PII
  into the event store at ingestion time.
- API Gateway access logs record a route key rather than a literal request path
  and do not store the raw source IP, so unlisted profile/challenge/room tokens
  do not enter access logs. Application alerting likewise stores the matched
  route template or an explicit rule signature, never an unmatched literal
  path. Stronger distributed enforcement or AWS WAF requires a new cost/Free
  Tier review and explicit approval.
- One monthly AWS Cost Budget (`backend/terraform/observability.tf`, $200
  limit) sends progressive notifications at $10/$50/$200 actual spend, and
  four CloudWatch alarms (Lambda errors/duration, API Gateway 5xx/latency)
  post to the same SNS topic. Recipient and first-response steps for every
  notification are in `docs/OPERATIONS_RUNBOOK.md`. Both require
  `terraform apply` to take effect; they validate but were not applied in the
  session that added them.
- The Lambda IAM policy must grant `dynamodb:BatchWriteItem` (used by
  `product_events_table.batch_writer`) and `dynamodb:DeleteItem` explicitly —
  neither is implied by `PutItem`. A missing `BatchWriteItem` grant silently
  discarded every `POST /analytics/events` batch (both platforms) from launch
  until this was found and fixed; see the ADR log.

### AWS Free Tier audit snapshot — 2026-07-29

The live check used AWS CLI profile `personal`; July month-to-date unblended AWS
cost is effectively USD 0. The zero bill does not remove the configuration
conflicts below.

| Component | Live state | Classification |
|---|---|---|
| Lambda | 512 MB, 30 s; July cost USD 0 | Aligned at current traffic; perpetual Lambda allowance still needs usage monitoring |
| API Gateway HTTP API | July cost USD 0 | Conditional: its service Free Tier is introductory, so account eligibility and expiry must be checked |
| DynamoDB application tables | Four prod tables use `PAY_PER_REQUEST`; about 6.75 MB and 18,941 items in total | Conflict: request usage does not use the provisioned-capacity Free Tier; tracked by `TASK-88` |
| DynamoDB state/legacy tables | Two Terraform lock tables and one unprefixed legacy dilemma table also use `PAY_PER_REQUEST` | Conflict/technical debt; included in `TASK-88`, with legacy cleanup in `TASK-90` |
| DynamoDB PITR | Enabled on dilemmas, user analytics, and story flows | Accepted cost (ADR-048, `TASK-89` closed): no Free Tier allowance exists for PITR, but at current table sizes (~7MB largest) the real cost is a fraction of a cent/month, not worth the effort to change |
| SSM Parameter Store | Two Standard SecureString parameters | Aligned; Standard tier has no additional Parameter Store charge at standard throughput |
| CloudWatch Logs | Two groups, seven-day retention, about 3.5 MB stored; July cost USD 0 | Aligned at current usage; keep ingestion, queries, metrics, and alarms within their allowances |
| S3 and CloudFront | About 1.45 MB frontend assets, 86,962 July CloudFront requests, and about 0.62 GB transfer; July cost effectively USD 0 | Aligned at current usage, but recheck plan/allowance before traffic campaigns |
| Cognito for this product | Essentials is declared in Terraform but the project user pool is not deployed | Planned configuration is aligned for direct/social sign-in up to the current 10,000 MAU allowance; no SMS, M2M, Plus, or paid add-ons |
| Party Room realtime | Code-complete (`TASK-46`/`47`, ADR-051), not yet deployed | Uses HTTP polling over the already-provisioned API Gateway HTTP + Lambda + DynamoDB stack (2 new provisioned 1/1 tables) instead of API Gateway WebSocket, avoiding its introductory-only Free Tier entirely (ADR-050, `TASK-91` closed) |

## Repository workflow

Task state, priority, dependencies, acceptance criteria, open questions, and
future work are maintained with the Backlog.md CLI. `ROADMAP_SOCIAL_GROWTH.md`
is a migration pointer only and must not be used as a second mutable task list.

`.claude/commands/routine-serale.md` (`TASK-108`) is a project slash command
(`/routine-serale`, or the trigger phrase "Vai con la routine serale") that
works through the `To Do` column autonomously, triaging each task as safe to
implement unattended versus needing the user, and always stops for one
explicit confirmation before the final commit/push/SNS-recap step - see
ADR-043 for the full protocol and why deploy stays gated.

## Release automation

- `.github/workflows/deploy.yml` builds and signs the release AAB on every push
  to `main` (job `android-build`). Its "Build web app" step now also injects
  `VITE_COGNITO_DOMAIN`/`VITE_COGNITO_CLIENT_ID`/`VITE_COGNITO_NATIVE_CLIENT_ID`
  from the `backend-deploy` job outputs, mirroring `frontend-deploy` - found
  during `TASK-18`/`TASK-86` follow-up work that these were missing from this
  job specifically: every Android build before this fix embedded an empty
  Cognito config, so `isGoogleAuthAvailable()` was always `false` on Android
  and `AuthButton` never rendered at all, regardless of how complete the
  native PKCE/Keystore code (`frontend/src/auth/authClient.js`) was. This is
  the likely root cause of `TASK-18`/`TASK-86` never having a device
  confirm a working Android login. The fix makes the *next* Android build
  carry real credentials, but does not itself constitute the device-level
  end-to-end verification those tasks' acceptance criteria still require.
- A separate job, `play-store-publish`, pushes that same AAB to Google Play
  through the Play Developer API (`r0adkll/upload-google-play`). Per ADR-017 it
  fires automatically, straight to the `production` track, whenever a push to
  `main` raises `versionCode` in `frontend/android/app/build.gradle` (detected
  by diffing that file against the prior commit); an ordinary push that leaves
  `versionCode` untouched still builds Android artifacts but never publishes.
  There is no human approval step between a version-bumped commit and a public
  Play Store release — see ADR-017 for the explicit trade-off and rollback path.
- Manual `workflow_dispatch` with `publish_to_play_store: true` remains
  available for ad-hoc publishes to a chosen `play_store_track`
  (`internal`/`alpha`/`beta`/`production`, defaulting to `internal`), independent
  of whether `versionCode` changed — useful for testing without a real bump.
- Authentication uses a dedicated Play Console service account whose JSON key is
  stored only as the GitHub secret `PLAY_STORE_SERVICE_ACCOUNT_JSON`; it is
  never written to the repository or persisted on the runner beyond the job.
- The Google Play Developer API itself is free; this does not add an AWS
  resource, workspace, or variable-cost service, so it sits outside the AWS
  Free Tier review process.
- Google Play requires at least one prior manual release on the target track
  before API-based publishing is accepted for that track.
