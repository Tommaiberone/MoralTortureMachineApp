// Editorial review PDF of the 100 selected dilemmas. Built by build-selection.mjs; do not compile by hand
// (the data file is generated). Fonts are Typst's bundled ones, like the rest of the book pipeline.
#let data = json("/out/selection-data.json")

#set document(title: "Gamebook: the 100 dilemmas", author: "Moral Torture Machine")
#set page(
  paper: "a4",
  margin: (x: 2.2cm, top: 2.2cm, bottom: 2.4cm),
  footer: context [
    #set text(size: 8pt, fill: luma(110))
    Gamebook selection, working copy #h(1fr) #counter(page).display()
  ],
)
#set text(font: "Libertinus Serif", size: 11pt)
#set par(justify: false, leading: 0.62em)
#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  v(0.6em)
  text(size: 22pt, weight: "bold", it.body)
  v(0.4em)
}

#let mono(body) = text(font: "DejaVu Sans Mono", size: 7.5pt, fill: luma(110), body)
#let ink = luma(35)
#let soft = luma(235)

#let answer(letter, body) = block(
  width: 100%,
  inset: (x: 9pt, y: 7pt),
  stroke: 0.8pt + ink,
  [#text(font: "DejaVu Sans Mono", size: 8pt, weight: "bold")[#letter] #h(4pt) #body],
)

#let existing(it) = block(breakable: false, width: 100%, above: 1.1em, below: 0.4em)[
  #mono[#it.global · #it.position/10 · #it.meta]
  #v(-0.2em)
  #text(size: 13pt, weight: "bold")[#it.title]
  #v(0.15em)
  #it.text
  #v(0.3em)
  #grid(columns: (1fr, 1fr), column-gutter: 8pt, answer("A", it.a), answer("B", it.b))
  #if it.flags.len() > 0 [
    #v(0.1em)
    #mono[flags: #it.flags.join(" · ")]
  ]
  #v(0.3em)
  #line(length: 100%, stroke: 0.4pt + luma(200))
]

#let history(it) = block(breakable: false, width: 100%, above: 1.1em, below: 0.4em, fill: soft, inset: 10pt)[
  #mono[#it.global · #it.position/10 · #it.meta · TO WRITE, sources to verify]
  #v(-0.2em)
  #text(size: 13pt, weight: "bold")[#it.title] #h(6pt) #text(fill: luma(90))[#it.when]
  #v(0.15em)
  The real choice: #it.choice.
]

#let placeholder(it) = block(breakable: false, width: 100%, above: 1.1em, below: 0.4em, stroke: (dash: "dashed", thickness: 0.8pt, paint: luma(120)), inset: 10pt)[
  #mono[#it.global · #it.position/10 · TO WRITE]
  #v(-0.2em)
  #text(size: 13pt, weight: "bold")[#it.title]
  #v(0.1em)
  #text(size: 9.5pt, fill: luma(90))[#it.note]
]

// Title page
#align(center + horizon)[
  #text(size: 30pt, weight: "bold")[The 100 dilemmas]
  #v(0.4em)
  #text(size: 14pt)[Gamebook selection, working copy]
  #v(1.2em)
  #text(size: 10.5pt, fill: luma(90))[Updated #data.updated. #data.totals.existing dilemmas already written, #data.totals.history historical ones to write from verified sources, #data.totals.new others to write. Text is read live from the app's dilemma file: what you read here is what the book and the app will print.]
]
#pagebreak()

#outline(title: [Chapters], depth: 1, indent: 0pt)

#for chapter in data.chapters [
  = Chapter #chapter.number: #chapter.genre
  #text(fill: luma(90))[#chapter.intro]
  #v(0.2em)
  #mono[#chapter.counts.existing written · #chapter.counts.history history to write · #chapter.counts.new other to write]
  #for it in chapter.items {
    if it.kind == "existing" { existing(it) } else if it.kind == "history" { history(it) } else { placeholder(it) }
  }
]

= Reserves and dropped
#text(weight: "bold")[Reserve history candidates (swap in if one of the twenty fails verification)]
#for r in data.reserves [
  - #r.title (#r.when): #r.choice
]
#v(0.6em)
#text(weight: "bold")[Dropped, with the reason]
#for r in data.dropped [
  - #r.title: #r.why
]
