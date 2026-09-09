#import "template.typ": front-matter-page, evidence-tag

#front-matter-page(
  page-count: 24,
  band: (kicker: "Final Report", title: "Case Closed"),
)[
  #v(0.4em)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 0.6em,
    align(horizon)[
      #text(font: "DejaVu Sans Mono", size: 9pt, tracking: 1pt)[SUBJECT \#]
    ],
    align(horizon + left)[
      #box(width: 2.4in, height: 1.1em, stroke: (bottom: 0.6pt))
    ],
  )

  #v(1.4em)

  Every case in this dossier ends the same way: not with a verdict handed
  down, but with one you handed to yourself. What the file cannot show
  you is how your answers compare - to whoever you shared this dossier
  with, and to everyone else who was ever handed one.

  #v(1em)

  #evidence-tag(
    qr-slug: "closing",
    tag: "RETURN",
    label: "Return to the Machine",
    caption: [See your full record, compare it against whoever opened a case with you, and pass this dossier - or its code - to whoever should open the next one.],
  )
]
