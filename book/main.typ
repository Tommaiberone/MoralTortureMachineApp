// Mini-book demo assembling the gamebook's front matter and a couple of
// real chapters into one PDF. Compile with:
//   typst compile --root <repo root> book/main.typ book/out/mini-book.pdf
// See book/README.md.

#import "typst/template.typ": front-matter-page, stamp-header

#front-matter-page(page-count: 24)[
  #v(2.5in)
  #align(center)[
    #stamp-header("Property of the Subject")
    #v(1em)
    #text(size: 28pt, weight: "bold", tracking: 2pt)[MORAL TORTURE MACHINE]
    #v(0.5em)
    #line(length: 40%, stroke: 0.4pt)
    #v(0.5em)
    #text(size: 14pt, style: "italic")[The Gamebook]
  ]
]
#pagebreak()

#include "typst/instructions.typ"
#pagebreak()

#include "chapters/chapter-01.typ"
#pagebreak()

#include "chapters/chapter-02.typ"
