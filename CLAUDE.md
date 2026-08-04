# Moral Torture Machine — Repository Instructions

This file is the authoritative instruction source for AI coding agents working
in this repository. `AGENTS.md` intentionally points here.

## Product direction

Moral Torture Machine is evolving from a solo ethical-dilemma quiz into a
social comparison game. The central loop is short test -> moral archetype ->
challenge a person -> both complete -> comparison -> rematch/share.

Read `backlog/docs/doc-2` before planning product work. Follow the statuses,
priorities, acceptance criteria, and dependency sequence in `backlog/tasks/`
unless the user explicitly changes priorities.

Do not build a public feed, comments, direct messages, followers, or public UGC
during initial validation. Social comparison and invitation loops come first.

## Sources of truth

| Concern | Source |
|---|---|
| Tasks, status, priority, dependencies, open points | `backlog/tasks/` via `backlog task list` and `backlog board` |
| Product and architecture constraints | `backlog/docs/doc-1` via `backlog doc view doc-1` |
| Growth strategy, metrics, validation gates | `backlog/docs/doc-2` via `backlog doc view doc-2` |
| Architecture and product decisions | `backlog/decisions/decision-1` |
| Operational commands, security and workflow rules | This file (`CLAUDE.md`) |

`ROADMAP_SOCIAL_GROWTH.md` is only a migration pointer. Never maintain a second
task checklist there; Backlog.md is the mutable roadmap.

## Mandatory pre-task protocol

Before implementing any task, in this order:

1. Read `backlog/docs/doc-1` and verify the change respects the architecture and
   immutable product constraints.
2. Read `backlog/decisions/decision-1` and verify the approach does not conflict
   with an accepted decision.
3. Run `backlog task list` and find the semantically matching task.
4. If an implementation request has no matching task, create an atomic task with
   acceptance criteria after deduplication.
5. Run `backlog task edit TASK-N --status "In Progress"` before implementation.
   Multiple tasks may be In Progress at once.
6. If the request conflicts with project context, report the conflict before
   proceeding.

Reread the documents and decision log after completing three tasks in one
session, after a change touches more than three files, or whenever project state
is uncertain.

## Mandatory post-task protocol

After completing a tracked task, in this order:

1. Check its acceptance criteria and set it to Done with
   `backlog task edit TASK-N --status "Done"`. If the criteria are narrower
   than what the task's own description promised (e.g. the description says
   "connect X to Y" but the criteria only exercise X in isolation), either
   broaden the criteria to cover the gap or leave it explicitly open and
   unchecked — never close a task as Done on criteria you already know don't
   match its stated intent.
2. Update `backlog/docs/doc-1` when folders/modules, dependencies, architecture,
   global patterns, or immutable constraints changed.
3. Append a concise ADR to `backlog/decisions/decision-1` for every non-trivial
   technical or product decision: context, options, choice, consequences.
4. Verify the completed work does not contradict remaining open tasks.
5. Remove superseded files only after verifying no references remain and the
   relevant checks pass. Do not leave backup copies in the repository.

## Autonomous backlog management

Available columns:

| Column | Meaning |
|---|---|
| `Open Points` | A decision or blocking question requiring a person |
| `To Do` | Ready and high enough priority to implement |
| `In Progress` | Currently being implemented |
| `Blocked` | Started but stopped by an external impediment |
| `Done` | Implemented and verified |
| `Backlog` | Useful future work without current urgency |

Before creating a task, run `backlog task list` and deduplicate semantically.
Tasks must be atomic (normally one session or 1–4 hours), independently useful
where possible, and have verifiable acceptance criteria.

| Trigger | Action |
|---|---|
| Bug or technical debt found during work | Create a low-priority `Backlog` task, then notify the user |
| Missing blocking dependency | Create a high-priority `To Do` task, then notify before continuing |
| Low-impact implicit requirement | Create a `Backlog` task, then notify the user |
| External decision required | Create an `Open Points` task, then notify the user |
| Regression | Create a high-priority `[regression]` To Do task and record the cause in the ADR log |

