// Bias metrics for the dilemma pool (TASK-370, TASK-228, TASK-372). Read-only; no dependencies.
//
//   node book/catalog/pool-metrics.mjs [path/to/dilemmas.json]
//
// Prints: answer-position tilt, dominance, dimension correlation, and how a session of five random dilemmas
// maps to archetypes under different answering policies (nearest-centroid, exactly like archetype_engine.py).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const file = process.argv[2] || resolve(repo, "backend/data/dilemmas_en.json");
const pool = JSON.parse(readFileSync(file, "utf8"));
const arch = JSON.parse(readFileSync(resolve(repo, "backend/data/archetypes.json"), "utf8"));
const D = ["Empathy", "Integrity", "Responsibility", "Justice", "Altruism", "Honesty"];
const vec = (d, p) => D.map((k) => d[`${p}Answer${k}`]);
const sum = (v) => v.reduce((a, b) => a + b, 0);
const mean = (v) => sum(v) / v.length;
const A = pool.map((d) => vec(d, "first")), B = pool.map((d) => vec(d, "second"));
const diffs = A.map((a, i) => a.map((v, j) => v - B[i][j]));
const n = pool.length;

console.log(`dilemmas: ${n}`);
console.log(`first answer has the higher total: ${A.filter((a, i) => sum(a) > sum(B[i])).length}, second: ${A.filter((a, i) => sum(a) < sum(B[i])).length}`);
console.log(`mean total first/second: ${mean(A.map(sum)).toFixed(2)} / ${mean(B.map(sum)).toFixed(2)}; mean |total gap|: ${mean(A.map((a, i) => Math.abs(sum(a) - sum(B[i])))).toFixed(2)}`);
const dominated = diffs.filter((d) => (d.every((v) => v >= -1e-9) || d.every((v) => v <= 1e-9)) && d.some((v) => Math.abs(v) > 1e-9)).length;
console.log(`one answer at least as high on every dimension: ${dominated}`);
const noLead = diffs.map((d, i) => [d.filter((v) => v >= 0.15).length, d.filter((v) => v <= -0.15).length, i + 1]).filter(([u, l]) => u === 0 || l === 0).map((r) => r[2]);
console.log(`an answer never leads by >= 0.15 on any dimension: ${noLead.length} (#${noLead.join(", ")})`);

const corr = (u, v) => { const mu = mean(u), mv = mean(v); let c = 0, du = 0, dv = 0; u.forEach((_, i) => { c += (u[i] - mu) * (v[i] - mv); du += (u[i] - mu) ** 2; dv += (v[i] - mv) ** 2; }); return c / Math.sqrt(du * dv); };
const col = (j) => diffs.map((d) => d[j]);
console.log("correlation of answer differences:");
[[1, 3], [1, 5], [3, 5], [0, 4], [2, 3]].forEach(([a, b]) => console.log(`  ${D[a]} ~ ${D[b]}: ${corr(col(a), col(b)).toFixed(2)}`));

const cent = arch.archetypes.map((a) => ({ id: a.id, c: arch.dimensions.map((d) => a.centroid[d]) }));
const near = (avg) => cent.reduce((best, a) => { const d = sum(a.c.map((c, j) => (c - avg[j]) ** 2)); return d < best.d || (d === best.d && a.id < best.id) ? { id: a.id, d } : best; }, { id: "", d: 1e9 }).id;
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const ruleScore = (v) => v[1] + v[3] + v[5]; // Integrity + Justice + Honesty: the "rule-following" side
const policies = {
  random: (i) => (rnd() < 0.5 ? A[i] : B[i]),
  "always first": (i) => A[i],
  "always second": (i) => B[i],
  "rule-follower": (i) => (ruleScore(A[i]) >= ruleScore(B[i]) ? A[i] : B[i]),
  "rule-breaker": (i) => (ruleScore(A[i]) >= ruleScore(B[i]) ? B[i] : A[i]),
};
const N = 20000, K = 5;
const results = {};
for (const [name, pick] of Object.entries(policies)) {
  const counts = {};
  for (let s = 0; s < N; s++) {
    const idx = new Set(); while (idx.size < K) idx.add(Math.floor(rnd() * n));
    const chosen = [...idx].map(pick);
    const avg = D.map((_, j) => Math.round(mean(chosen.map((c) => c[j])) * 100) / 100);
    const id = near(avg); counts[id] = (counts[id] || 0) + 1;
  }
  results[name] = counts;
}
console.log(`\narchetype share (%), ${K} random dilemmas, ${N} sessions per policy`);
const names = Object.keys(policies);
console.log("archetype".padEnd(22) + names.map((p) => p.padStart(15)).join(""));
cent.forEach((a) => console.log(a.id.padEnd(22) + names.map((p) => (100 * (results[p][a.id] || 0) / N).toFixed(1).padStart(15)).join("")));
