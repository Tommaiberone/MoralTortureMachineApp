# Gamebook print pipeline

Local tooling only. Not wired into any CI/CD, deploy, `pnpm build:prod`, or
Terraform. This is design/iteration tooling for the physical gamebook idea
(waitlist demand test: `TASK-281`) — not a production or Kickstarter
commitment. Scaffold: `TASK-287`. Chapter/mode design: `TASK-292`. Visual
design: `TASK-293`. Registry/bleed/ToC/closing-page polish: `TASK-294`.
Per-dilemma page layout: `TASK-295`.
Colophon/running footer/title-page Subject #: `TASK-298`.

Interior is confirmed **black & white** for KDP. That still halftones
grayscale/solid fills correctly (like any B&W book with photos or shaded
boxes) — it only means no color ink, not "no gray or black". The
reversed (white-on-black) panels below lean on that.

## Design

Each chapter is a **Case File**: ten dilemmas sharing one theme. The
chapter opener prints two QR codes, not one:

- **Solo Verdict** — opens a single-player Evaluation session with that
  chapter's ten dilemmas.
- **Convene Tribunal** — creates a Party Room with the same ten dilemmas,
  for however many people are at the table. One person narrates by reading
  each Exhibit aloud and turning the page; everyone else follows on their
  own phone.

Both codes open the *same* ten dilemmas — only the QR scanned changes
whether they're played alone or live with a group. Ten is a deliberate
book-specific choice (`TASK-291`'s 2026-09-23 follow-up), not the app's own
Party Room default (`PARTY_ROOM_DEFAULT_DILEMMAS` stays `5` for ordinary,
non-book rooms - it falls within Party Room's existing `3-12`
(`PARTY_ROOM_MIN_DILEMMAS`/`PARTY_ROOM_MAX_DILEMMAS`) range, so it needed no
backend constant change, only a chapter-specific dilemma list).

Each dilemma gets its own page: a title, a bordered image placeholder
(no artwork exists yet), the dilemma text, and its two answers as
webapp-style rectangular buttons — reproducing the actual shape of the
app's `.btn-yes`/`.btn-no` (`frontend/src/styles/shared.css`: equal width,
sharp square corners, a 2px border, side by side with a small gap), not
their color coding, since this interior is black & white.

The title page carries a "Subject #___" fill-in too (the numbered-copy
idea from early growth brainstorming) — claimed at the front, not only at
the back. The book closes with a **Case Closed** page: the same fill-in
again, and a QR back to the site framed as comparing your record against
whoever you shared the dossier with — the one page that explicitly
reconnects the physical object to the app's compare/share loop, which
nothing earlier in the book did. Every chapter page's footer shows that
chapter's title alongside the page number, so flipping through the middle
of the book still tells you which Case File you're in.

