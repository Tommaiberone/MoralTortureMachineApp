#import "template.typ": front-matter-page

// A standard book convention this dossier didn't have yet: a copyright/
// edition page, right after the title page. Deliberately minimal and
// honest about what's still a placeholder (no real ISBN exists - this
// book has no print run yet, see TASK-281) rather than inventing one.
#front-matter-page(page-count: 24)[
  #v(1fr)
  #set text(font: "DejaVu Sans Mono", size: 8pt, fill: luma(40%))
  #set par(leading: 1em)

  MORAL TORTURE MACHINE --- THE GAMEBOOK

  #v(0.6em)
  First Edition. #datetime.today().display("[year]").

  #v(0.6em)
  © #datetime.today().display("[year]") Moral Torture Machine. All
  Case Files in this dossier are fictional; any resemblance to an
  actual case is a coincidence the Machine takes no responsibility for.

  #v(0.6em)
  ISBN: to be assigned at print submission.

  #v(1fr)
]
