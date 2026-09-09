# Gamebook print pipeline

Local tooling only. Not wired into any CI/CD, deploy, `pnpm build:prod`, or
Terraform. This is design/iteration tooling for the physical gamebook idea
(waitlist demand test: `TASK-281`) — not a production or Kickstarter
commitment. Scaffold: `TASK-287`. Chapter/mode design: `TASK-292`.

## Design

Each chapter is a **Case File**: five dilemmas sharing one theme. The
chapter opener prints two QR codes, not one:

- **Solo Verdict** — opens a single-player Evaluation session with that
  chapter's five dilemmas.
- **Convene Tribunal** — creates a Party Room with the same five dilemmas,
  for however many people are at the table. One person narrates by reading
  each Exhibit aloud and turning the page; everyone else follows on their
  own phone.

Both codes open the *same* five dilemmas — only the QR scanned changes
whether they're played alone or live with a group. This replaced an
earlier idea (a QR per dilemma, per mode) that fragmented party play down
to a single dilemma at a time; five dilemmas per chapter also matches the
app's own Party Room default (`PARTY_ROOM_DEFAULT_DILEMMAS = 5`).

**Known gap, not yet built (`TASK-291`, High, To Do):** today neither
Party Room creation nor solo Evaluation accepts a client-supplied,
fixed list of dilemma ids — both flows pick dilemmas at random
server-side. The QR codes in this repo are placeholders (`segno`-generated
PNGs pointing at a URL the backend doesn't resolve to a fixed set yet).
Scanning one today would not reliably reopen the exact five dilemmas
printed on the page. Read `TASK-291` before treating this book as
functional, not just print-ready.

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

## Build

```bash
# 1. Generate every chapter's QR pair (see solo-slug/party-slug in each
#    book/chapters/*.typ)
book/.venv/Scripts/python.exe book/qr/generate_qr.py c1-solo c1-party c2-solo c2-party

# 2. Compile the whole book - MUST pass --root as the repo root so
#    template.typ can read backend/data/dilemmas_en.json (dilemma content
#    is pulled live from the app's own data, never retyped by hand, so
#    book and app can't drift).
typst compile --root . book/main.typ book/out/mini-book.pdf
```

`typst watch --root . book/main.typ book/out/mini-book.pdf` recompiles on
save for fast iteration. A single chapter can also be compiled on its own,
e.g. `typst compile --root . book/chapters/chapter-01.typ book/out/chapter-01.pdf`.

## Files

- `main.typ` — assembles the title page, instructions, and every chapter
  into one book PDF, in reading order.
- `typst/kdp.typ` — KDP paperback interior geometry (trim, bleed, margins by
  page count), verified against KDP's published help pages, not memory.
  Re-check it if the trim size or final page count changes. Lives under
  `typst/`, not `build/`, so it isn't swept up by the root `.gitignore`'s
  generic `build/` rule meant for compiled output elsewhere.
- `typst/template.typ` — `chapter-page(...)`, the one shared dossier layout
  every chapter uses (title, theme intro, the solo/party QR pair, the
  Exhibit list); also `front-matter-page(...)` for non-chapter pages
  (title page, instructions), and `find-dilemma(id)`, which reads
  `backend/data/dilemmas_en.json` at compile time and hard-fails if an id
  doesn't exist there.
- `typst/instructions.typ` — the "How to Open a Case File" front-matter
  page explaining Solo Verdict vs. Convene Tribunal.
- `chapters/*.typ` — one Case File per chapter, five dilemma `_id`s each,
  referencing real ids from `backend/data/dilemmas_en.json` — never
  invented/duplicated text.
- `qr/generate_qr.py` — generates `qr/<slug>.png` for any slug (pure-Python
  `segno`, no Pillow/system deps). Generated PNGs are gitignored —
  regenerate them, don't hand-edit or commit them.

## Known follow-ups (not blocking this scaffold)

- `TASK-291` (above) — the QR codes don't functionally work yet.
- Fonts are Typst's bundled OFL fonts (Libertinus Serif, DejaVu Sans Mono) —
  deliberately not a Windows-supplied commercial font, since KDP requires
  every font to be embeddable and most commercial Windows fonts restrict
  that. Swap for a licensed display/stamp font later only if it's
  confirmed embeddable.
- No bespoke dossier art direction yet (stamps, redacted-bar visuals beyond
  the `redacted()` helper, torn-paper textures) — this scaffold proves the
  pipeline, geometry, and chapter mechanic, not the final visual design.
- Cover file (spine width, KDP's separate cover template) is out of scope
  here — build it against KDP's own generated template once a real page
  count exists.
