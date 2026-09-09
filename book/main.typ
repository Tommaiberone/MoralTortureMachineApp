// Mini-book demo assembling the gamebook's front matter and a couple of
// real chapters into one PDF. Compile with:
//   typst compile --root <repo root> book/main.typ book/out/mini-book.pdf
// See book/README.md.

#import "typst/template.typ": front-matter-page, full-bleed-page, chapters-registry

#set document(title: "Moral Torture Machine — The Gamebook", author: "Moral Torture Machine")

// Title page: full-bleed black background covering the entire physical
// page (verified this reaches every edge regardless of the page's
// mirrored margins), not just a content-width panel.
#full-bleed-page(page-count: 24)[
  #v(2.6in)
  #align(center)[
    #text(font: "DejaVu Sans Mono", size: 9pt, tracking: 3pt)[PROPERTY OF THE SUBJECT]
    #v(1.2em)
    #text(size: 27pt, weight: "bold", tracking: 1pt)[MORAL TORTURE MACHINE]
    #v(1em)
    #line(length: 35%, stroke: 0.5pt + white)
    #v(1em)
    #text(size: 14pt, style: "italic")[The Gamebook]
  ]
]
#pagebreak()

// Table of contents - built from the same registry every chapter reads,
// with real page numbers resolved via each chapter's own label rather
// than hardcoded.
#front-matter-page(page-count: 24, band: (title: "Table of Contents"))[
  #for key in chapters-registry.keys() {
    let c = chapters-registry.at(key)
    context {
      let matches = query(label("chapter-" + key))
      let pg = if matches.len() > 0 {
        str(counter(page).at(matches.first().location()).first())
      } else {
        "?"
      }
      block(width: 100%, above: 0.9em)[
        Case File No. #c.number --- #c.title #h(1fr) #pg
      ]
    }
  }
]
#pagebreak()

#include "typst/instructions.typ"
#pagebreak()

#include "chapters/chapter-01.typ"
#pagebreak()

#include "chapters/chapter-02.typ"
#pagebreak()

#include "typst/closing.typ"
