// The Coordinator's guidelines (skills/omega-dev-coordinate/SKILL.md, skills/omega-dev-machine/SKILL.md): prefer a Dev Machine, follow the user's notes when they say
// not to use special containers, find the records where the README links them, and set the planning goal on the Coordinator's own session. A structural test of the skill text.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const coordinate = read("skills/omega-dev-coordinate/SKILL.md");
const machine = read("skills/omega-dev-machine/SKILL.md");

test("the Dev Machine is a preference, and the user's notes override it", () => {
  assert.match(coordinate, /^## Where the work runs$/m);
  assert.match(coordinate, /Prefer a Dev Machine\. Planning and development are best on a container with a volume/);
  assert.match(coordinate, /If a note says the user will not use\nspecial containers/);
  assert.match(coordinate, /do not invoke\n`omega-dev-machine`/);
  assert.match(coordinate, /A later word from the user overrides the note\./);
});

test("the section on where the work runs comes before step 1", () => {
  assert.ok(coordinate.indexOf("## Where the work runs") < coordinate.indexOf("## 1. Get the Dev Machine"));
});

test("the Dev Machine Record and the Plans Index are found where the README links them", () => {
  assert.match(machine, /`Notes\/Development\/Dev Machine`/);
  assert.match(machine, /use the path\nthe README gives/);
  assert.match(coordinate, /`.root.\/Notes\/Development\/Plans`/);
  assert.match(coordinate, /\*\*Create the page once\*\*, only if `.root.\/Notes\/README` links no `Plans` page/);
});

test("a workspace with no record is offered a default personal devcontainer with a volume", () => {
  assert.match(machine, /Planning and development work best on a personal devcontainer with a\n   volume/);
  assert.match(machine, /I can set one up for you as your default — shall I\?/);
});

test("the Coordinator sets the planning goal on her own session through agent_goal, once per new plan", () => {
  assert.match(coordinate, /^## The planning goal$/m);
  assert.match(coordinate, /Call `agent_list_sessions` with `limit` 10\. For each row, call `agent_turn_status` with the row's `session-id`/);
  assert.match(coordinate, /whose answer is `running`, call `agent_get_messages` with that `session_id` and `limit` 100/);
  assert.match(coordinate, /a `user` message has exactly the text of the\n   user's message you are answering/);
  assert.match(coordinate, /Call `agent_goal` with that `session_id`, `continues` 3 and this `text`/);
  assert.match(coordinate, /until a review returns No defects or three rounds have run/);
  assert.match(coordinate, /End with State: done when the loop has ended, State: waiting-on when you need the user\./);
  assert.match(coordinate, /A Dev Subagent never sets a goal\./);
  assert.ok(coordinate.indexOf("## The planning goal") < coordinate.indexOf("## 3. Dispatch a Dev Subagent"));
});

test("neither skill names a person, a workspace id or a worker of one user", () => {
  for (const bad of [/ryan/i, /personal-worker/i, /3b12bbed/, /ca8d798a/]) {
    assert.ok(!bad.test(coordinate), `omega-dev-coordinate matches ${bad}`);
    assert.ok(!bad.test(machine), `omega-dev-machine matches ${bad}`);
  }
});
