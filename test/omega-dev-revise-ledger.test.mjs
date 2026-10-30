// A defect found by a review always gets its ledger line, made by part "Revise" (skills/omega-dev-revise/SKILL.md).
// A structural test of the skill text.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const revise = read("skills/omega-dev-revise/SKILL.md");
const readme = read("README.md");

test("a defect a review reports always gets its line, even for a one-word fix", () => {
  assert.match(revise, /A defect a review reports is such a correction: it always gets its line, even when the fix is one\n   word, and the fix is made by part "Revise", never by the review\./);
});

test("the ledger line format is unchanged", () => {
  assert.match(revise, /`A\.N — \[YYYY-MM-DD HH:MM\] /);
});

test("the README says what the three skills now guarantee", () => {
  assert.match(readme, /omega-dev-brainstorm\) — from an idea to an approved spec, with two or three approaches and the chosen one recorded in it\./);
  assert.match(readme, /omega-dev-plan\) — from an approved spec to a plan that has passed a placeholder check and a review loop\./);
  assert.match(readme, /omega-dev-revise\) — ledgered, in-place changes to a spec or plan; every review defect gets its ledger line\./);
});
