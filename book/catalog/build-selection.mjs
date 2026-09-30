// Builds book/out/selection-100.pdf: every selected dilemma, split by chapter, for editorial review.
//
//   node book/catalog/build-selection.mjs
//
// Source of truth for the chapter map is book/catalog/plan.json; dilemma text comes straight from
// backend/data/dilemmas_en.json (the same file the book template and the app seed use), so the PDF
// can never drift from the real content. Needs `typst` on PATH. Output goes to book/out/, which is git-ignored.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bookRoot = resolve(here, "..");
const repoRoot = resolve(bookRoot, "..");
const plan = JSON.parse(readFileSync(resolve(here, "plan.json"), "utf8"));
const dilemmas = JSON.parse(readFileSync(resolve(repoRoot, "backend/data/dilemmas_en.json"), "utf8"));

let counter = 0;
const chapters = plan.chapters.map((chapter) => {
  const items = chapter.dilemmas.map((entry, i) => {
    counter += 1;
    const base = { global: counter, position: i + 1 };
    if (entry.n) {
      const d = dilemmas[entry.n - 1];
      if (!d || !d._id.endsWith(entry.idTail)) {
        throw new Error(`plan.json entry #${entry.n} (${entry.idTail}) does not match dilemmas_en.json; the file order changed`);
      }
      return { ...base, kind: "existing", title: entry.title, text: d.dilemma, a: d.firstAnswer, b: d.secondAnswer, meta: `catalog #${entry.n} · id …${entry.idTail}`, flags: entry.flags };
    }
    if (entry.status === "history") {
      return { ...base, kind: "history", title: entry.title, when: entry.when, choice: entry.choice, meta: entry.id };
    }
    return { ...base, kind: "new", title: entry.title, note: entry.note };
  });
  const counts = { existing: 0, history: 0, new: 0 };
  items.forEach((it) => (counts[it.kind] += 1));
  return { number: chapter.number, genre: chapter.genre, intro: chapter.intro, counts, items };
});

const totals = { existing: 0, history: 0, new: 0 };
chapters.forEach((c) => Object.keys(totals).forEach((k) => (totals[k] += c.counts[k])));

const outDir = resolve(bookRoot, "out");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "selection-data.json"), JSON.stringify({ updated: plan.updated, totals, chapters, reserves: plan.reserves, dropped: plan.dropped }, null, 1));
execFileSync("typst", ["compile", "--root", bookRoot, resolve(here, "selection.typ"), resolve(outDir, "selection-100.pdf")], { stdio: "inherit" });
console.log(`selection-100.pdf written: ${totals.existing} existing, ${totals.history} history to write, ${totals.new} other new to write`);
