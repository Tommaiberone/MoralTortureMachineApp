---
id: TASK-374
title: >-
  Aggiornare MODEL_FALLBACK_CHAIN: llama/qwen3.6/compound non più disponibili su
  Groq
status: Done
assignee: []
created_date: '2026-10-06 14:31'
updated_date: '2026-10-06 14:31'
labels: []
dependencies: []
priority: medium
ordinal: 275000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Al 2026-10-06 GET /openai/v1/models con la chiave prod non elenca più llama-3.3-70b-versatile, llama-3.1-8b-instant, qwen/qwen3.6-27b, groq/compound e groq/compound-mini (le chat completions restituiscono 404). Ogni chiamata AI faceva un hop fallito prima di arrivare a gpt-oss-120b. Nuova catena: openai/gpt-oss-120b, qwen/qwen3.8-27b, openai/gpt-oss-20b.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La catena contiene solo modelli che rispondono 200 sulla chat completions con la chiave prod
- [x] #2 qwen/qwen3.8-27b restituisce il content senza blocco <think>
- [x] #3 I test backend (test_analyze_results, test_analytics_models) passano
<!-- AC:END -->
