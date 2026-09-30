# Gamebook: selection of the 100 dilemmas (working file for TASK-314)

Working file, edited together. The chapter map lives in [plan.json](plan.json) (single source of truth);
the reviewable PDF is built from it with `node book/catalog/build-selection.mjs` (output `book/out/selection-100.pdf`,
git-ignored). The bias findings behind the score, order and wording changes are in [bias-analysis.md](bias-analysis.md).
Dilemmas not selected for the book stay in the app pool.

## Decisions taken (2026-09-30)

- Chapters are grouped by **genre**, not by moral theme. This supersedes the "grouped by theme" wording in ADR-129
  and TASK-314's original title; recorded in an ADR when the map is locked.
- Book language: EN only.
- Historical dilemmas: real, **closed** events only (no living protagonists). Twenty chosen (see the PDF); reserves and dropped ones listed there.
- After each historical choice the page **reveals what actually happened** (book-only field, no app schema change).
- Everyday is capped at **two** chapters (the two already built); a third everyday chapter was rejected as too many.
- Non-selected dilemmas remain in the app.
- Bias corrections apply to the whole in-game pool, not only to the book selection (TASK-370).

## Chapter map (order = proposed intensity ramp)

| Ch | Genre | Written | To write |
|---|---|---|---|
| 1 | Everyday I: money and small honesty | 10 | 0 |
| 2 | Everyday II: friends, family and colleagues | 10 | 0 |
| 3 | Society and the world | 9 | 1 |
| 4 | Technology and AI | 7 | 3 |
| 5 | Medicine and bioethics | 9 | 1 |
| 6 | Work and career | 10 | 0 |
| 7 | Power, war and duty | 10 | 0 |
| 8 | Philosophy: thought experiments | 10 | 0 |
| 9 | History I: war, atrocity and the brink | 0 | 10 |
| 10 | History II: conscience, science and the state | 0 | 10 |

75 dilemmas already exist (20 of them are Case Files 1-2), 20 are historical and to be written from verified sources,
5 are new in other genres (topics proposed in the PDF). 40 existing dilemmas are left out of the book and stay in the app: 45, 47, 48, 49, 50, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 74, 76, 79, 81, 82, 84, 85, 86, 92, 95, 97, 99, 100, 104, 108, 109, 110, 111, 114.

## Audit of the 115 existing dilemmas (after the TASK-370 corrections)

