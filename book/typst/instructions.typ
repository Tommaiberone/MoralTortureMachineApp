#import "template.typ": front-matter-page, case-band, redacted

#let procedure-panel(tag, label, body) = block(
  width: 100%,
  stroke: 0.6pt,
  inset: 0.9em,
)[
  #text(font: "DejaVu Sans Mono", size: 7pt, tracking: 1.5pt, fill: luma(40%))[#tag]
  #v(0.5em)
  #text(font: "DejaVu Sans Mono", size: 9pt, weight: "bold", tracking: 1pt, upper(label))
  #v(0.5em)
  #body
]

#front-matter-page(page-count: 24)[
  #case-band(kicker: "Intake Protocol", title: "How to Open a Case File")
  #v(1.2em)

  Every chapter in this dossier is a *Case File*: five linked dilemmas,
  one theme, one moment where the file is opened. Nothing in it changes
  depending on how you open it - the same five dilemmas are waiting either
  way. What changes is who is in the room with you.

  #v(1.1em)

  #grid(
    columns: (1fr, 1fr),
    column-gutter: 1.2em,
    procedure-panel("PROCEDURE A", "Solo Verdict")[
      Scan the left code. You will answer the five dilemmas on your own,
      at your own pace, and receive your verdict privately when you
      finish. Read each Exhibit printed below before or after you answer
      in the app - the book carries the full case either way.
    ],
    procedure-panel("PROCEDURE B", "Convene Tribunal")[
      Scan the right code instead when there is more than one of you at
      the table. This opens a shared room for that specific Case File.
      Whoever opens it becomes the Tribunal's narrator: read each Exhibit
      aloud while everyone else has the room open on their own phone. The
      narrator sets the pace by turning the page. Each of you answers
      privately on your own screen; the verdict is revealed to the whole
      table once everyone has answered.
    ],
  )

  #v(1.2em)
  #line(length: 100%, stroke: 0.3pt)
  #v(1em)

  A code only ever opens *its own* Case File - the five dilemmas printed
  under it, never a different five. Once a Tribunal delivers its verdict
  under protocol #redacted(width: 3.5em), the room cannot be reopened -
  scan the code again for a fresh case elsewhere in the file.
]
