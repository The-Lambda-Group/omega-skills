// Each omega-dev-* phase skill names the session goal Cas holds in that phase (omega-dev-coordinate "The session goal"), and she reads her own
// session id from her system prompt instead of searching. A structural test of the skill text (omega:testing: a skill test is a `node --test` case).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const skill = (name) => read(`skills/${name}/SKILL.md`);
const coordinator = (name) => skill(name).split("## Coordinator")[1].split("## Dev Subagent")[0];

test("she reads her own session id from her system prompt before searching", () => {
  const text = skill("omega-dev-coordinate");
  assert.match(text, /Your system prompt carries the line `This session's id is` followed by your session id, on every turn/);
  assert.ok(text.indexOf("This session's id is` followed by your session id") < text.indexOf("Call `agent_list_sessions` with `limit` 10"));
});

test("brainstorm, plan and revise name the Revise Goal; develop names the Development Goal", () => {
  assert.match(coordinator("omega-dev-brainstorm"), /Your session goal is the Revise Goal for this whole job/);
  assert.match(coordinator("omega-dev-plan"), /Your session goal is the Revise Goal:/);
  assert.match(coordinator("omega-dev-revise"), /This skill is the loop the Revise Goal names\./);
  assert.match(coordinator("omega-dev-develop"), /Your session goal is the Development Goal:/);
});

test("each phase skill tells her to read the goal and set it when empty", () => {
  for (const name of ["omega-dev-brainstorm", "omega-dev-plan", "omega-dev-revise", "omega-dev-develop"]) {
    const text = coordinator(name);
    assert.match(text, /Read it with `agent_goal` and your own `session_id`/, name);
    assert.match(text, /when its `text` is empty, set it now as `omega-dev-coordinate` "The session goal" says/, name);
  }
});

test("the retro clears the goal and revise leaves a Development Goal alone", () => {
  assert.match(coordinator("omega-dev-retro"), /4\. Clear your session goal: call `agent_goal` with your own `session_id` and `clear` true\./);
  assert.match(coordinator("omega-dev-revise"), /your goal is the Development Goal and stays it/);
});

test("the Phase Goal Term is defined", () => {
  assert.match(read("pages/omega-skills/terms.html"), /<dt>Phase Goal<\/dt>/);
});

test("a public repository read-only job skips the GitHub sign-in", () => {
  const text = skill("omega-repo-work");
  assert.match(text, /When the job's notes say the repository is public and the job only reads it \(an explore, a spec, a plan\), skip this step/);
  assert.ok(text.indexOf("skip this step") < text.indexOf("Follow `omega-devcontainers`"));
});
