// Shared visual shell for the gamebook - the one place that defines what a
// "dossier" page looks like, so no chapter re-implements its own
// header/redaction/QR styling.
//
// Fonts are deliberately Typst's own bundled OFL fonts (Libertinus Serif,
// DejaVu Sans Mono), not Windows-supplied fonts like Times New Roman or
// Courier New: KDP requires every font to be fully embeddable, and
// commercial Windows fonts commonly restrict embedding.

#import "kdp.typ": kdp-page

// Reads the app's real dilemma content instead of retyping it - the book
// and the app must never drift out of sync on dilemma text. Compile with
// `--root <repo root>` so this root-relative path resolves.
#let dilemmas-en = json("/backend/data/dilemmas_en.json")

#let find-dilemma(id) = {
  let matches = dilemmas-en.filter(d => d._id == id)
  assert(
    matches.len() == 1,
    message: "dilemma id not found in backend/data/dilemmas_en.json: " + id,
  )
  matches.first()
}

// A "redacted" black bar, standing in for censored text in the dossier art
// direction.
#let redacted(width: 4em) = box(width: width, height: 0.85em, fill: black)

#let stamp-header(label) = {
  set text(font: "DejaVu Sans Mono", size: 8pt, tracking: 2pt)
  align(center, upper[#label])
}

// One QR block with its instruction caption - the shared unit that repeats
// twice per chapter opener (solo / party). qr-slug names the PNG generated
// by book/qr/generate_qr.py (book/qr/<qr-slug>.png). The PNG is a
// placeholder pointing at a URL the backend doesn't resolve to a fixed
// dilemma set yet - see TASK-291.
#let qr-block(qr-slug: "", label: "", caption: "") = align(center)[
  #image("/book/qr/" + qr-slug + ".png", width: 1.15in)
  #v(0.3em)
  #text(font: "DejaVu Sans Mono", size: 9pt, weight: "bold", tracking: 1pt, upper(label))
  #v(0.15em)
  #text(size: 8pt, style: "italic")[#caption]
]

// The two-QR chapter opener: same 5 dilemmas either way, only the QR
// scanned changes whether they're played alone or with a table of people.
#let mode-select(solo-slug: "", party-slug: "") = grid(
  columns: (1fr, 1fr),
  column-gutter: 1.5em,
  qr-block(
    qr-slug: solo-slug,
    label: "Solo Verdict",
    caption: [Open this case alone. Read, decide, scan when you're done.],
  ),
  qr-block(
    qr-slug: party-slug,
    label: "Convene Tribunal",
    caption: [Gather the table. Everyone scans this on their own phone before anyone reads aloud.],
  ),
)

// A front-matter page (instructions, title page, ...): same KDP geometry
// and fonts as a chapter, but no dossier chrome (no case header/QR pair).
#let front-matter-page(page-count: 24, body) = {
  kdp-page(page-count: page-count, {
    set text(font: "Libertinus Serif", size: 10.5pt)
    set par(justify: true, leading: 0.75em)
    body
  })
}

// One printed chapter: a themed cluster of 5 dilemmas, opened by the
// solo/party QR pair. `dilemma-ids` pulls real dilemmas straight from
// dilemmas_en.json - never retyped text.
#let chapter-page(
  number: 1,
  title: "",
  theme-intro: none,
  solo-slug: "",
  party-slug: "",
  page-count: 24,
  dilemma-ids: (),
) = {
  kdp-page(page-count: page-count, {
    set text(font: "Libertinus Serif", size: 10.5pt)
    set par(justify: true, leading: 0.75em)

    stamp-header("Case File No. " + str(number))
    v(0.6em)
    line(length: 100%, stroke: 0.4pt)
    v(0.8em)
    align(center, text(size: 20pt, weight: "bold", tracking: 1pt, upper(title)))
    v(1em)

    if theme-intro != none {
      align(center, box(width: 85%, emph(theme-intro)))
      v(1.2em)
    }

    mode-select(solo-slug: solo-slug, party-slug: party-slug)
    v(1.2em)
    line(length: 100%, stroke: 0.4pt)
    v(1em)

    for (i, id) in dilemma-ids.enumerate() {
      let d = find-dilemma(id)
      if i > 0 {
        v(0.6em)
        line(length: 40%, stroke: 0.3pt)
        v(0.6em)
      }
      text(font: "DejaVu Sans Mono", size: 8pt, tracking: 1pt)[EXHIBIT #(i + 1)]
      v(0.4em)
      d.dilemma
      v(0.6em)
      list(
        [*A.* #d.firstAnswer],
        [*B.* #d.secondAnswer],
      )
    }
  })
}