**`TASK-291` implemented:** `POST /party-rooms` accepts an optional
`chapterSlug` (e.g. `"c1-party"`), which bypasses random selection and uses
that chapter's fixed, ordered `dilemmaBaseIds` instead; `GET
/book/chapters/{slug}` resolves either QR's slug to its chapter key, mode
(`solo`/`party`), and that same ordered id list, so the frontend's
`/book/:slug` route can either fetch the dilemmas by id (solo, reusing the
existing `/dilemmas/by-ids`, same as a Duel invitee) or hand the slug to
`POST /party-rooms` (party). The mapping's canonical, *deployed* copy is
`backend/data/gamebook_chapters.json` — `book/` itself is intentionally not
part of any deployment (see below), so the backend cannot read this
directory's `registry.json` at runtime; `book/qr/generate_qr.py` instead
*regenerates* that file from `registry.json` before every QR (re)generation,
so `registry.json` stays the one place a human edits a chapter's slugs or
dilemma ids (`TASK-291` AC#3). Backend test coverage:
`backend/tests/test_party_room.py`'s `GamebookChapterTestCase`.

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

## Editor setup (VS Code + Tinymist)

`.vscode/settings.json` isn't versioned (the root `.gitignore` treats
`.vscode/` as local editor state), so re-add it once per clone/machine:

```json
{
  "tinymist.rootPath": "${workspaceFolder}"
}
```

Without it, the in-editor preview defaults its root to `book/` and can't
resolve the `/backend/...` and `/book/...` absolute paths this book's
Typst files use.

## Build

```bash
# 1. Generate every QR the book needs (first regenerates
#    backend/data/gamebook_chapters.json from book/chapters/registry.json,
#    then reads the registry for chapter -> solo/party slugs plus the fixed
#    non-chapter slugs in generate_qr.py's EXTRA_SLUGS) - commit the
#    regenerated gamebook_chapters.json alongside any registry.json change
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
  below, then puts one dilemma per page via `exhibit-page(...)` with a
  `pagebreak()` before each); `front-matter-page(...)` and
  `full-bleed-page(...)` for non-chapter pages; `find-dilemma(id)`, which
  reads `backend/data/dilemmas_en.json` at compile time and hard-fails if
  an id doesn't exist; `bleed-band(...)` (the true edge-to-edge header
  band — see "Bleed" below), `evidence-tag`, `image-placeholder(...)`,
  `answer-buttons(...)`, `stamp`, `lede` (a raised-initial accent, not a
  true wrap-around drop cap), `redacted`.
- `typst/instructions.typ` — the "How to Open a Case File" front-matter
  page explaining Solo Verdict vs. Convene Tribunal.
- `typst/closing.typ` — the "Case Closed" back-matter page.
- `typst/colophon.typ` — the edition/copyright page (right after the title
  page): honest about what's still a placeholder (no real ISBN exists
  until there's an actual print run, `TASK-281`) rather than inventing one.
- `chapters/registry.json` — **the single source of truth**, full stop, for
  every chapter: title, theme intro, stamp text, solo/party QR slugs, and
  its ten dilemmas as `{id, title}` (the real dilemma `_id` from
  `dilemmas_en.json` plus the book's own title for that Exhibit's page —
  `dilemmas_en.json` has no title field, so this is book-only content, not
  duplicated app data). A chapter file is just
  `#chapter-page(key: "c1") <chapter-c1>` — the label is what lets the
  table of contents resolve that chapter's real page number (see below).
  `backend/data/gamebook_chapters.json` (the backend's own deployed copy of
  just the slugs/dilemma-id-order shape, `TASK-291`) is *generated from
  this file* by `qr/generate_qr.py` on every run — never hand-edit it, edit
  `registry.json` and regenerate.
- `qr/generate_qr.py` — regenerates `backend/data/gamebook_chapters.json`
  from `registry.json`, then reads the registry and generates every
  chapter's QR pair plus any fixed non-chapter slugs (`EXTRA_SLUGS`, e.g.
  the closing page's) in one run; pass specific slugs as arguments to
  regenerate only the QR PNGs (the chapters-file regeneration still runs
  first regardless). Generated QR PNGs are gitignored — regenerate them,
  don't hand-edit or commit them. `gamebook_chapters.json` is the opposite:
  regenerate it too, but *do* commit it — the deployed backend reads it
  directly and has no build step of its own to regenerate it first.

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

- Fonts are Typst's bundled OFL fonts (Libertinus Serif, DejaVu Sans Mono) —
  deliberately not a Windows-supplied commercial font, since KDP requires
  every font to be embeddable and most commercial Windows fonts restrict
  that. Swap for a licensed display/stamp font later only if it's
  confirmed embeddable.
- Cover file (spine width, KDP's separate cover template) is out of scope
  here — build it against KDP's own generated template once a real page
  count exists.

## Choosing the dilemmas (`book/catalog/`)

`plan.json` is the chapter map for the 100 dilemmas (genre chapters, `TASK-314`). `node book/catalog/build-selection.mjs`
builds `book/out/selection-100.pdf` from it and from `backend/data/dilemmas_en.json` for editorial review, and
`node book/catalog/pool-metrics.mjs [file]` prints the bias metrics used in `book/catalog/bias-analysis.md`.
