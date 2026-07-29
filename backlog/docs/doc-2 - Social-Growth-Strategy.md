---
id: doc-2
title: Social Growth Strategy
type: product
created_date: '2026-07-29 11:22'
---

# Social Growth Strategy

## Product thesis

The product should become a social comparison game rather than a generic social
network. Its promise is: discover how morally compatible you are with friends,
partners, and groups.

The growth loop is:

1. Complete a short set of dilemmas anonymously.
2. Receive a memorable moral archetype.
3. Challenge a specific person through an attributable deep link.
4. The invitee answers the same dilemmas.
5. Both unlock the same comparison.
6. Either participant rematches, shares, or invites another person.

The North Star Metric is **completed challenges with at least two participants
per week**.

## Baseline (1–29 July 2026)

- Approximately 500–800 active monthly sessions.
- 791 sessions fetched at least one dilemma; 585 generated a result.
- Approximate completion proxy: 74%.
- 6,354 dilemma fetches, 6,084 votes, and 851 result analyses.
- 25,582 Lambda invocations at 50 ms average duration, with zero Lambda errors.
- 35,814 CloudFront requests.
- Analytics table: 18,883 items and 6.64 MB.
- AWS billed cost was approximately zero; Groq used its free tier.

This baseline is session-based. True retention and referral attribution require
the identity, profile, challenge, and referral tasks tracked in the backlog.

## Validation gates

| Metric | Initial gate |
|---|---:|
| Short-test completion | at least 60% |
| Result-to-share rate | at least 15% |
| Challenge open-to-complete rate | at least 25% |
| Invitees creating another challenge | tracked and improving each release |
| D7 retention | at least 12–15% before paid acquisition |
| Contextual pack conversion | initial target at least 2% of exposed users |

Do not scale paid acquisition until referral and retention loops are measured.
A subscription is not eligible for launch until the product demonstrates weekly
recurring value and sufficient retention.

## Delivery sequence

1. Foundation: finish event coverage, validate web/Android attribution, budgets,
   alarms, and identity safety.
2. Authentication: deploy Google/Cognito, claim anonymous activity, and add
   account lifecycle support without blocking first play.
3. Activation: shorten the test and ship deterministic bilingual archetypes.
4. Persistent profiles and attributable sharing.
5. Moral Duel data model, APIs, comparison UI, deep links, and rematch loop.
6. Retention through a daily dilemma; then Party Room.
7. One-time paid packs, billing, entitlements, and content operations.
8. Distribution experiments only after measurement gates pass.

## Social MVP definition of done

- A visitor starts without an account and receives a persistent archetype.
- They create a personal challenge link.
- An invitee opens the exact challenge and answers the same dilemmas.
- Both participants unlock the same deterministic comparison.
- Either can share or rematch.
- The entire loop is attributable across supported platforms.
- Refresh, deep links, expiry, replay, and mobile fallback are safe.
- Public URLs expose no private data.
- The experience still works when Groq is unavailable.
