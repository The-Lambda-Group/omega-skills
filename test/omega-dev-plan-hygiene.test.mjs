// The plan a Dev Subagent writes is checked for placeholders with three exact commands, in the Write part and the Review part
// (skills/omega-dev-plan/SKILL.md). A structural test of the skill text, and a run of the commands on files written here.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const plan = read("skills/omega-dev-plan/SKILL.md");
const fence = plan.slice(plan.indexOf("   ```bash\n   grep -nP"), plan.indexOf("   ```\n", plan.indexOf("   ```bash\n   grep -nP") + 10));
const commands = fence.split("\n").filter((l) => l.startsWith("   grep ")).map((l) => l.trim());

test("the plan template has a Skills Invoked section between Rules and Tasks", () => {
  assert.match(plan, /   ## Rules\n   ## Skills Invoked\n   ## Tasks\n/);
});

test("the Write part runs three placeholder commands on the plan file", () => {
  assert.equal(commands.length, 3);
  for (const c of commands) assert.match(c, /"\$PLAN"$/);
  assert.match(plan, /run these three\n   commands; each must print nothing\./);
});

test("the Review part runs the same commands and reports the number of ledger lines", () => {
  assert.match(plan, /Run the three placeholder commands of the "Write the plan" part, step 3, on the plan file; every\n   line they print, except an HTML tag, is a defect\./);
  assert.match(plan, /report the number as `A-lines: N`\./);
});

test("the Coordinator compares the ledger lines with the defects, and only part Revise repairs one", () => {
  assert.match(plan, /After a round that\n   reported D defects, the next review must report an `A-lines` at least D higher than the one\n   before/);
  assert.match(plan, /Only part "Revise" of `omega-dev-revise` repairs\n   a defect: not the review job, not "Write the plan", not you\./);
});

const run = (body, command) => {
  const dir = mkdtempSync(join(tmpdir(), "plan-hygiene-"));
  const file = join(dir, "plan.md");
  writeFileSync(file, body);
  return spawnSync("bash", ["-c", command], { env: { ...process.env, PLAN: file, LC_ALL: "C.UTF-8" }, encoding: "utf8" });
};

test("each command prints the line it exists to catch, and nothing for a clean plan", () => {
  const dirty = [
    "clean line\n// Every skills/" + "<" + "folder>/SKILL.md must match\n",
    "clean line\nnew URL(" + ".".repeat(3) + ", import.meta.url)\n",
    "clean line\nleft as a T" + "BD here\n",
  ];
  dirty.forEach((body, i) => {
    const r = run(body, commands[i]);
    assert.equal(r.status, 0, `command ${i + 1} found nothing in ${JSON.stringify(body)}`);
    assert.match(r.stdout, /^2:/);
  });
  const clean = "clean line\nuse ${TOPIC} and `<div>` is fine to read\nnew URL(path, import.meta.url)\n";
  commands.forEach((c, i) => assert.equal(run(clean.replace("`<div>` is fine to read", "no tag"), c).status, 1, `command ${i + 1} printed on a clean plan`));
});

test("the ledger line count is a command that counts only A. lines at the start of a line", () => {
  const r = run("A.1 — [2026-10-30 09:00] x\nU.1 — [2026-10-30 09:00] y\n  A.2 not at the start\nA.2 — [2026-10-30 09:01] z\n", "grep -c '^A\\.[0-9]' \"$PLAN\"");
  assert.equal(r.stdout.trim(), "2");
});
