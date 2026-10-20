// The omega-working-with-images skill (skills/omega-working-with-images/SKILL.md): a generic Cas skill about the harness's image limit.
// It lives in a public repository, so it names no worker, repository, workspace or person. A structural test: frontmatter, parent line, nothing private.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const skill = read("skills/omega-working-with-images/SKILL.md");
const lines = skill.split("\n");

test("the frontmatter names the skill after its folder and says when to use it, on one line", () => {
  assert.equal(lines[0], "---");
  assert.equal(lines[1], "name: omega-working-with-images");
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

test("it states the 30 MB limit, its status and text, and that the limit counts bytes", () => {
  assert.match(skill, /30 MB/);
  assert.match(skill, /HTTP status 413/);
  assert.match(skill, /Downloaded image content cannot exceed 30MB/);
  assert.match(skill, /counts bytes, not tokens/);
});

test("it carries the two ffmpeg commands exactly", () => {
  assert.ok(skill.includes("ffmpeg -loglevel error -y -i frame.png -vf scale=640:-1 -q:v 5 frame-640.jpg"));
  assert.ok(skill.includes("ffmpeg -loglevel error -y -pattern_type glob -i 'frames/*.png' -vf \"scale=320:-1,tile=3x2\" -frames:v 1 -q:v 5 sheet.jpg"));
});

test("it says images leave a Session when it is compacted", () => {
  assert.match(skill, /Images leave your Session only when it is compacted/);
});

test("the README list, the README tree and the skills-tree page list it", () => {
  assert.ok(read("README.md").includes("[`skills/omega-working-with-images`](skills/omega-working-with-images)"));
  assert.ok(read("README.md").includes("**`omega-working-with-images`**"));
  assert.ok(read("pages/omega-skills/skills-tree.html").includes("omega-working-with-images"));
});
