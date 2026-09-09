# Gamebook print pipeline

Local tooling only. Not wired into any CI/CD, deploy, `pnpm build:prod`, or
Terraform. This is design/iteration tooling for the physical gamebook idea
(waitlist demand test: `TASK-281`) — not a production or Kickstarter
commitment. Scaffold: `TASK-287`. Chapter/mode design: `TASK-292`. Visual
design: `TASK-293`. Registry/bleed/ToC/closing-page polish: `TASK-294`.

Interior is confirmed **black & white** for KDP. That still halftones
grayscale/solid fills correctly (like any B&W book with photos or shaded
boxes) — it only means no color ink, not "no gray or black". The
reversed (white-on-black) panels below lean on that.

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
whether they're played alone or live with a group. Five dilemmas per
chapter matches the app's own Party Room default
(`PARTY_ROOM_DEFAULT_DILEMMAS = 5`).

The book closes with a **Case Closed** page: a "Subject #___" fill-in
(the numbered-copy idea from early growth brainstorming), and a QR back to
the site framed as comparing your record against whoever you shared the
dossier with — the one page that explicitly reconnects the physical object
to the app's compare/share loop, which nothing earlier in the book did.

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
# 1. Generate every QR the book needs (reads book/chapters/registry.json
#    plus the fixed non-chapter slugs in generate_qr.py's EXTRA_SLUGS)
book/.venv/Scripts/python.exe book/qr/generate_qr.py

# 2. Compile the whole book - MUST pass --root as the repo root so
#    template.typ can read backend/data/dilemmas_en.json (dilemma content
#    is pulled live from the app's own data, never retyped by hand, so
#    book and app can't drift).
typst compile --root . book/main.typ book/out/mini-book.pdf
```

`typst watch --root . book/main.typ book/out/mini-book.pdf` recompiles on
save for fast iteration. A single chapter can also be compiled on its own,
e.g. `typst compile --root . book/chapters/chapter-01.typ book/out/chapter-01.pdf`
(its table of contents entry won't resolve a page number in that case,
since the label lookup needs the whole book compiled together).

## Files

- `main.typ` — assembles the title page, table of contents, instructions,
  every chapter, and the closing page into one book PDF, in reading order.
  Sets the compiled PDF's `title`/`author` metadata.
- `typst/kdp.typ` — KDP paperback interior geometry (trim, bleed, margins by
  page count), verified against KDP's published help pages, not memory.
  Re-check it if the trim size or final page count changes. Lives under
  `typst/`, not `build/`, so it isn't swept up by the root `.gitignore`'s
  generic `build/` rule meant for compiled output elsewhere.
- `typst/template.typ` — the shared dossier visual system:
  `chapter-page(key: ...)` (reads a chapter's content from the registry
  below); `front-matter-page(...)` and `full-bleed-page(...)` for
  non-chapter pages; `find-dilemma(id)`, which reads
  `backend/data/dilemmas_en.json` at compile time and hard-fails if an id
  doesn't exist; `bleed-band(...)` (the true edge-to-edge header band —
  see "Bleed" below), `evidence-tag`, `exhibit`, `stamp`, `lede`
  (a raised-initial accent, not a true wrap-around drop cap), `redacted`.
- `typst/instructions.typ` — the "How to Open a Case File" front-matter
  page explaining Solo Verdict vs. Convene Tribunal.
- `typst/closing.typ` — the "Case Closed" back-matter page.
- `chapters/registry.json` — **the single source of truth** for every
  chapter: title, theme intro, stamp text, solo/party QR slugs, and the
  five real dilemma `_id`s. A chapter file is just
  `#chapter-page(key: "c1") <chapter-c1>` — the label is what lets the
  table of contents resolve that chapter's real page number (see below).
  In spirit, this is the same shape `TASK-291`'s eventual backend mapping
  should share, so the book and the backend can't define two different
  "chapter c1" sets.
- `qr/generate_qr.py` — reads the registry and generates every chapter's
  QR pair plus any fixed non-chapter slugs (`EXTRA_SLUGS`, e.g. the
  closing page's) in one run; pass specific slugs as arguments to
  regenerate only those. Generated PNGs are gitignored — regenerate them,
  don't hand-edit or commit them.

## Bleed

`bleed-band(...)` and `full-bleed-page(...)` draw true edge-to-edge black
via Typst's `page(background: ...)`, which lays out against the *full
physical page* regardless of body margins (verified empirically: a
background rect's corner pixels land exactly on the physical page edge).
Earlier design notes (superseded) worried this needed recto/verso-aware
placement under this book's mirrored (`binding: left`) margins; that
concern only applies to art that's deliberately asymmetric (bleeding one
side but not the mirrored side). A symmetric full-width/full-page graphic
like these needs no such awareness — KDP's interior file uses one uniform
physical page size for the whole book regardless of odd/even, so it bleeds
correctly on every page unconditionally.

The one real subtlety: reserving space so body text doesn't collide with
a *repeating* band on a chapter's later pages must happen via the actual
page margin (`kdp-page`'s `extra-top` parameter), not a one-time `v()`
spacer in the content flow — a flow-level spacer is consumed once and
leaves page 2+ of a multi-page chapter colliding with the band, which is
exactly the bug this went through before landing on `extra-top`.

## Known follow-ups

- `TASK-291` (above) — the QR codes don't functionally work yet.
- Fonts are Typst's bundled OFL fonts (Libertinus Serif, DejaVu Sans Mono) —
  deliberately not a Windows-supplied commercial font, since KDP requires
  every font to be embeddable and most commercial Windows fonts restrict
  that. Swap for a licensed display/stamp font later only if it's
  confirmed embeddable.
- Cover file (spine width, KDP's separate cover template) is out of scope
  here — build it against KDP's own generated template once a real page
  count exists.
