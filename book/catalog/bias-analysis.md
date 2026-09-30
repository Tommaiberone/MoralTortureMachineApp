# Bias analysis of the dilemma pool (2026-09-30)

Scope: the 115 English dilemmas in `backend/data/dilemmas_en.json`, how the app presents and scores them, and how
that turns a player's five answers into an archetype. Tracked in TASK-370 (fixes to the data), TASK-371 (rollout to
production) and TASK-372 (archetype calibration); it also re-measures the dimension correlation asked for by TASK-228.
Numbers come from `node book/catalog/pool-metrics.mjs` (before = the file at commit `d6f1ba8`, after = the file with the
TASK-370 changes).

## Headline

The hypothesis "it is too easy to play the hero" is true and is worse than it looks: the heroic answer was the *first*
one in 81% of dilemmas, it scored higher on all six dimensions at once in 32, and the app always renders the first
answer in the same place. A player who taps the left button every time became "The Moral Idealist" or "The Duty-Bearer"
78% of the time without reading a single dilemma. The same tilt makes the other answer a punishment: tapping the
right button every time gave "The Cautious Survivor" 42% of the time.

## What was measured

| Measure | Before | After |
|---|---|---|
| First answer has the higher total score | 93 of 115 (81%) | 54 of 115 (47%) |
| Heroic answer is shown first | 93 of 115 | 58 of 115 (50%; 5 of 10 in six chapters) |
| Mean total of first / second answer | 4.03 / 2.88 | 3.47 / 3.51 |
| Mean absolute gap between the two totals | 1.53 | 0.71 |
| One answer at least as high on every dimension | 35 | 25 (all temptations) |
| Dilemmas where an answer never leads on any dimension | 53 | 26 (all temptations, see 3) |
| Correlation of answer differences, Integrity ~ Justice | 0.84 | 0.73 |
| Integrity ~ Honesty | 0.84 | 0.83 |
| Justice ~ Honesty | 0.67 | 0.64 |
| Empathy ~ Altruism | 0.55 | 0.45 |
| Random answers, share of the most common archetype | 44% | 54% (see 5) |
| Always tapping the first answer, share of the most common archetype | 54% | 56% (same as random: position no longer matters) |

Archetype shares are for sessions of five random dilemmas (the Solo Evaluation length, TASK-203), 20,000 sessions per
policy, nearest-centroid matching exactly as `backend/src/archetype_engine.py`. "Rule-follower" picks the answer with
the higher Integrity + Justice + Honesty, "rule-breaker" the lower.

## The biases

### 1. Position: the heroic answer is on the left (fixed in data)

Evidence: 93 of 115 first answers are the higher-scoring one. On average the first answer scored Integrity 0.73 against
0.52, Responsibility 0.71 against 0.46, Justice 0.65 against 0.43, Altruism 0.57 against 0.40, Honesty 0.77 against
0.52. No screen shuffles the answers (Evaluation, Challenge, Daily, Party Room and the book chapters all render
`firstAnswer` then `secondAnswer`), and the vote is recorded as "yes"/"no" for first/second, so the layout, the
crowd chart and the score all carry the same tilt. Primacy alone would already push a share of players to the first
option; here the first option was also the flattering one.

Fix: counterbalance in the data. The heroic answer is now first in 58 of 115 dilemmas, and five of ten in every full
chapter of the book. Doing it in the data rather than shuffling in the UI keeps the printed book, the Party Room
tally and the Daily dilemma identical for everyone; a shuffle per screen would have needed a different rule in each
place. 35 dilemmas had their two answers swapped (text, teasers and all twelve scores move together).
The consequence for production is in TASK-371: stored `yesCount`/`noCount` must be swapped too.

### 2. Level: the heroic answer is high on everything (fixed in data)

In most dilemmas the "good" answer scored 0.8-1.0 on all six dimensions and the other answer 0.1-0.4 on all six. A
dimension the scenario does not touch (for example Altruism in a lost-wallet dilemma) was still pushed to 0.15 for the
tempting answer. That means the score measures "how good is the answer", not "what does the choice express".

Fix, two rules, both sign-preserving (nothing that used to favour an answer on a dimension now favours the other):
- Conflicts (real value against value): rebalance each dilemma so neither answer has a higher total, by shrinking the
  dimensions where the heroic answer led and widening those where the other led. 40 were rebalanced this way, 33 more by hand (3).
- Temptations (self-interest against an obvious duty, 27 dilemmas): dimensions the scenario does not engage are 0.5 on
  both answers, so a tempting answer no longer reads as "low empathy, low altruism" for keeping a pen.

### 3. No trade-off: 53 dilemmas where one answer wins everywhere (mostly fixed)

