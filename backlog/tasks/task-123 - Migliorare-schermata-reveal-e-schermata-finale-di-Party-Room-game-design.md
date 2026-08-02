---
id: TASK-123
title: Migliorare schermata reveal e schermata finale di Party Room (game design)
status: Done
assignee: []
created_date: '2026-08-02 10:35'
updated_date: '2026-08-02 14:22'
labels:
  - frontend
  - backend
  - ux
  - party-room
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Brainstorm di game design fatto con l'utente il 2026-08-02, da lavorare più avanti - non implementare senza prima riconfermare le priorità.

REVEAL INTER-ROUND (oggi solo titolo + barra aggregata first/second):
1. [quasi-bug] Il testo del dilemma sparisce durante il reveal - va tenuto visibile, altrimenti si perde il contesto di cosa si stava votando.
2. Mostrare CHI ha votato cosa (nome/avatar per scelta), non solo un conteggio anonimo - è gente nella stessa stanza, il dato individuale è più divertente e i dati esistono già lato server.
3. Testo reattivo allo split del voto (es. quasi unanime -> 'la mente alveare concorda'; spaccato -> 'una stanza divisa'), eventualmente un badge live 'il più diviso finora' (il calcolo most-controversial esiste già server-side).
4. Richiamare quale dimensione morale (Empatia, Integrità, ...) il dilemma stava misurando.
NON VOLUTO esplicitamente dall'utente: nessun countdown/suspense (3-2-1) prima di rivelare il risultato.

DA RIVALUTARE PRIMA DI TOCCARE IL CODICE - il timer del round stesso:
L'utente non è convinto nemmeno del limite di tempo per rispondere (PARTY_ROOM_ROUND_DURATION_MS, 20s oggi): il gioco è pensato per discuterne insieme, non per correre contro un timer. Prima di implementare qualunque altra cosa sul reveal, va deciso se: rimuovere il timer fisso, renderlo molto più permissivo, o sostituirlo con un avanzamento 'quando tutti sono pronti' invece che a tempo. Questa è una decisione di design da prendere esplicitamente con l'utente, non un default tecnico.

SCHERMATA FINALE (oggi: lista piatta archetipi + 3 premi + condividi):
5. Sequenziare invece di mostrare tutto insieme: prima gli archetipi di ciascuno, poi build-up verso i premi uno alla volta.
6. Più categorie di premio/superlativi, es. 'Il preferito della macchina' (chi è più vicino alla media del gruppo, opposto della minoranza morale) e 'Il Contrarian' (chi ha scelto l'opzione di minoranza più spesso nei vari round). Nota: alcuni premi immaginabili (es. 'dito più veloce') richiederebbero dati non ancora salvati (timestamp del voto) - da valutare caso per caso, non tutti sono gratis con i dati attuali.
7. Colorare la lista finale con il colore visivo di ciascun archetipo (già presente nei dati) per leggere a colpo d'occhio lo spettro morale del gruppo.
8. Aggiungere un bottone 'Rigioca' con lo stesso gruppo - oggi l'unica azione finale è tornare alla home, il che disperde l'energia del gruppo appena formato.
9. Un verdetto di gruppo generato dall'AI (una riga di sintesi sul gruppo), riusando lo stesso pattern già usato per il verdetto AI del test solista (TASK-121) - arricchisce la presentazione senza toccare il punteggio, coerente con le regole di prodotto (l'AI non decide mai i punteggi).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il testo del dilemma resta visibile durante il reveal
- [x] #2 Il reveal mostra chi ha votato cosa, non solo un conteggio aggregato
- [x] #3 Il reveal ha un testo reattivo allo split del voto, senza alcun countdown/suspense prima di mostrare il risultato
- [x] #4 E' stata presa una decisione esplicita con l'utente sul timer del round (rimuovere/allungare/sostituire con avanzamento a consenso) prima di implementare il resto
- [x] #5 La schermata finale sequenzia archetipi e premi invece di mostrarli tutti insieme
- [x] #6 Sono aggiunte almeno due nuove categorie di premio oltre alle tre esistenti, solo se calcolabili dai dati già salvati
- [x] #7 La lista finale usa il colore visivo di ogni archetipo
- [x] #8 Esiste un bottone Rigioca con lo stesso gruppo, alternativo al solo ritorno alla home
- [x] #9 Esiste un verdetto di gruppo generato dall'AI, con fallback se Groq non e' disponibile
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decisione presa con l'utente (AC4): niente timer visibile. Il voto non ha scadenza (si avanza solo quando tutti hanno votato), il reveal avanza solo su azione esplicita dell'host (nuovo POST /party-rooms/{code}/advance, host-only, solo in fase reveal). PARTY_ROOM_SAFETY_TIMEOUT_MS (10 min) resta solo come rete di sicurezza per una room abbandonata, mai mostrato come countdown.

Reveal: il testo del dilemma resta visibile (AC1); nuovo campo roundVotes espone chi ha votato cosa per nome, mai l'ID interno (AC2); testo reattivo allo split (unanime/diviso/maggioranza) piu' badge 'il piu' diviso finora' calcolato lato client su uno storico di sessione, piu' richiamo della dimensione morale dominante del dilemma - nessun countdown (AC3).

Schermata finale: sequenziata a stadi (archetipi -> verdetto AI -> un premio alla volta -> azioni) invece di tutto insieme (AC5); due nuovi premi calcolati in backend/src/party_awards.py - 'il preferito della macchina' (opposto della minoranza morale, richiede 3+ partecipanti) e 'il contrarian' (chi ha scelto piu' spesso l'opzione di minoranza) (AC6); lista finale colorata col colore visivo di ogni archetipo (AC7); bottone Rigioca che crea una nuova room con lo stesso nome e ci naviga subito, dato che senza account non esiste un modo di re-invitare automaticamente lo stesso gruppo (AC8); verdetto di gruppo generato da Groq una sola volta e cachato sulla room (mai rigenerato), con fallback deterministico sempre disponibile se Groq non risponde (AC9).

Card di condivisione (shareCard.js) aggiornata con i due nuovi premi, canvas allargato per non affollare il layout. 121 test backend verdi (18 nuovi/aggiornati per Party Room, 6 nuovi per i premi), pnpm lint e build:prod puliti. Nessuna modifica Terraform (nessuna nuova risorsa AWS).
<!-- SECTION:FINAL_SUMMARY:END -->