For low-impact work (under roughly one hour and outside auth, database, public
API, deployment, or core components), create and notify afterward. For higher
impact inferred work, notify and ask before expanding scope. Never modify or
remove a task written by the user without explicit authorization.

Routing rules:

```text
Folder/module/dependency/architecture changed -> backlog/docs/doc-1
Non-trivial technical or product choice        -> backlog/decisions/decision-1
Tracked implementation completed               -> task acceptance criteria + Done
New bug/debt/requirement                        -> backlog task create
Growth metric or strategic gate changed        -> backlog/docs/doc-2
```

## Current architecture

- Frontend: React 19, Vite, React Router, i18next, Recharts.
- Native Android: Capacitor 8 wrapping the frontend.
- Backend: FastAPI on AWS Lambda via Mangum.
- API: API Gateway HTTP API.
- Data: DynamoDB in `eu-west-1`, on-demand billing.
- Frontend hosting: S3 and CloudFront.
- AI: Groq free tier, accessed by the backend.
- Infrastructure: Terraform under `backend/terraform` and `frontend/terraform`.
- AWS has one production stack (`prod`). Development is local-only and must not
  provision a parallel dev stack, dev workspace, dev bucket, dev API, dev table,
  or `/dev` SSM hierarchy.


## Product constraints

- Preserve anonymous gameplay before login.
- Authentication is progressive and tied to saved value.
- Archetypes and compatibility must be deterministic and versioned.
- AI may enrich presentation but must not determine moral scores.
- The core result and duel flow must work when Groq is unavailable.
- Profiles are private/unlisted by default.
- Invite tokens and public profile IDs must be non-enumerable.
- Do not expose emails, answer details, internal IDs, or tokens through public APIs.
- Support Italian and English for every user-facing feature. **Temporary
  exception (TASK-101, 2026-07-31):** the app itself (test/tutorial/results/
  home/account screens) is forced English-only — Italian is hidden, not
  removed (`frontend/src/i18n.js`, `it.json`, IT dilemmas/story flows all
  still exist). The bilingual EN/IT SEO landing pages (ADR-020) are
  unaffected and still render in Italian. Do not reintroduce a language
  switcher or Italian auto-detection for the app without this line being
  updated first.
