---
id: TASK-97.4.2
title: '[regression] Bilanciare il radar per mercato e segnalare intent non idonei'
status: Done
assignee: []
created_date: '2026-07-31 09:08'
updated_date: '2026-07-31 09:10'
labels:
  - growth
  - seo
  - analytics
dependencies: []
parent_task_id: TASK-97.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il primo test live ha mostrato che il taglio globale può nascondere una lingua e che intent adiacenti come psicologia possono sembrare compatibili senza una valutazione esplicita.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il report mostra candidati separati per mercato, senza far scomparire EN o IT per effetto del limite globale.
- [x] #2 Ogni seed/candidato può dichiarare un rischio policy; il report segnala che non va trasformato in contenuto/prodotto senza revisione.
- [x] #3 I test coprono entrambe le regressioni.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Corretto dopo il test live 2026-07-31: il report limita ora le righe per
mercato, non globalmente; i termini configurati per claim psicologici,
score/risposte, attribuzione accademica o minori ricevono `policy review
required` e `product fit: review required`. Verificati dieci test, collector
live con Google Autocomplete 8/8 seed e `git diff --check`.
<!-- SECTION:NOTES:END -->