"Ch" is the chapter in the map ("-" = not in the book). "Changes" lists what TASK-370 changed for that dilemma: `scores`
(rebalanced or rewritten), `labels` (answer wording), `order swapped` (answers A/B exchanged, teasers and scores with them).
Flags: `trim` (over 115 words), `dated`, `content` (needs the warning from TASK-337), `known scenario` (classic thought
experiment retold in original words; provenance is TASK-343's job). The verdict (keep / revise / cut) is decided in review.

| # | ID | Label | Ch | Words | Changes | Flags |
|---|---|---|---|---|---|---|
| 1 | 1978a139 | Friend's theft vs ten children | 8 | 113 | scores, labels |  |
| 2 | 1978a13a | Immune to the plague | 5 | 95 | scores |  |
| 3 | 1978a13b | Runaway train, your brother | 8 | 73 | scores | known scenario: Foot/Thomson trolley |
| 4 | 1978a13c | Last dose: virologist or child | 5 | 101 | scores |  |
| 5 | 1978a13d | Prison guard frames a thief | 7 | 97 | labels | content: execution |
| 6 | 1978a13e | Aid for the youth of your people | 3 | 80 |  |  |
| 7 | 1978a13f | Device: end poverty, lose someone you love | 8 | 75 | scores |  |
| 8 | 1978a140 | Superintelligence enforces peace | 4 | 83 | scores |  |
| 9 | 1978a141 | Generation ship lands on a living world | 8 | 82 | scores |  |
| 10 | 1978a194 | The child in the cellar | 8 | 85 | scores, order swapped | known scenario: Le Guin, 'Omelas' |
| 11 | 1978a195 | Partner's brain damage, erased personality | 5 | 95 | scores, order swapped |  |
| 12 | 1978a196 | Resistance leader offered a deal | 7 | 107 | labels |  |
| 13 | 1978a197 | Pre-crime newborns | 4 | 95 | labels | content: infant euthanasia; known scenario: Dick, 'Minority Report' |
| 14 | 1978a198 | Sterile humanity: no emotions or upload | 4 | 89 | scores |  |
| 15 | 1978a199 | Time travel to stop a genocide | 8 | 92 | scores |  |
| 16 | 1978a200 | Beloved leader's secret crimes | 7 | 76 | scores |  |
| 17 | 1978a201 | Aliens offer a cure for a yearly lottery | 8 | 79 |  |  |
| 18 | 8b805be0 | Steal the drug for your spouse | 5 | 100 | scores | known scenario: Kohlberg's Heinz |
| 19 | ac2604af | Shoot one to save nineteen | 7 | 78 | scores | content: execution; known scenario: B. Williams, Jim & the Indians |
| 20 | a6b25745 | Kidney-connected violinist | 5 | 86 | scores, order swapped | known scenario: Thomson's violinist |
| 21 | 8fe9fd36 | Experience machine | 4 | 85 | scores | known scenario: Nozick's experience machine |
| 22 | 8453fd03 | Mother or resistance | 7 | 95 | scores | known scenario: Sartre's student |
| 23 | ada72e24 | Burying the brother | 7 | 89 | scores | known scenario: Sophocles' Antigone |
| 24 | 9af7a22c | Lying to the killer at the door | 8 | 79 | scores, order swapped | known scenario: Kant, murderer at the door |
| 25 | 93054395 | Lifeboat, dying passenger | 8 | 89 |  | content: cannibalism; known scenario: R v Dudley & Stephens |
| 26 | beb9362f | Choosing one child | 7 | 92 | scores | content: Holocaust setting; known scenario: Styron, 'Sophie's Choice' |
| 27 | 81a025a1 | Sailor who killed a superior | 7 | 96 |  | known scenario: Melville, 'Billy Budd' |
| 28 | 8a49a013 | Untraceable device | 8 | 95 | scores | known scenario: Plato's ring of Gyges |
| 29 | a387a69a | Inspector and the reformed fugitive | 7 | 97 |  | known scenario: Hugo, Valjean/Javert |
| 30 | f7b76cce | Biased crime-prediction AI | 4 | 111 | scores |  |
| 31 | 9e0a6d5f | Deathbed brain upload | 4 | 107 | scores | known scenario: Parfit's teletransporter |
| 32 | 383e86c2 | Transplant AI kill switch | 4 | 139 | scores | trim (139w) |
| 33 | e2764623 | Assisted dying: you administer | 5 | 97 | scores | content: assisted dying |
| 34 | bf250a2d | Germline editing your child | 5 | 93 | scores, order swapped |  |
| 35 | ae448e6c | Genetic score for kidney allocation | 5 | 95 | labels |  |
| 36 | 3b01f9c7 | Coal plant extension | 3 | 106 | scores |  |
| 37 | 2f2cd0d4 | Aerosol geoengineering | 3 | 109 |  |  |
| 38 | 11c78ac9 | Last mineral reserve | 3 | 87 |  |  |
| 39 | e7037b0f | Leak illegal surveillance files | 3 | 84 | scores, labels |  |
| 40 | db191107 | Diplomat's oath vs atrocity | 3 | 96 | scores |  |
| 41 | 4e24fa7c | Chaplain's confessional seal | 7 | 103 | scores | known scenario: seal of confession |
| 42 | 94ed394e | Milestone purchase vs lifesaving donation | 3 | 84 | scores | known scenario: Singer's drowning child |
| 43 | 3884cd7a | Health budget: home or abroad | 3 | 108 | scores |  |
| 44 | 233d5075 | Vaccine surplus export | 3 | 86 | scores |  |
| 45 | 9d2db94e | Glowing reference, padded resume | - | 73 | scores, order swapped, labels |  |
| 46 | bb788df4 | The Padded Invoice | 1 | 81 | scores, order swapped, labels |  |
| 47 | bc52819c | Hire friend or better stranger | - | 69 | scores |  |
| 48 | 7e36df65 | Bankruptcy vs small creditors | - | 72 | scores |  |
| 49 | 51352307 | Teen's diary | - | 71 | scores |  |
| 50 | 3cc47ffb | Drunk late-night driver | - | 58 | scores |  |
| 51 | 877dd39d | Terminal diagnosis: hide it? | 5 | 62 | scores |  |
| 52 | 7ae09434 | Job at the weapons manufacturer | 6 | 59 |  |  |
| 53 | f8c043a2 | The Lounge Pen | 1 | 65 | scores, labels |  |
| 54 | 2895864c | Dinner from the rumor-spreader | 2 | 81 | scores |  |
| 55 | a44dfd24 | Broken vase, blame the dog | - | 61 | scores, order swapped |  |
| 56 | 37dacb05 | Red light on the ER run | - | 58 |  |  |
| 57 | 9f89b8a6 | Sick day you don't need | - | 67 | scores |  |
| 58 | 4025f7ed | Parking-lot scrape | - | 72 | scores |  |
| 59 | ca3cdef6 | Two dates, one night | - | 71 | scores |  |
| 60 | 0711d3b5 | Friend saved you $23,000 | - | 73 | scores, order swapped |  |
| 61 | 5e499824 | Recovered bike that isn't yours | - | 57 | scores, order swapped |  |
| 62 | 409da665 | The Phantom Credit Slip | 1 | 67 | scores, order swapped | dated: paper credit slip |
| 63 | 7ff461a8 | Undocumented couple in your garage | - | 62 | scores, order swapped |  |
| 64 | 63ffa3dd | Hidden raise, child support | - | 60 | scores |  |
| 65 | c1166a8d | Loan to a friend, with interest? | - | 60 |  |  |
| 66 | aa792662 | Faking job-search certifications | - | 61 | scores, order swapped, labels |  |
| 67 | 1e76df84 | Headlights left on | - | 66 | scores, order swapped |  |
| 68 | 3cefac9e | Tip after a rip-off meal | - | 50 | scores |  |
| 69 | 25b75cf4 | Window seat swap | - | 59 | scores, order swapped |  |
| 70 | 1459ce2f | Promise to a stranger on a plane | - | 72 | scores |  |
| 71 | e03fdf8b | Screams behind the house | - | 64 | scores |  |
| 72 | 795c40b0 | The failing lawyer-friend | 2 | 64 |  |  |
| 73 | c610f752 | The nurse cutting corners | 2 | 58 | scores |  |
| 74 | 358a9b06 | Vest inside out | - | 69 | scores, order swapped | dated: odd setting (cabaret) |
| 75 | e47f188b | Break a contract for a better job | 6 | 55 | scores, order swapped |  |
| 76 | 07de73ba | Unused theatre reservation | - | 57 | scores, order swapped, labels | dated: phone reservation |
| 77 | c4e373c3 | The Payphone Return | 1 | 65 | scores, labels | dated: payphone |
| 78 | d3da9878 | The Sidewalk Wallet | 1 | 55 | scores, labels |  |
| 79 | 61dc3315 | Software piracy swap | - | 74 | scores, labels |  |
| 80 | 4af65dec | The Blank Receipt | 1 | 55 | scores, order swapped, labels | dated: blank taxi receipt |
| 81 | 0c022bb5 | The borrowed out-of-print book | - | 53 | scores |  |
| 82 | f4976955 | French essay, translated | - | 65 | scores, order swapped | dated: typist |
| 83 | 545a42b2 | The dropped lamb chop | 6 | 73 | scores |  |
| 84 | 4305b9ab | Friend cuts the movie line | - | 54 | scores, order swapped |  |
| 85 | e23fad83 | One seatbelt short | - | 54 | scores |  |
| 86 | 10cd26d1 | Roommate's unreachable vacation | - | 53 | scores, order swapped |  |
| 87 | 81df8a8d | The plagiarizing mentee | 2 | 67 | scores, labels |  |
| 88 | 8db2cafd | Interview questions for a friend | 2 | 63 | scores |  |
| 89 | e97da5bb | The Long-Distance Line | 1 | 60 | scores, order swapped, labels | dated: long-distance billing |
| 90 | d336825f | The endorsement deal | 6 | 61 | scores |  |
| 91 | c1ac36f1 | Coworker takes the credit | 6 | 71 | scores, order swapped |  |
| 92 | 60864a78 | Neighbor's medication | - | 60 | scores |  |
| 93 | 93c532c1 | The Witness | 2 | 57 | scores |  |
| 94 | ff8527c4 | The Missed Bag | 1 | 50 | scores, order swapped |  |
| 95 | d7dfb681 | Child who watched bullying | - | 56 | scores, order swapped |  |
| 96 | b853f89f | Coworker's rounded timesheet | 6 | 52 | scores, order swapped, labels |  |
| 97 | bcfbd7da | Monthly charity commitment | - | 55 | scores |  |
| 98 | 73af8e36 | The Uncollected Increase | 1 | 59 | scores |  |
| 99 | 2540494f | Fake five-star review | - | 59 | scores, order swapped, labels |  |
| 100 | 97fae80a | Wedding vs one-time audition | - | 57 | scores |  |
| 101 | 9db2d6fc | Overheard layoff list | 2 | 63 | scores, order swapped |  |
| 102 | 0b43b5f1 | Teammate who did less | 6 | 69 | scores |  |
| 103 | 0b5cc0e8 | Family secret from a sibling | 2 | 70 | scores, order swapped |  |
| 104 | c6a99a59 | Friend's false post | - | 54 | scores |  |
| 105 | 2a22b76a | The Self-Checkout Glitch | 1 | 54 | scores, labels |  |
| 106 | 34ee6dc1 | Reference for a chronically late friend | 2 | 58 | scores, order swapped |  |
| 107 | 7879c0f9 | Flaw found before launch | 6 | 59 | scores |  |
| 108 | e60be3e6 | Overcharging caretaker | - | 69 | scores |  |
| 109 | 50f4d3be | Full comp for a small mistake | - | 67 | scores, labels |  |
| 110 | ca786f0f | Friend's flawed startup | - | 64 | scores, order swapped |  |
| 111 | d722d572 | Toddler near the street | - | 58 | scores |  |
| 112 | c5fb2dac | Misdirected pay-gap email | 6 | 60 | scores, order swapped |  |
| 113 | 68e8dcb7 | Parent's car keys | 2 | 66 | scores |  |
| 114 | 44983ecd | Unlocked stranger's phone | - | 68 | scores, order swapped |  |
| 115 | 5b1f90c3 | Resume gap: mental-health leave | 6 | 66 | scores, order swapped, labels |  |

## Open decisions

1. Chapter 1 still holds four dated items (payphone, blank taxi receipt, paper credit slip, long-distance billing). Swap them for unused everyday dilemmas (e.g. #58 parking scrape, #61 recovered bike, #64 hidden raise, #66 benefits certification)?
2. Approve the five proposed topics for the non-historical new dilemmas (pandemic lockdown, self-driving car, deepfake, facial recognition, ventilator triage).
3. Chapter order in the PDF is my proposal: everyday, society, tech, medicine, work, power, philosophy, then the two history chapters.
