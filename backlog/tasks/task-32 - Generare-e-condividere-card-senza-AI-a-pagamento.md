---
id: TASK-32
title: Generare e condividere card senza AI a pagamento
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-01 14:39'
labels:
  - m3-profiles
  - frontend
  - android
  - sharing
  - cost
dependencies:
  - TASK-29
  - TASK-31
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generazione client o template cache con native share, Web Share, download, copia link e fallback WhatsApp.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Web e Android hanno fallback funzionanti
- [x] #2 La generazione non usa image AI a pagamento
- [x] #3 Share completion è strumentato
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
WhatsApp/Facebook/copy-link erano gia' funzionanti su web e Android (window.open/clipboard, tutti gia' strumentati con trackEvent share_clicked). Il gap era la card immagine: downloadShareCard() usa <a download> con un data URL, che nella WebView Android di Capacitor spesso non salva nulla (nessun handler Downloads di default) - un tap silenziosamente inefficace, in contrasto con l'AC 'Android ha fallback funzionanti'. Aggiunta frontend/src/utils/shareCard.js:shareOrDownloadCard(), che prova prima navigator.share({files}) (Web Share API livello 2, supportata dal motore Chrome della WebView senza aggiungere alcun plugin Capacitor ne' richiedere un rebuild Android) per aprire il foglio di condivisione nativo con l'immagine PNG generata; solo se non disponibile (per lo piu' browser desktop) ricade sul download esistente. Annullamento utente (AbortError) non ricade sul download. ResultsScreen.jsx aggiorna entrambi i bottoni download-card per usare la nuova funzione e registra il metodo usato (native_share / native_share_cancelled / download) nell'evento share_card_downloaded esistente, per capire quale canale funziona davvero su Android.
<!-- SECTION:FINAL_SUMMARY:END -->
