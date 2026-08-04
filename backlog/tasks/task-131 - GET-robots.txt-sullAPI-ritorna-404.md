---
id: TASK-131
title: GET /robots.txt sull'API ritorna 404
status: Done
assignee: []
created_date: '2026-08-04 07:28'
updated_date: '2026-08-04 07:35'
labels: []
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato mentre si indagava una mail di alert reale (GET /robots.txt returned 404). Il dominio dell API (API Gateway/Lambda) non serve robots.txt - solo il frontend su CloudFront lo fa - quindi ogni bot/scanner che lo richiede direttamente sul dominio API genera un 404 reale che continua a far scattare alert. Aggiungere una GET /robots.txt minima sul backend (disallow-all, 200) elimina il rumore alla fonte invece di doverlo ripulire ogni volta dalla nuova tabella ops_error_alerts (TASK-129/130).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET /robots.txt sul backend risponde 200 con un semplice disallow-all invece di 404
- [ ] #2 Nessun impatto sul robots.txt gia' servito dal frontend/CloudFront per il dominio pubblico
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunta GET /robots.txt al backend (PlainTextResponse, 200, disallow-all) - risolve il 404 reale che arrivava dai bot/scanner che colpiscono il dominio API direttamente. Il robots.txt del frontend (CloudFront/S3) resta invariato. Vedi ADR-060.
<!-- SECTION:FINAL_SUMMARY:END -->
