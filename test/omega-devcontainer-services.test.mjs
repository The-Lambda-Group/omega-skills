// The omega-devcontainer-services skill (skills/omega-devcontainer-services/SKILL.md): a generic skill about keeping a program running on a web address.
// It lives in a public repository, so it names no worker, repository, workspace or person. A structural test: frontmatter, parent line, nothing private.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const skill = read("skills/omega-devcontainer-services/SKILL.md");
const lines = skill.split("\n");

test("the frontmatter names the skill after its folder and says when to use it, on one line", () => {
  assert.equal(lines[0], "---");
  assert.equal(lines[1], "name: omega-devcontainer-services");
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

test("it carries the three commands, the execution type, the limit of three and its code, and the public warning", () => {
  assert.ok(skill.includes('qo service up web --devcontainer "$DC" --port 8000'));
  assert.ok(skill.includes('qo service status web --devcontainer "$DC"'));
  assert.ok(skill.includes('qo service stop web --devcontainer "$DC"'));
  assert.ok(skill.includes('"executionType": "always-on"'));
  assert.match(skill, /At most \*\*three\*\* always-on Devcontainers per account/);
  assert.match(skill, /HTTP status 429 and an error that starts `always-on-cap`/);
  assert.match(skill, /A service is \*\*public\*\*/);
});

test("it carries the two recipes: a VNC with a password kept in a Volume, and Plex with a pinned checksum", () => {
  assert.ok(skill.includes("-rfbauth"));
  assert.ok(skill.includes("--var VNC_PASSWORD="));
  assert.ok(skill.includes("74e9a71c97e06d6e925cc4398279141fd838ee9df446f90e769614fa2c87a206"));
  assert.ok(skill.includes("--port 32400"));
});

test("it uses --var, not --env, because the CLI's global --env names an environment", () => {
  assert.ok(!/--env\b/.test(skill));
});

test("it points at the skills it builds on", () => {
  for (const s of ["omega-devcontainers", "omega-pod-runs", "omega-long-running-work"]) assert.ok(skill.includes(s), `the skill does not name ${s}`);
});

test("the README list, the README tree and the skills-tree page list it", () => {
  assert.ok(read("README.md").includes("[`skills/omega-devcontainer-services`](skills/omega-devcontainer-services)"));
  assert.ok(read("README.md").includes("**`omega-devcontainer-services`**"));
  assert.ok(read("pages/omega-skills/skills-tree.html").includes("omega-devcontainer-services"));
});
