// The omega-dedicated-pod-work skill (skills/omega-dedicated-pod-work/SKILL.md): a generic skill about running a job on a Run Pod.
// It lives in a public repository, so it names no worker, repository, workspace or person. A structural test: frontmatter, parent line, nothing private.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const skill = read("skills/omega-dedicated-pod-work/SKILL.md");
const lines = skill.split("\n");

test("the frontmatter names the skill after its folder and says when to use it, on one line", () => {
  assert.equal(lines[0], "---");
  assert.equal(lines[1], "name: omega-dedicated-pod-work");
  assert.match(lines[2], /^description: Use when /);
  assert.ok(lines[2].length < 1024);
  assert.equal(lines[3], "---");
});

test("the first body line names the parent skill, as every skill in the tree does", () => {
  assert.equal(lines[5], "**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it");
  assert.equal(lines[6], "first — it establishes how to find your bearings in a workspace — then come back here.");
});

test("it names no worker, repository, workspace or person", () => {
  for (const bad of [/ryan/i, /personal-worker/i, /cas-reels/i, /lambda-?group/i, /3b12bbed/, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/, /github\.com\/[A-Za-z-]+\//]) assert.ok(!bad.test(skill), `the skill matches ${bad}`);
});

test("it carries the three commands, the limit of ten and its error kind, and the Run Lease", () => {
  assert.ok(skill.includes("qo run \"PAGE_PATH\" -p PROTOCOL -m METHOD --args '[]'"));
  assert.ok(skill.includes("qo pod status POD_ID"));
  assert.ok(skill.includes("qo pod stop POD_ID"));
  assert.match(skill, /\*\*ten\*\* Run Pods/);
  assert.match(skill, /HTTP status 429 and the kind `pod-cap`/);
  assert.match(skill, /Every `qo pod status` read renews the lease/);
});

test("it says there is no transcript and results leave as public links", () => {
  assert.match(skill, /It has no Session and no transcript/);
  assert.match(skill, /omega-present-file/);
  assert.match(skill, /public links/);
});

test("it points at the skills it builds on", () => {
  for (const s of ["omega-long-running-work", "omega-present-file", "omega-installing-software"]) assert.ok(skill.includes(s), `the skill does not name ${s}`);
});

test("the README list, the README tree and the skills-tree page list it", () => {
  assert.ok(read("README.md").includes("[`skills/omega-dedicated-pod-work`](skills/omega-dedicated-pod-work)"));
  assert.ok(read("README.md").includes("**`omega-dedicated-pod-work`**"));
  assert.ok(read("pages/omega-skills/skills-tree.html").includes("omega-dedicated-pod-work"));
});
