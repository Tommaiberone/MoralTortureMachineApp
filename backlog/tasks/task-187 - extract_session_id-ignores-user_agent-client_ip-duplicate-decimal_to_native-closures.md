---
id: TASK-187
title: >-
  extract_session_id ignores user_agent/client_ip; duplicate decimal_to_native
  closures
status: Done
assignee: []
created_date: '2026-08-10 10:26'
updated_date: '2026-08-10 13:41'
labels:
  - backend
  - cleanup
dependencies: []
priority: low
type: chore
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backend_fastapi.py:915-931 extract_session_id reads user_agent (927) and client_ip (928) into local variables but never uses them (confirmed by pyflakes) - it always falls back to a fresh random UUID, called from 7 sites, so every session derived this way is non-deterministic despite the header lookups actually being fetched. Separately, get_story_flow (~4125-4134) and story_node_vote (~4208-4216) each locally redefine a decimal_to_float closure duplicating the module-level decimal_to_native (line 1222) instead of reusing it. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 extract_session_id either uses user_agent/client_ip for a real purpose or the dead reads are removed
- [x] #2 get_story_flow and story_node_vote reuse decimal_to_native instead of a local duplicate
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
extract_session_id semplificata: rimossa la lettura morta di user_agent/client_ip, resta solo header X-Session-Id con fallback a un UUID random. I duplicati di decimal_to_float erano solo in get_story_flow/story_node_vote, gia' rimossi con TASK-185 - nessun'altra duplicazione trovata nel file.
<!-- SECTION:NOTES:END -->
