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

## Data and scoring rules

- Archetypes and compatibility are deterministic, testable, symmetric where
  applicable, and versioned.
- AI can enrich presentation but cannot determine scores or core outcomes.
- Generated AI output is persisted and reused; every core flow has a
  deterministic fallback when Groq is unavailable.
- Profiles are private/unlisted by default. Public APIs never expose emails,
  answer details, private IDs, tokens, or other private attributes.
- Ephemeral records use TTL. Current DynamoDB tables remain on-demand only while
  `TASK-88` evaluates a safe migration; new tables must first use DynamoDB
  Standard provisioned capacity within the shared Free Tier when the measured
  workload makes that configuration technically adequate.

## Analytics contract

- Client analytics is buffered, batched, idempotent, non-blocking, and unable to
  break gameplay.
- Event names use `snake_case`; schemas are versioned; `event_id` is the
  idempotency key.
- Never collect raw email, auth tokens, IP addresses, full dilemma response
  text, or AI analysis in client event properties.
- Shared fields include anonymous and session identity, occurrence time,
  platform, app version, locale, device-declared IANA-style timezone, referrer,
  UTMs, and experiment assignment. Timezone is never inferred from an IP and is
  presented as `unknown` for historical rows.
- `/admin/analytics` consumes privacy-safe aggregates from
  `/admin/analytics/overview` and intentionally has a separate, Notion-like
  operational visual language from the public horror-themed product.
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
- Use ordinary HTTP for asynchronous duels; WebSockets are reserved for active
  Party Rooms and must be closed when idle.
- Generate social cards client-side or from cached deterministic templates.
- Avoid SMS. Use FCM only after an explicit opt-in value moment.
- Reassess Cognito at 8,000 MAU and before exceeding the 10,000 MAU free tier.
- Every new variable-cost service needs an owner, budget alarm, and fallback.
- The first abuse-protection layer is an in-memory sliding-window guard in each
  warm Lambda container: 120 total requests/minute, 12 AI requests/minute, and
  30 analytics batches/minute per transient network source by default. It adds
  no AWS service, is configurable through Terraform, and is deliberately
  best-effort rather than a globally consistent distributed limit.
- API Gateway access logs record the request path for diagnosis and do not store
  the raw source IP. Stronger distributed enforcement or AWS WAF requires a new
  cost/Free Tier review and explicit approval.

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
| DynamoDB PITR | Enabled on dilemmas, user analytics, and story flows | Conflict: PITR is charged by table size and has no service Free Tier; tracked by `TASK-89` |
| SSM Parameter Store | Two Standard SecureString parameters | Aligned; Standard tier has no additional Parameter Store charge at standard throughput |
| CloudWatch Logs | Two groups, seven-day retention, about 3.5 MB stored; July cost USD 0 | Aligned at current usage; keep ingestion, queries, metrics, and alarms within their allowances |
| S3 and CloudFront | About 1.45 MB frontend assets, 86,962 July CloudFront requests, and about 0.62 GB transfer; July cost effectively USD 0 | Aligned at current usage, but recheck plan/allowance before traffic campaigns |
| Cognito for this product | Essentials is declared in Terraform but the project user pool is not deployed | Planned configuration is aligned for direct/social sign-in up to the current 10,000 MAU allowance; no SMS, M2M, Plus, or paid add-ons |
| Party Room realtime | Not provisioned | Risk in backlog: API Gateway WebSocket Free Tier is introductory; `TASK-91` gates the architecture choice |

## Repository workflow

Task state, priority, dependencies, acceptance criteria, open questions, and
future work are maintained with the Backlog.md CLI. `ROADMAP_SOCIAL_GROWTH.md`
is a migration pointer only and must not be used as a second mutable task list.