- **`it.json` drift exception (2026-08-02, at the user's explicit request):**
  production analytics show Italian at under 1% of historical events (153 of
  20,174 in `user-analytics`; ~0 of 467 in `product_events` since TASK-101).
  New app-facing frontend work adds/updates keys in `en.json` only; do not
  add or update matching keys in `it.json` for new features — let it drift
  out of sync rather than spend effort keeping it current. Do not delete or
  otherwise touch existing `it.json` content beyond this. This does not apply
  to the bilingual EN/IT SEO landing pages (ADR-020), which stay maintained
  in both languages. Revisit this exception if Italian is ever reactivated or
  a decision is made to remove it entirely instead of leaving it drifted.

## Cost constraints

- **Mandatory AWS Free Tier rule:** for every new AWS capability or material
  infrastructure change, ALWAYS choose a technically adequate AWS service and
  configuration covered by an AWS Free Tier where one is available, and design
  usage to remain inside its current limits wherever practical. Serverless,
  on-demand, and pay-as-you-go do not by themselves mean free-tier compliant.
- Before implementation, verify current official AWS pricing, the `personal`
  account and Region eligibility, limits shared with other workloads, expected
  usage, and what happens after any introductory period expires. Never rely on
  remembered Free Tier terms because AWS can change them.
- If no technically adequate Free Tier option exists, or projected usage will
  exceed it, stop before provisioning or enabling the paid path. Tell the user
  the expected cost, free alternatives, reliability/product trade-offs, owner,
  budget guardrail, and kill switch; proceed only after explicit approval and
  record the exception in Backlog.md and the ADR log.
- Do not add commitments, provisioned concurrency, NAT Gateways, always-on
  compute/databases, advanced SSM parameters, paid Cognito tiers/add-ons, or
  optional paid backups/observability features without the same explicit
  exception process.
- Groq is currently free. Do not add a paid AI model or enable paid Groq usage
  without explicit approval.
- Persist and reuse AI output; do not regenerate it on every page view.
- Batch analytics events to limit API Gateway, Lambda, and DynamoDB writes.
- Use ordinary HTTP for asynchronous duels; reserve WebSockets for Party Room.
- Generate social cards client-side or from cached deterministic templates.
- Avoid SMS authentication and notification costs.
- Current DynamoDB tables are on-demand pending `TASK-88`; do not copy that
  setting by default. For new or reconfigured tables, prefer DynamoDB Standard
  provisioned capacity within the current shared Free Tier when measured traffic
  makes it technically safe, add TTL to ephemeral data, and treat on-demand or
  paid backup features as explicit exceptions.
- Reassess Cognito Essentials before the product reaches 10,000 MAU.
- Add a free AWS budget/alert and service usage alarms before enabling any new
  variable-cost service; alarms do not make a paid service Free Tier compliant.

## Identity and analytics conventions

- `anonymous_user_id`: persistent per installation/browser until data is cleared.
- `session_id`: scoped to the current tab/session.
- `user_id`: immutable authenticated provider subject, when available.
- `event_id`: UUID used for analytics idempotency.
- Send identity headers using `X-Anonymous-User-Id` and `X-Session-Id`.
- Analytics must be non-blocking and must never break gameplay.
- Never include raw email, auth token, IP address, full dilemma response text,
  or AI analysis in client analytics event properties.
- Use snake_case event names and version event schemas.
- Treat `platform` as a required comparison dimension shared by web and native.
  New events must use exact `web`/`android` values; historical inference must
  always be labeled as inferred rather than mixed into exact data.
- The unlinked `/admin/analytics` route reads only privacy-safe aggregates from
  `/admin/analytics/overview`. Access is exclusively through a verified Cognito
  ID token containing the `admins` group; no dashboard key fallback exists.
- Device timezone may be collected as a bounded IANA-style label for aggregate
  analytics only. Never infer a country, city, or timezone from an IP address.
- Web authentication uses Cognito managed login with Google, authorization-code
  flow, and PKCE. The Google client secret is Terraform/GitHub secret material and
  must never enter frontend environment variables. Browser tokens may use
  `sessionStorage`, never `localStorage`; the backend is the authority for JWT and
  `admins` group validation.
- Android authentication uses a separate public Cognito app client, the system
  browser, PKCE, and `moraltorturemachine://auth/*` deep links. Session and PKCE
  material must be encrypted with Android Keystore; never downgrade native token
  storage to Preferences or plaintext SharedPreferences. The backend accepts the
  explicit web and Android audiences while keeping anonymous APIs compatible with
  older APKs.

## Security and privacy

- Never commit secrets or print values from `.env`, SSM, tokens, receipts, or keys.
- Validate JWT signature, issuer, audience, and expiry server-side.
- Validate every request with bounded Pydantic schemas.
- Apply least-privilege IAM to every new table/service.
- Account deletion must remove associated user data except narrowly documented
  records retained for legal, fraud, or financial obligations.
- Do not use root AWS credentials for routine development or automation.
- Do not log personal data or full request bodies.

## Development workflow

- Never install or invoke Playwright, Puppeteer, chromium-cli, or any other
  browser-automation tool to verify a frontend change: downloading a browser
  binary and driving it burns excessive tokens/time in this repo. Verify UI
  changes with lint, `pnpm build:prod`, and careful manual code review
  instead, and say explicitly that a live browser check was not performed.
  The user runs the manual/browser check themselves.
- Do not create a new git branch unless it is actually necessary (e.g. the
  current branch already has an open, unrelated PR, or the user asks for
  one). Default to continuing work on the current branch rather than
  branching for every task or topic change.
- Preserve unrelated user changes in a dirty worktree.
- Prefer small, reviewable changes aligned to one roadmap milestone.
- Use Backlog.md for every task status, acceptance criterion, dependency, open
  question, and roadmap change.
- Add or update tests with behavioral changes.
- Run the narrowest relevant checks first, then the full available suite.
- Use `apply_patch` for manual file edits.
- **Commit and push standing authorization (2026-08-02, at the user's explicit
  request):** once the work requested in a turn/session is actually done
  (checks passing), commit and push to `main` as the closing step without
  asking again each time — this already triggers the existing CI/CD
  pipeline's backend/frontend deploy, so no separate "can I deploy" question
  is needed for that. Still do not run `terraform apply` locally, and do not
  trigger an explicit Google Play publish (`workflow_dispatch` with
  `publish_to_play_store`), without being explicitly asked. If the diff
  being pushed raises `versionCode` in `frontend/android/app/build.gradle`,
  stop and get explicit confirmation for that specific push before sending
  it: per ADR-017 this alone auto-publishes straight to Google Play
  production with no human review gate, a materially bigger consequence than
  an ordinary web/backend push, and stays worth a deliberate check every
  time regardless of the general authorization above.
- **Mandatory app version bump:** whenever a change makes a new app release
  necessary, bump the version before building or distributing that release.
  This includes changes to packaged web code, user-facing behavior, assets,
  translations, dependencies, Capacitor/native code or configuration,
  permissions, deep links, and backend/API compatibility that requires a new
  APK. Documentation-only, backward-compatible backend-only, and web-only
  deployments that do not alter the packaged app do not require an Android bump.
- Keep `frontend/package.json` `version` and Android `versionName` identical.
  Use semantic versioning: patch for compatible fixes, minor for compatible
  features, and major for breaking product/client changes. Every APK or AAB
  uploaded or distributed for testing or release must have a `versionCode`
  greater than every previously distributed build; never reuse a `versionCode`.
- Record the old and new version plus `versionCode` in the Backlog.md task or
  release summary before the build, and verify analytics reports the new
  `app_version`. One unreleased change set needs one bump; bump again if another
  APK has already been distributed. When uncertain immediately before an APK
  build or release, bump rather than reuse the previous app version.
- **Mandatory Android rebuild warning:** before making any backend change that
  requires rebuilding or redistributing the Android APK, stop and explicitly
  warn the user first. Explain which backend/API change triggers the rebuild,
  why the currently distributed APK would no longer be sufficient or compatible,
  and which Android versions/builds are affected. This includes, for example,
  breaking API contracts, newly mandatory client headers or authentication flows,
  API base URL/deep-link changes, and backend changes coupled to Capacitor/native
  configuration. Backward-compatible, server-only changes do not require this
  warning. Never discover or report the APK rebuild requirement only after the
  backend change has already been made.

## Commands

Backlog:

```bash
backlog task list
backlog board
backlog task TASK-N --plain
backlog task edit TASK-N --status "In Progress"
backlog sequence list --plain
backlog doc view doc-1
backlog doc view doc-2
backlog decision
```

Frontend:

```bash
cd frontend
pnpm lint
pnpm build:prod
pnpm dev
```

Backend local syntax check:

```bash
python3 -m py_compile backend/src/backend_fastapi.py
```

Backend unit tests (using the repository virtual environment):

```bash
backend/.venv/bin/python -m unittest backend.tests.test_analytics_models
```

Backend local server, when dependencies and environment are configured:

```bash
cd backend
uvicorn src.backend_fastapi:app --reload
```

Terraform validation must be run from the relevant Terraform directory. Never
run `terraform apply` without explicit approval.

## Definition of done

A change is done only when:

- behavior matches the tracked backlog task and user request;
- failure and retry paths are safe;
- Italian and English implications were considered;
- analytics and privacy implications were considered;
- relevant tests/checks pass;
- no secret or unrelated change is included;
- operational cost impact is understood;
- **a new or changed backend endpoint meant for a client to call has at least
  one real caller in the frontend (web or Android), confirmed either in this
  change or already present** — backend-only tests (idempotency, auth,
  validation) prove the endpoint behaves correctly in isolation, not that
  anything actually invokes it. (Root cause of TASK-138, 2026-08-04: TASK-13
  shipped and closed `POST /users/claim-anonymous-data` with backend tests
  only; no frontend code ever called it, on web or Android, for days, and
  nothing in the pre/post-task protocol at the time would have caught that.)
  When auditing an existing task before building on top of it, grep for an
  actual caller instead of trusting a `Done` status or a "looks complete"
  code read.
