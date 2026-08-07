---
id: TASK-168
title: >-
  pnpm-workspace.yaml allowBuilds.esbuild e' un placeholder mai completato,
  blocca pnpm install/build
status: Done
assignee: []
created_date: '2026-08-05 18:47'
updated_date: '2026-08-07 13:27'
labels:
  - technical-debt
  - tooling
  - frontend
dependencies: []
priority: low
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
frontend/pnpm-workspace.yaml riga 4-5 ha 'allowBuilds: esbuild: set this to true or false' - un valore placeholder letterale mai sostituito con true/false. Questo fa fallire qualunque 'pnpm install'/'pnpm run <script>' con [ERR_PNPM_IGNORED_BUILDS], perche' pnpm (v11.12.0 in questo ambiente) non riconosce il valore come booleano valido e blocca lo script di postinstall di esbuild. Scoperto durante la routine serale 2026-08-05 mentre si eseguiva 'pnpm build:prod' per TASK-115/116/117/118: e' stato necessario usare 'npx vite build --mode prod' come workaround per bypassare il wrapper 'pnpm run'. Decidere esplicitamente true (permettere lo script postinstall di esbuild, che scarica il binario nativo della piattaforma) o false (bloccarlo, verificando che esbuild funzioni comunque con un binario gia' presente o un fallback), poi impostare il valore booleano reale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il placeholder 'set this to true or false' e' sostituito con un valore booleano reale (true o false), con la scelta motivata
- [x] #2 pnpm install e pnpm build:prod/pnpm lint funzionano senza il workaround npx
<!-- AC:END -->
