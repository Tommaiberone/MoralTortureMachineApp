---
id: TASK-119
title: Valutare MFA opzionale per il gruppo admins di Cognito
status: Done
assignee: []
created_date: '2026-08-01 14:45'
updated_date: '2026-08-05 18:55'
labels:
  - security
  - backend
  - cost
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backend/terraform/main.tf ha mfa_configuration = OFF sull'unico User Pool Cognito, condiviso da utenti normali e dal gruppo admins che accede alla dashboard /admin/analytics. Per gli utenti normali MFA e' probabilmente eccessivo per un gioco di comparazione morale a basso rischio, ma per gli account nel gruppo admins (che vedono aggregati privacy-safe ma pur sempre dati operativi) varrebbe la pena valutare mfa_configuration = OPTIONAL con enforcement applicativo per il gruppo admins, oppure lasciarlo cosi' se il numero di admin e' 1 (l'owner) e il rischio e' accettato. Verificare prima le implicazioni di costo/Free Tier di Cognito MFA (SMS va evitato per costo per policy CLAUDE.md; TOTP/software token e' incluso senza costo aggiuntivo nel tier Essentials) prima di implementare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 E' stata presa e documentata in un ADR una decisione esplicita (abilitare MFA opzionale solo TOTP per admins, o accettare esplicitamente il rischio con MFA off)
<!-- AC:END -->