In 53 dilemmas one answer never led on any dimension by 0.15 or more, so the choice carried no information beyond
"hero or not". 24 of them are temptations (found money, receipts, a padded invoice) and are by design one-sided;
the other 29 were real conflicts scored as if they were not. I rewrote 33 conflict profiles by hand (those 29 plus four
with only a thin lead) so each answer leads by at least 0.2 on a dimension it actually expresses (for example: keeping a promise leads on Integrity, taking
the opportunity on Responsibility to your own future). 26 temptations remain one-sided; they are marked, and
chapter 1 is entirely made of them (see 9).

### 4. Dimension collapse: six dimensions are about three (only partly fixed)

Integrity, Justice and Honesty differences correlate at 0.84, 0.84 and 0.67; the first principal component explains
55% of the variance of the differences (53% after). A player who is "high on Honesty" is almost always "high on
Integrity and Justice", so the radar chart cannot tell them apart. This confirms TASK-228. The rebalancing removed the
level artefact but could not decorrelate the dimensions, because that needs dilemmas where they genuinely pull apart:
a lie told for fairness, a rule broken out of honesty, a truth that is unjust. The historical batch is the natural place;
each new dilemma should be checked with `pool-metrics.mjs`, and TASK-228 stays open for that.

### 5. The archetype engine amplifies all of this (not fixed, TASK-372)

Averaging five answers regresses every player to the middle of the pool (pool mean about 0.58, session sd about 0.10),
and the 14 centroids sit on a 0.2 / 0.5 / 0.85 grid that is far wider than that cloud. The centroid nearest the middle,
"The Duty-Bearer", wins most sessions whatever the player does:

| Policy | Before: top archetypes | After: top archetypes |
|---|---|---|
| Random answers | Duty-Bearer 44%, Cautious Survivor 12%, Reluctant Hero 10% | Duty-Bearer 54%, Reluctant Hero 14%, Devoted Protector 10% |
| Rule-follower (higher Integrity + Justice + Honesty) | Duty-Bearer 50%, Moral Idealist 28%, Impartial Judge 22% | Duty-Bearer 53%, Impartial Judge 44%, Moral Idealist 2% |
| Rule-breaker (the lower one) | Cautious Survivor 28%, Loyal Insider 27%, Devoted Protector 21%, Bleak Nihilist 10% | Devoted Protector 48%, Noble Liar 24%, Loyal Insider 21% |
| Always second answer | Cautious Survivor 42%, Duty-Bearer 18%, Detached Analyst 11% | Duty-Bearer 53%, Reluctant Hero 17%, Devoted Protector 8% |

Two things improved: breaking the rules no longer lands on the shaming archetypes (Cautious Survivor and Bleak Nihilist
fell from 38% combined to under 1% for the rule-breaker), and following them no longer produces the Moral Idealist by default.
Two things did not: the Duty-Bearer share went up (44% to 54%) because the pool is now more balanced, and "The Tragic
Absolutist" and "The Honest Opportunist" are still unreachable (0%).

An experiment (not applied) recentres each session vector on the pool mean and amplifies it by 2.5 before matching. It
brought random answers to noble liar 16%, impartial judge 14%, duty-bearer 13% with only two archetypes under 1%. That is
an engine change, so it needs a version bump (ADR-025) and belongs to TASK-372 together with the decision on
`archetypesVersion`. Do not roll the corrected scores to production before that, or one archetype will cover half the players.

### 6. Loaded answer labels (fixed, 22 dilemmas)

The option the author expects the player to reject was often written in pejorative verbs: "pocket", "inflate",
"fake", "cover story", "betray", "let the program continue", "free brake pads". Some pairs mixed framings: "Accept the deal
and betray the twelve" against "Refuse the deal and remain loyal"; "Report the theft and restore the funds" against
"Conceal the theft and protect my friend" (an outcome against an action). Both answers now use neutral, parallel wording
and, where useful, name what each protects. The list is the `labels` rows in `selection.md`.

### 7. Action against omission is confounded with virtue (not fixed)

63 second answers are phrased as refusing, staying silent or keeping something, against 11 first answers; after the
swap it is 51 against 23. Position no longer predicts it, but the virtuous answer is still usually the active one
(report, return, tell) and the vice the passive one. A player can score well by always acting. The new dilemmas should
include cases where the admirable option is restraint (Petrov not reporting an attack is one), and the historical batch
was chosen with that in mind.

### 8. Social desirability is a product effect, not a data effect

The loop is "share, compare, rematch", so players answer for an audience. Even with balanced data, a player who wants
to look good will pick the answer that looks good, and the archetype names amplify it: several read as insults
(Bleak Nihilist, Cautious Survivor). Not a data fix; options: name all fourteen as respectable styles, show the result
before the crowd chart, and keep the funnier "dark" copy for the tease rather than the archetype. Filed under TASK-372.

