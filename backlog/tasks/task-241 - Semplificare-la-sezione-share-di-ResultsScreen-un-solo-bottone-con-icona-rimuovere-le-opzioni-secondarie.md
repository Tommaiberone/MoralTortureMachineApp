---
id: TASK-241
title: >-
  Semplificare la sezione share di ResultsScreen: un solo bottone con icona,
  rimuovere le opzioni secondarie
status: Done
assignee: []
created_date: '2026-09-04 13:43'
updated_date: '2026-09-04 13:45'
labels:
  - frontend
  - sharing
dependencies: []
priority: medium
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Richiesta esplicita dell'utente: la schermata finale dei risultati (ResultsScreen) aveva troppi tasti nella sezione share - il bottone primario 'Share your verdict' piu' una sotto-sezione 'or share another way' con WhatsApp/Facebook/Download card (Square) (aggiunta 3 giorni fa da TASK-156 come opzioni secondarie deliberatamente non rimosse). L'utente ora chiede di rimuovere del tutto le tre opzioni secondarie e aggiungere un'icona di share prima del testo del bottone primario, per ridurre l'affollamento visivo. Nota: questo restringe la portata di TASK-156/AC2 (che le manteneva esplicitamente); la richiesta diretta dell'utente prevale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rimossa interamente la sezione 'or share another way' (label + bottoni WhatsApp/Facebook/Download card Square) da ResultsScreen.jsx
- [x] #2 Il bottone primario 'Share your verdict' mostra un'icona di share (SVG inline coerente con lo stile gia' usato altrove nell'app) prima del testo
- [x] #3 Nessuna chiave i18n, variabile o regola CSS orfana lasciata nel codice dopo la rimozione
- [x] #4 Il bottone WhatsApp/card-download della sezione separata 'Challenge a friend' (stessa pagina, altra funzione) resta intatto e funzionante
- [x] #5 pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rimossi label 'or share another way' + bottoni WhatsApp/Facebook/Download card (Square) da ResultsScreen.jsx. Aggiunta icona share SVG (stessa convenzione di HomeScreen.jsx: viewBox 24x24, fill=currentColor, aria-hidden) prima del testo del bottone primario 'Share your verdict'. Puliti: CSS orfano (.facebook, --secondary), variabile archetypeShareLine, 6 chiavi en.json orfane (share_challenge, facebook_share_alert, download_card_stories - gia' orfana prima -, download_card_square, share_more_ways, facebook); mantenuti .whatsapp/.card-download/results-share-button(s) base e la chiave whatsapp, ancora usati dalla riga di share separata 'Challenge a friend' piu' sotto nella stessa schermata. pnpm lint e pnpm build:prod passano. Nessun controllo browser live eseguito (regola no-Playwright di CLAUDE.md) - l'allineamento visivo dell'icona accanto al testo va verificato a occhio dall'utente. ADR-114 in decision-1.
<!-- SECTION:NOTES:END -->
