---
id: TASK-101
title: 'Nascondere temporaneamente la modalita italiana, sito solo in inglese'
status: Done
assignee: []
created_date: '2026-07-31 12:59'
updated_date: '2026-07-31 13:02'
labels:
  - frontend
  - i18n
  - growth
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il selettore lingua e il rilevamento automatico IT devono essere disattivati: il sito deve presentarsi solo in inglese finche' non viene deciso diversamente. Non cancellare i contenuti/traduzioni italiani esistenti (frontend/public/locales/it.json, dilemmi IT, story flows IT): la modifica deve restare facilmente reversibile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 LanguageSelector non e' visibile e/o la lingua e' forzata a inglese indipendentemente da browser/localStorage
- [x] #2 i18next non seleziona piu' automaticamente l'italiano (fallbackLng/detection aggiornati)
- [x] #3 Il cambiamento e' reversibile: nessun file di traduzione o contenuto IT viene eliminato
- [x] #4 Decisione esplicita presa sulle landing SEO bilingui /it/test-dilemmi-morali, /it/dilemmi-etici, /it/gioco-dilemmi-morali (ADR-020, esperimento di acquisizione gia' indicizzato): restano visibili o vengono nascoste anch'esse
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisione utente: solo l'app in inglese, le 3 landing SEO bilingui /it/... restano intatte (esperimento ADR-020 gia' indicizzato). Implementato: LanguageSelector rimosso da HomeScreen (componente non eliminato, solo non piu' importato/usato); frontend/src/i18n.js forza lng:'en' e supportedLngs:['en'], rimosso il plugin LanguageDetector e il blocco detection (commentato inline per il ripristino futuro); nessun file di traduzione o contenuto IT cancellato. Fix importante: SeoLandingScreen.jsx chiamava i18n.changeLanguage(locale) su ogni visita a una landing IT SOLO per side-effect (non usa mai t()/i18n per il proprio rendering, tutto il contenuto viene da seoLandings.js con ternari locale-based) - questo avrebbe fatto 'trapelare' l'italiano nell'app (e nel cookie cache) dopo la visita a /it/test-dilemmi-morali etc. Rimossa la chiamata: le landing IT restano visivamente in italiano (contenuto locale-driven, non i18next-driven) senza piu' influenzare lo stato globale della lingua. pnpm lint e build:prod puliti.
<!-- SECTION:NOTES:END -->
