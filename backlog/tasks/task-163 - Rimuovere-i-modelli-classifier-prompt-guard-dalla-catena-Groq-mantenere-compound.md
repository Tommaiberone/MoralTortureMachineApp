---
id: TASK-163
title: >-
  Rimuovere i modelli classifier prompt-guard dalla catena Groq, mantenere
  compound
status: Done
assignee: []
created_date: '2026-08-05 13:14'
updated_date: '2026-08-05 13:14'
labels:
  - backend
  - ai
  - maintenance
dependencies: []
priority: low
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up di TASK-162, richiesta esplicita dell'utente 2026-08-05: tolti meta-llama/llama-prompt-guard-2-86m e meta-llama/llama-prompt-guard-2-22m da MODEL_FALLBACK_CHAIN (backend_fastapi.py) - erano classificatori (max 512 token, rilevamento prompt injection), non modelli di chat generici, quindi difficilmente avrebbero mai prodotto un completamento utilizzabile. groq/compound e groq/compound-mini mantenuti come richiesto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 meta-llama/llama-prompt-guard-2-86m e -22m non sono piu' in MODEL_FALLBACK_CHAIN
- [x] #2 groq/compound e groq/compound-mini restano in catena
- [x] #3 py_compile pulito e suite backend passa
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: implementato immediatamente su richiesta esplicita dell'utente. MODEL_FALLBACK_CHAIN ora a 7 modelli: llama-3.3-70b-versatile, openai/gpt-oss-120b, qwen/qwen3.6-27b, llama-3.1-8b-instant, openai/gpt-oss-20b, groq/compound, groq/compound-mini. py_compile pulito, suite backend 144/144 passano.
<!-- SECTION:NOTES:END -->
