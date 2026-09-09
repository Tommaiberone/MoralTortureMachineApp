# Gamebook print pipeline

Local tooling only. Not wired into any CI/CD, deploy, `pnpm build:prod`, or
Terraform. This is design/iteration tooling for the physical gamebook idea
(waitlist demand test: `TASK-281`) — not a production or Kickstarter
commitment. See `TASK-287`.

## Why Typst, not the usual HTML/CSS+headless-browser route

- No native GTK/Pango/cairo dependency chain to install on Windows (unlike
  WeasyPrint).
- Good default book typography (hyphenation, kerning, widow/orphan control)
  out of the box.
- Explicit, auditable page geometry (`typst/kdp.typ`) — important because
  KDP's automated interior reviewer rejects files that miss its exact
  trim/bleed/margin numbers.
- This repo already avoids browser-automation tooling (Playwright/Puppeteer)
  for cost/token reasons; a headless-Chrome print pipeline would reintroduce
  exactly that dependency.

## One-time setup

```powershell
winget install --id Typst.Typst -e
```

```bash
python -m venv book/.venv
book/.venv/Scripts/python.exe -m pip install segno
```

## Build a case file

```bash
# 1. Generate the QR for the case's qr-slug (see book/cases/case-001.typ)
book/.venv/Scripts/python.exe book/qr/generate_qr.py c001

# 2. Compile - MUST pass --root as the repo root so template.typ can read
#    backend/data/dilemmas_en.json (dilemma content is pulled live from the
#    app's own data, never retyped by hand, so book and app can't drift).
typst compile --root . book/cases/case-001.typ book/out/case-001.pdf
```

`typst watch --root . book/cases/case-001.typ book/out/case-001.pdf` recompiles
on save for fast iteration.

## Files

- `typst/kdp.typ` — KDP paperback interior geometry (trim, bleed, margins by
  page count), verified against KDP's published help pages, not memory.
  Re-check it if the trim size or final page count changes.
- `typst/template.typ` — `case-page(...)`, the one shared dossier layout
  every case file uses; also `find-dilemma(id)`, which reads
  `backend/data/dilemmas_en.json` at compile time and hard-fails if an id
  doesn't exist there.
- `cases/*.typ` — one Case File per chapter. Each references real dilemma
  `_id`s from `backend/data/dilemmas_en.json`, never invented/duplicated text.
- `qr/generate_qr.py` — generates `qr/<slug>.png` from a case's `qr-slug`
  (pure-Python `segno`, no Pillow/system deps). Generated PNGs are
  gitignored — regenerate them, don't hand-edit or commit them.

## Known follow-ups (not blocking this scaffold)

- Fonts are Typst's bundled OFL fonts (Libertinus Serif, DejaVu Sans Mono) —
  deliberately not a Windows-supplied commercial font, since KDP requires
  every font to be embeddable and most commercial Windows fonts restrict
  that. Swap for a licensed display/stamp font later only if it's
  confirmed embeddable.
- The QR block can overflow to its own page if a case's dilemma text runs
  long (seen on `case-001`, which is fine as content but worth a real
  layout pass — e.g. pinning the QR block to the bottom of the same page,
  or deliberately treating the QR as a page of its own).
- No bespoke dossier art direction yet (stamps, redacted-bar visuals beyond
  the `redacted()` helper, torn-paper textures) — this scaffold proves the
  pipeline and geometry, not the final visual design.
- Cover file (spine width, KDP's separate cover template) is out of scope
  here — build it against KDP's own generated template once a real page
  count exists.
