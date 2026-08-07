---
id: TASK-172
title: Add 'Ask the Audience' share CTA to every dilemma (dark/sarcastic copy)
status: Done
assignee: []
created_date: '2026-08-07 10:10'
updated_date: '2026-08-07 11:09'
labels: []
dependencies: []
references:
  - backlog/docs/doc-2 - Social Growth Strategy.md
  - frontend/src/screens/EvaluationDilemmasScreen.jsx
  - frontend/src/screens/ResultsScreen.jsx
priority: high
type: feature
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Per-dilemma growth CTA aimed at the result-to-share gate in doc-2, which the 2026-08-07 analytics read showed at 4.1% vs the 15% target (funnel: test_completed/result_viewed 541 -> shared 22). TASK-149/156/166 only touch the Results screen (one share prompt at the very end); this adds a lighter, repeated prompt during the test itself, in EvaluationDilemmasScreen.

Technical constraint checked before scoping: the full Duel/Challenge flow (ResultsScreen.handleChallengeAFriend, POST /profiles then POST /challenges) needs the complete answer set to score an archetype, so it cannot be reused mid-test. V1 here is therefore a plain native share (Web Share API with clipboard fallback, same pattern as existing share utilities), not a full Duel comparison. A version that deep-links the friend straight into that specific dilemma, or that only surfaces on closely-split (near 50/50 yes/no) dilemmas using the existing vote counts, is a natural v2 and is intentionally left out of this task's scope.

Copy (finalized with the user, MTM dark/sarcastic voice, English only per TASK-101):
- Button: [ SPREAD THE GUILT ]
- Microcopy: Misery, as always, prefers company.
- Share text: I made a choice I'm not proud of. Now it's your turn to feel bad too.

Flow scope, decided 2026-08-07:
- Single-player Evaluation (EvaluationDilemmasScreen.jsx): IN SCOPE. This is the only flow where a lone user is actually facing a dilemma without an audience already present, which is the premise the copy relies on.
- Party Room (PartyRoomScreen.jsx): OUT OF SCOPE. The audience is already in the room answering the same dilemma live; growing the room already has its own dedicated mechanism (room code/QR, shareHint: Share this code or QR to invite others). A second, per-dilemma outbound share here would duplicate that and doesn't fit the not-alone premise.
- Pass-the-Phone (PassThePhoneScreen.jsx, part of Infinite/Story mode): OUT OF SCOPE. TASK-161 (Open Points, unresolved) is a live strategic question about whether this mode gets any bridge into the challenge/retention loop at all. Adding a growth CTA here now would preempt that decision instead of waiting for it.

Scope is therefore EvaluationDilemmasScreen.jsx only. Revisit Party Room/Pass-the-Phone inclusion only after TASK-161 is resolved and/or this V1 shows a measurable lift.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CTA button reading exactly [ SPREAD THE GUILT ] with microcopy "Misery, as always, prefers company." appears on every dilemma in EvaluationDilemmasScreen, not just the first/last
- [x] #2 Tapping it triggers navigator.share with the finalized share text and app link, falling back to clipboard copy when Web Share API is unavailable, consistent with the existing share utility pattern
- [x] #3 No POST /profiles or POST /challenges call is made by this CTA; it does not require a completed archetype/profile
- [x] #4 A new snake_case, versioned analytics event fires on click (distinct from the existing share_clicked used on Results), carrying dilemma_id, question_number, and the platform dimension
- [x] #5 en.json only (no it.json changes) per the TASK-101 English-only app exception
- [x] #6 pnpm lint and pnpm build:prod pass; manual verification in the browser is left to the user per CLAUDE.md's no-Playwright rule
<!-- AC:END -->