### 9. Composition: one situation over-represented

- 70 of 115 dilemmas are everyday; 18 use a "nobody will ever know" frame, six of the ten in Case File 1 (found
  money, self-checkout change, receipts). That measures one situational trait, honesty when unobserved, and it has a
  ceiling effect because the answer is obvious.
- 55 stems contain minimising words ("just", "only", "small", "nobody will miss it") that pre-argue the tempting answer.
  This is a legitimate device in a temptation; it becomes a bias only when only one side gets a plea. Reviewers should
  check each stem gives both answers a defensible cost.
- Genre: a random five-dilemma session draws about three everyday items, so short tests are mostly petty honesty.
  Weighted sampling by genre per session would fix that; it is a backend change and is not part of this task.

### 10. Coverage: what the six dimensions cannot see

There is no Loyalty, Autonomy, Care-versus-harm or Authority dimension. Loyalty is therefore only visible as low
Justice and low Honesty (hence the "Loyal Insider" and "Noble Liar" archetypes are defined by what they lack). The 44
extreme dilemmas are nearly all the same conflict, maximise outcomes against respect for persons; virtue and care
ethics are barely represented. Not fixable by rescoring; new content and, later, possibly a seventh dimension.

### 11. Context and representation (observations, not measured proof)

- Anglo-American frame: dollars (9 dilemmas), tipping, mortgages, benefits certification, HR, insurers, a DUI, "the
  ER". The book is global (ADR-153); institutions are assumed to work fairly (police, HR, insurers).
- Roles: in the stems that use gendered terms, women are mostly the person who needs protecting or does the
  service work (waitress, nurse, typist, neighbour, the woman screaming, the host's mother) and men mostly the person
  who did wrong or holds authority (the drunk driver, the taxi driver, the cook, the lawyer, the prisoner). Counts are
  even (14 stems each) but the pattern is not. Worth a pass during the written review of each chapter.
- The protagonist is nearly always the potential wrongdoer; the case where *you* are the one wronged (and must decide
  whether to forgive, report or let it go) is almost absent.

### 12. Checked and found fine

- Teaser copy: in the 19 temptations the teaser for the heroic answer is 154 characters on average, for the other 158,
  and both are written in the same sardonic register, so the teaser does not lean on the player.
- Score granularity and range are fine (0.05-1.0 in steps of 0.05, no clustering at the extremes beyond the heroic tilt).
- Compatibility between two players uses dimension averages, not answer order, so swapping answers cannot break a duel.
- The answer buttons use blue and amber tokens (`--choice-a`, `--choice-b`). The crowd chart after a vote is the exception in two screens (Challenge and the book chapter entry): it colours the first answer dark red and the second dark green, a good/bad connotation the data no longer justifies (TASK-373).

## What changed in `dilemmas_en.json`

| Change | Dilemmas |
|---|---|
| Scores rebalanced automatically (conflicts) | 40 |
| Scores rewritten by hand (conflicts that were one-sided) | 33 |
| Unengaged dimensions neutralised (temptations) | 27 |
| Answer labels rewritten | 22 |
| Answers swapped (text, teasers and scores together) | 35 |
| Unchanged | 11 (#6, 17, 25, 27, 29, 37, 38, 52, 56, 65, 72) |

`_id`s, dilemma stems, teasers, key set and file formatting (4-space indent, CRLF, `1.0` style floats) are unchanged; 115
dilemmas, all weights within 0.05-1.0. The Italian file has 17 dilemmas, is unreachable in the app since TASK-101 and
was not touched, so its answer order and scores now differ from the English file for those 17. `dilemmas_it.json` is
also the file whose hash triggers a repopulation in Terraform, so leaving it alone was deliberate.

Nothing reaches players yet: the file is only read when the DynamoDB table is repopulated, which needs a
`[populate-db]` commit marker or a manual workflow run (TASK-371).

## Open items

1. TASK-371: update path that swaps `yesCount`/`noCount` with the answers; `archetypesVersion` decision.
2. TASK-372: recentre/amplify or re-derive centroids, so no archetype exceeds 20% under random answers; rename the
   archetypes that sound like insults; unreachable archetypes.
3. TASK-228: decorrelate Integrity, Justice and Honesty with new dilemmas; re-run `pool-metrics.mjs` on every new batch.
4. New dilemmas: at least a third where the admirable answer is restraint or the passive one; first answer heroic about half
   the time; each answer leads by 0.2 on a dimension it really expresses.
5. Review the written stems for one-sided pleas and for the role pattern in 11, chapter by chapter, together.
