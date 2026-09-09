// Amazon KDP paperback interior page geometry.
//
// Verified against KDP's published help pages on 2026-09-09 (not from
// memory - Amazon changes these numbers):
// - "Set Trim Size, Bleed, and Margins": kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6
// - "Fix Paperback and Hardcover Formatting Issues": kdp.amazon.com/en_US/help/topic/G201834260
//
// Bleed (0.125in) only applies to the outer/top/bottom edges - the inside
// (gutter/binding) edge never bleeds. KDP's own worked example: a 6x9in
// trim becomes a 6.125 x 9.25in page canvas once bleed is added.
// Margins are measured from the TRIM line, not from the bled page edge,
// so the physical (bled) page margin = bleed + KDP's trim-relative margin
// on every edge that bleeds, and just the gutter value on the inside edge
// (which has no bleed to add).

#let trim-width = 6in
#let trim-height = 9in
#let bleed = 0.125in

#let page-width = trim-width + bleed
#let page-height = trim-height + 2 * bleed

// KDP's margin table (24-828 pages). Re-check this table if a future book
// exceeds 828 pages or needs a different trim size - KDP's minimums can
// change and this file should be kept in sync, not trusted from memory.
#let margins-for-page-count(count) = {
  let gutter = if count <= 150 { 0.375in }
    else if count <= 300 { 0.5in }
    else if count <= 500 { 0.625in }
    else if count <= 700 { 0.75in }
    else { 0.875in }
  let outer-safe = 0.375in // KDP's "outside margin, with bleed" minimum
  (
    inside: gutter,
    outside: bleed + outer-safe,
    top: bleed + outer-safe,
    bottom: bleed + outer-safe,
  )
}

// Sets up a KDP-correct page (size incl. bleed, two-sided mirrored
// margins measured from the trim line) and yields the body inside it.
// page-count drives which margin-table row applies - pass the book's real
// expected page count once it is known; defaults to the smallest row.
//
// `extra-top` adds to the top margin on every page in scope - used to
// reserve space for a full-bleed header band drawn via page(background:).
// This must live in the real page margin, not a one-time `v()` spacer in
// the body flow: content that overflows onto a second page within the
// same background scope gets a fresh margin automatically, whereas a
// flow-level spacer is consumed once and leaves later pages colliding
// with the repeating band.
#let kdp-page(page-count: 24, extra-top: 0pt, body) = {
  let m = margins-for-page-count(page-count)
  set page(
    width: page-width,
    height: page-height,
    binding: left,
    margin: (inside: m.inside, outside: m.outside, top: m.top + extra-top, bottom: m.bottom),
  )
  body
}
