---
id: TASK-177.1
title: Allineare /account al tema horror dell'app e consolidare login/logout
status: Done
assignee: []
created_date: '2026-08-10 09:33'
updated_date: '2026-08-10 10:02'
labels:
  - frontend
  - ux
dependencies: []
parent_task_id: TASK-177
priority: medium
type: enhancement
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nessuna dipendenza dagli altri sotto-task: AccountDeleteScreen.jsx usa oggi .legal-screen (palette beige #161616/#f5f1e8/#938c7d/#d6b979, presa dalle pagine legali) invece del tema horror scuro del resto dell'app (--creepy-* in frontend/src/styles/horrorTheme.css, vedi ResultsScreen/.results-archetype per il pattern di riferimento). Rinominare concettualmente la pagina 'My Profile' (titolo, non necessariamente il nome del file/componente). Aggiungere anche il bottone di logout oggi assente su /account (TASK-155: solo login o export/delete, mai logout, unico punto di ingresso duplicato con AuthButton). Vedi mockup completo (sezione identita' in alto): https://claude.ai/code/artifact/32590b56-c0ab-482e-9632-7b4afd21ea82
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La pagina /account usa i token colore/tipografia del tema horror (--creepy-*), non piu' .legal-screen
- [x] #2 Un utente autenticato vede un bottone di logout funzionante direttamente su /account
- [x] #3 Login, export dati, elimina account, link Privacy/Cookie continuano a funzionare invariati (TASK-15/120 AC4)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rebuilt AccountDeleteScreen.jsx/.css on the app's own --creepy-* horror theme tokens (was .legal-screen's borrowed beige/tan palette). Added a working logout button (auth.logout()) directly on /account, fixing TASK-155's gap - login/export/delete/Privacy/Cookie links all preserved and re-tested. pnpm lint + build:prod clean. NOT YET PUSHED - bundled in the same file/commit as TASK-177.5, which depends on TASK-177.4's not-yet-applied Terraform GSI (see TASK-177 notes).
<!-- SECTION:NOTES:END -->
