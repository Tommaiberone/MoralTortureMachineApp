---
id: TASK-177
title: >-
  Ripensare la pagina /account come 'My Profile': trofeo risultati + azioni di
  crescita
status: In Progress
assignee: []
created_date: '2026-08-10 09:32'
updated_date: '2026-08-10 09:38'
labels:
  - frontend
  - ux
  - growth
  - profile
dependencies: []
priority: medium
type: enhancement
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AccountDeleteScreen.jsx (/account, /delete-account) e' oggi solo un pannello impostazioni (login, export, elimina account) con la classe CSS .legal-screen presa in prestito dalle pagine legali - palette beige/tan (#161616/#f5f1e8/#938c7d) incoerente col resto dell'app, che usa il tema horror scuro (--creepy-* in frontend/src/styles/horrorTheme.css). Nessun archetipo, nessuna statistica, nessun elemento di gioco: e' concettualmente solo TASK-120 (icona -> pagina account) mai davvero pensata come 'il mio profilo'. Richiesta esplicita dell'utente 2026-08-10: 'la pagina del mio profilo e' tutta sbagliata... deve avere una sezione con un qualche tipo di riassunto dei risultati ottenuti finora', con mandato esplicito UI/UX + growth hacker + game designer. Dopo una serie di domande di scoping fatte all'utente, deciso: (1) il riassunto include l'archetipo piu' recente + statistiche sui Duel (non lo storico completo di ogni test rifatto), (2) la pagina deve pesare in egual misura 'trofeo/dashboard personale' e 'trampolino d'azione verso il North Star metric' (sfide completate a 2 partecipanti/settimana, doc-2), (3) il riassunto e' visibile solo dopo login (resta una leva di attivazione in piu', oltre al pair insight di TASK-135), (4) iniziativa multi-task pianificata su piu' sessioni, non un unico task. Mockup visivo PROPOSTO (ancora da rivedere/approvare con l'utente) pubblicato: https://claude.ai/code/artifact/32590b56-c0ab-482e-9632-7b4afd21ea82 - card archetipo (riusa lo stile .results-archetype di ResultsScreen), riga di stat (Duel completati / compatibilita' media / archetipi incontrati), lista Duel recenti con azioni Vedi/Rematch, CTA persistente 'Sfida qualcuno di nuovo' (oggi raggiungibile SOLO da ResultsScreen appena dopo un test, non piu' dopo - un vero buco nel loop di crescita), account/impostazioni spostate in fondo e ridimensionate. Risolve anche di rimbalzo TASK-155 (nessun logout su /account oggi) - dedup verificato, nessun altro task esistente copre questo lavoro. Scomposto in 5 sotto-task indipendentemente utili dove possibile, con le due coppie dati-dipendenti collegate via --depends-on. NON iniziare l'implementazione dei sotto-task finche' l'utente non conferma la direzione del mockup.
<!-- SECTION:DESCRIPTION:END -->
