---
id: TASK-224
title: >-
  ops-alerts-sweep.md e routine-serale.md usano il profilo AWS root 'personal'
  invece di un ruolo scoped
status: Backlog
assignee: []
created_date: '2026-09-01 12:45'
updated_date: '2026-09-01 12:46'
labels:
  - security
  - iam
  - automation
dependencies: []
priority: low
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato leggendo .claude/commands/ mentre si progettava la nuova skill analytics-optimize: ops-alerts-sweep.md usa 'aws --profile personal dynamodb scan/delete-item' su ops_error_alerts, e routine-serale.md usa 'aws --profile personal sns publish'. Verificato in questa sessione (TASK-166) che il profilo AWS CLI 'personal' e' una credenziale IAM root (aws sts get-caller-identity restituisce arn:aws:iam::586250839220:root), non un ruolo scoped - lo stesso problema gia' segnalato in ADR-092. CLAUDE.md vieta l'uso di credenziali root per automazione di routine; queste due skill lo fanno regolarmente (ops-alerts-sweep e' invocabile a mano, routine-serale gira come routine autonoma). La nuova skill analytics-optimize (TASK-223) usa invece il profilo scoped read-only mtm-analytics-readonly creato in TASK-166, a dimostrazione che l'alternativa e' praticabile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Creato un ruolo/utente IAM scoped per gli scope reali necessari (dynamodb:Scan/DeleteItem su ops_error_alerts per ops-alerts-sweep; sns:Publish sul topic ops_alerts per routine-serale), non un riuso della policy read-only di mtm-analytics-readonly che non basta a questi due casi
- [ ] #2 ops-alerts-sweep.md e routine-serale.md aggiornati per usare i nuovi profili scoped invece di --profile personal
<!-- AC:END -->
