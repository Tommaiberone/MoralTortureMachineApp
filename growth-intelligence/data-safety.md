# Google Play Data Safety source of truth

**Prepared:** 2026-08-06
**Applies to:** Android 1.6.4 (`versionCode` 19) and the matching web service
**Status:** Ready for owner review; **not yet submitted in Google Play Console**.

This is the repository source for the Play Data Safety declaration. It is not a
claim that the Play Console is already updated. Before the next Android
production release, the account owner must transcribe and verify the current
form in Play Console. Google's current definitions and service-provider
exceptions control the final selections.

## Product boundary

Moral Torture Machine is an interactive ethical-dilemma game. Its result,
archetype, social comparison, and AI-written commentary are entertainment and
reflection features, not a psychological or medical assessment.

The Android app does **not** load Google Analytics. It does send first-party
product analytics to the same AWS backend as the web app. Google Analytics is
web-only, opt-in, and covered here solely because the public Privacy notice
describes the whole product.

## Data inventory for the Play form

| Play data type to review | What the app actually handles | Purpose | Retention / deletion | Recipients / disclosure notes |
| --- | --- | --- | --- | --- |
| Personal info: name | Google profile name in the encrypted Android sign-in session and Cognito identity attributes when a user chooses Google sign-in. | Account functionality. | Removed with Cognito account deletion; local session removed on sign-out/deletion. | AWS Cognito and Google sign-in. Declare according to Play's current identity-provider/service-provider definitions. |
| Personal info: email address | Google/Cognito email for a signed-in account; app `users` record retains email. | Account functionality, account support, security. | Account deletion removes Cognito and app record; inactive account is swept after 12 months. | AWS Cognito and Google sign-in. |
| Personal info: user IDs | Cognito subject/username for authenticated accounts. | Account functionality and secure account lifecycle. | Same as account data. | AWS Cognito. |
| Device or other IDs | Persistent anonymous user ID and installation ID; session ID is per browser/WebView session. | Anonymous gameplay continuity, fraud/security controls, product analytics. | Server-side raw product events expire after 90 days; the updated client clears IDs and local queue after account deletion. | AWS backend. Do not describe these as advertising IDs. |
| App activity: app interactions / other actions | Game starts, selected modes, result/share flow events, platform/version/language/time zone, referrer **origin** and filtered campaign parameters. | Product functionality, aggregate measurement, reliability and abuse protection. | Raw first-party events: 90 days. | AWS backend. Analytics properties reject email, tokens, unlisted profile IDs, room codes, link paths, dilemma text, answer text, and AI analysis. |
| App activity: gameplay choices and derived result | Dilemma selections needed for the game; derived dimensions, archetype, profile, Moral Duel participation, Party Room votes/results, Party display name. | Core game functionality and an explicitly chosen social-comparison flow. | Profiles/accounts: 12 months after inactivity; Duels: 30 days; Party Rooms: 6 hours. Account deletion cascades through linked social data. | AWS backend; invited recipients can see the result/comparison that the chosen unlisted link or room exposes. |
| Diagnostics | Privacy-redacted route signatures, error status/type, and bounded frontend technical error information. | Security, reliability, troubleshooting. | Operational alerts: 30 days; CloudWatch/API diagnostic logs: 7 days. | AWS. Raw request bodies, account data, answers, and link tokens are not intentionally logged. |
| Other data: AI analysis request | Scores, dilemma text/options, and selected choices supplied only when a user requests result analysis. | Generate optional explanatory commentary. | Not intentionally placed in first-party product analytics or an account profile. Groq inference data can be retained for up to 30 days for reliability/abuse monitoring unless Zero Data Retention is enabled. | Groq processes the request to provide the feature. Review and disclose this recipient under the form's current data-sharing/service-provider rules. |

## Required form answers to verify

- Do **not** select "No data collected" or "No data shared" without reviewing
  every row above and Google Play's current definitions.
- State that listed data is encrypted in transit: app/backend, Cognito/Google,
  and Groq calls use HTTPS.
- State that users can request deletion through the in-app **Your account**
  route and `https://moraltorturemachine.com/account`.
- Do not declare location, contacts, photos/videos, files/documents, financial
  information, messages, microphone, camera, or advertising ID collection:
  the app does not request those permissions or collect those categories.
- User-initiated sharing through a system share sheet, a copied unlisted link,
  a Moral Duel, or a Party Room must be described as voluntary. The recipient
  then handles what they receive independently.
- Confirm whether each AWS/Cognito, Google sign-in, and Groq relationship is a
  Play-defined service-provider exception or a reportable sharing recipient at
  the time the form is completed. Do not guess; record the final choice below.

## Manual completion record

Complete this section in the same commit or release note after the owner
updates Play Console:

- Play Console editor and date: **pending**
- Privacy-policy URL verified: **pending** (`https://moraltorturemachine.com/privacy`)
- Data Safety public page verified after review: **pending**
- Final service-provider/sharing selections reviewed against current Play help: **pending**
- Any deviation from this inventory and reason: **pending**

## Related implementation

- Privacy/Cookie/Terms routes: `frontend/src/screens/LegalScreen.jsx`
- Account export/deletion and local cleanup: `backend/src/backend_fastapi.py`,
  `frontend/src/screens/AccountDeleteScreen.jsx`, `frontend/src/utils/session.js`
- First-party analytics minimisation: `frontend/src/utils/analytics.js`,
  `backend/src/backend_fastapi.py`
- Android backup protection: `frontend/android/app/src/main/AndroidManifest.xml`
