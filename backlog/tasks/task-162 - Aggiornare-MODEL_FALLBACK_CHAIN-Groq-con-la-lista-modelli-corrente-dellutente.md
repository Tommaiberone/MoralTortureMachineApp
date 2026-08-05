---
id: TASK-162
title: Aggiornare MODEL_FALLBACK_CHAIN Groq con la lista modelli corrente dell'utente
status: Done
assignee: []
created_date: '2026-08-05 12:53'
updated_date: '2026-08-05 12:55'
labels:
  - backend
  - ai
  - maintenance
dependencies: []
priority: medium
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Richiesta esplicita dell'utente 2026-08-05: controllare i modelli Groq attualmente usati in MODEL_FALLBACK_CHAIN (backend_fastapi.py) e aggiornarli con la lista di Supported Models fornita dall'utente (pagina GroqDocs), mantenendo inalterata la struttura/meccanismo della catena di fallback (call_groq_api_with_fallback prova ogni modello in ordine finche' uno risponde). I modelli attualmente in catena ma non presenti nella lista fornita vanno considerati deprecati e rimossi; i modelli nuovi presenti nella lista vanno aggiunti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MODEL_FALLBACK_CHAIN contiene solo model id presenti nella lista Supported Models fornita dall'utente (esclusi modelli di modalita' non testuale come Whisper/audio o Orpheus/TTS, ed esclusi modelli Enterprise/ContactSales non accessibili sul piano attuale)
- [x] #2 I modelli rimossi (non piu' nella lista) sono stati tolti dalla catena; i modelli nuovi della lista applicabili a completions testuali sono stati aggiunti
- [x] #3 Il meccanismo di fallback (ordine, retry, gestione errori in call_groq_api_with_fallback) resta invariato - solo il contenuto della lista cambia
- [x] #4 Verificato che backend/tests passino e py_compile sia pulito dopo la modifica
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: MODEL_FALLBACK_CHAIN ridotta da 15 a 9 modelli. Rimossi (non piu' nella lista Supported Models fornita): qwen/qwen3-32b, meta-llama/llama-4-maverick-17b-128e-instruct, meta-llama/llama-4-scout-17b-16e-instruct, moonshotai/kimi-k2-instruct, moonshotai/kimi-k2-instruct-0905, meta-llama/llama-guard-4-12b, allam-2-7b. Aggiunto: qwen/qwen3.6-27b (stessa posizione relativa del deprecato qwen/qwen3-32b che sostituisce). Confermati e mantenuti: llama-3.3-70b-versatile, openai/gpt-oss-120b, llama-3.1-8b-instant, openai/gpt-oss-20b, meta-llama/llama-prompt-guard-2-86m, meta-llama/llama-prompt-guard-2-22m, groq/compound, groq/compound-mini. Esclusi deliberatamente dalla lista fornita (non applicabili a completions testuali): whisper-large-v3/-turbo (audio speech-to-text), canopylabs/orpheus-* (text-to-speech), minimaxai/minimax-m2.7 (Enterprise/ContactSales, non accessibile sul piano attuale senza contratto commerciale - violerebbe il vincolo Free Tier di CLAUDE.md), openai/gpt-oss-safeguard-20b (modello di safety/moderazione, non general-purpose - stesso motivo per cui non ho aggiunto nuovi modelli guard-only, anche se i due prompt-guard gia' presenti in catena sono stati mantenuti perche' gia' c'erano ed erano nella lista). Meccanismo di fallback (call_groq_api_with_fallback, i 4 placeholder 'model': 'llama-3.1-8b-instant' nei vari payload, gestione errori/retry) invariato - solo il contenuto della lista e i commenti sui rate limit (aggiornati da TPD, non piu' pubblicato dalla pagina Groq attuale, a TPM/RPM del Developer plan). py_compile pulito, suite backend completa 144/144 passano. Nota per l'utente: i due modelli meta-llama/llama-prompt-guard-2-* sono classificatori (max 512 token, pensati per rilevare prompt injection), non modelli di chat generici - erano gia' in catena prima di questa sessione; mantenuti per fedelta' alla lista fornita ma probabilmente non producono mai un completamento utilizzabile se la catena arriva fino a loro.
<!-- SECTION:NOTES:END -->
