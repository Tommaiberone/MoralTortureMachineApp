---
id: TASK-209
title: 'Party Room finale: pass cinematografico sul sequencing (stories-style)'
status: Done
assignee: []
created_date: '2026-08-31 10:03'
updated_date: '2026-09-04 09:26'
labels:
  - frontend
  - party-room
  - ux
dependencies:
  - TASK-123
  - TASK-205
priority: medium
type: enhancement
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dalla proposta 1 dello spike TASK-205 (vedi artifact linkato nelle note di TASK-205): trasformare l'attuale sequenza a stadi statica della schermata finale di Party Room (archetipi -> verdetto AI -> premi uno alla volta -> azioni, gia' shippata da TASK-123) in un flow piu' cinematografico stile 'stories': slide full-bleed con transizione tra uno stadio e l'altro, barra di progresso segmentata in alto (uno spicchio per stadio, riempito fino allo stadio corrente). Nessun dato nuovo: si riordina/reskinna lo stesso array di stadi/awardCards gia' costruito in PartyRoomScreen.jsx per lo status 'completed'. Vincolo esplicito ereditato da TASK-123: SOLO avanzamento a tap (tap destro=avanti, tap sinistro=indietro), nessun timer/auto-advance - l'utente ha gia' rifiutato esplicitamente countdown/suspense in TASK-123.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La schermata finale mostra transizioni tra stadi invece di uno swap istantaneo
- [x] #2 Una barra di progresso segmentata in alto riflette lo stadio corrente
- [x] #3 Avanzamento solo tramite tap/click esplicito, nessun timer o auto-advance
- [x] #4 Nessuna modifica ai dati/awardCards esistenti, solo presentazione
- [x] #5 pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PartyRoomScreen.jsx (completed status only): replaced the static stage swap + bottom Continue button with a stories-style flow - a segmented progress bar (.party-stories-progress/.party-stories-segment) above the slide, one filled segment per stage up to revealStage; the slide content wrapped in a keyed div (key={stage}) so React remounts it on stage change, triggering a CSS slide-in animation (.party-stories-slide-forward/-backward, direction picked by which side was tapped); advancement via handleStoriesTap on the slide wrapper - clientX vs the wrapper's bounding rect decides right(forward)/left(back), guarded with event.target.closest('button, a, input, label') so the actions stage's real Rematch/Share/Home controls are untouched. No timer, no auto-advance (TASK-123 constraint preserved). Removed the now-dead party.continueButton and unused party.groupArchetypeTitle i18n keys, added party.storiesTapHint. Same stages/awardCards data as before - presentation only. pnpm lint and pnpm build:prod both pass; no automated frontend test runner exists for this repo (backend-only per CLAUDE.md commands) so this was verified via lint/build/code review only, not a live browser check.

Follow-up (2026-09-04, same session): user reviewed live and asked for two corrections - replaced the tap-zone swipe navigation with classic Back/Next buttons at the bottom (.party-stories-nav, reusing .button-row), and pinned the recap heading to the top of the screen (.party-recap-sticky-title, position:sticky) while renaming it from party.completedTitle="[ EVERYONE'S ARCHETYPE ]" to "[ THE MACHINE'S VERDICT ]". Progress bar and slide transitions unchanged. See ADR-110. pnpm lint/build:prod re-verified green.

App version bump (2026-09-04): 1.10.0/versionCode 29 -> 1.11.0/versionCode 30. Covers the whole unreleased packaged-frontend change set since 1.10.0 - this task, TASK-210, TASK-211, and this session's Back/Next-buttons + sticky-title follow-up (ADR-110) - none of which had been bumped yet (an oversight caught only now, while making the follow-up correction). Minor bump per semver (new features, no breaking client/API changes). versionCode raise requires explicit user confirmation before push per CLAUDE.md/ADR-017 (auto-publishes to Play Store) - not pushed yet as of this note.
<!-- SECTION:NOTES:END -->
