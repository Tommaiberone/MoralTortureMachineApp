// Mini-book demo assembling the gamebook's front matter and a couple of
// real chapters into one PDF. Compile with:
//   typst compile --root <repo root> book/main.typ book/out/mini-book.pdf
// See book/README.md.

#import "typst/template.typ": front-matter-page

#front-matter-page(page-count: 24)[
  #v(1.4in)
  #block(
    width: 100%,
    height: 5in,
    fill: black,
    inset: 1.5em,
  )[
    #set align(center + horizon)
    #set text(fill: white)
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

#include "typst/instructions.typ"
#pagebreak()

#include "chapters/chapter-01.typ"
#pagebreak()

#include "chapters/chapter-02.typ"
