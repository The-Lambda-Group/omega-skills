// The Coordinator's guidelines (skills/omega-dev-coordinate/SKILL.md, skills/omega-dev-machine/SKILL.md): prefer a Dev Machine, follow the user's notes when they say
// not to use special containers, find the records where the README links them, and set the session goal (revise or development) on the Coordinator's own session. A structural test of the skill text.
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
  assert.match(coordinate, /do not offer to, and dispatch no Dev Subagent/);
  assert.match(coordinate, /end your reply with `State: waiting-on`/);
});

test("the section on where the work runs comes before step 1", () => {
  assert.ok(coordinate.indexOf("## Where the work runs") < coordinate.indexOf("## 1. Get the Dev Machine"));
});

test("the Dev Machine Record and the Plans Index are found where the README links them", () => {
  assert.match(machine, /`Notes\/Development\/Dev Machine`/);
  assert.match(machine, /use the path\nthe README gives/);
  assert.match(machine, /`ls` each folder the README links under\n`Notes`/);
  assert.match(coordinate, /`.root.\/Notes\/Development\/Plans`/);
  assert.match(coordinate, /\*\*Create the page once\*\*, only if `.root.\/Notes\/README` links no `Plans` page/);
});

test("a workspace with no record gets a basic default: a worker, a Volume and a devcontainer, with no question", () => {
  assert.match(machine, /4\. \*\*None:\*\* in a workspace other than Home, follow the `Dev Machine` link in Home's `Notes\/README`/);
  assert.match(machine, /If Home links none, or this is Home, go to step 5\./);
  assert.match(machine, /nobody else is asked\./);
  assert.ok(!/shall I\?/.test(machine), "the skill still asks before setting one up");
  assert.match(machine, /`block_volume_create` with `page` `<root>\/Resources\/Containers`, `name`\n   `dev-machine-work`/);
  assert.match(machine, /`block_devcontainer_create` with `page` `<root>\/Resources\/Containers`, `name`\n   `dev-machine`/);
  assert.match(machine, /`block_service_account_create` with `page` `<root>\/Resources\/Containers`, `name`\n   `dev-machine-worker`/);
});

test("a default record is written at Notes/Development/Dev Machine, the path the user's own record uses", () => {
  assert.match(machine, /`add_page` with `parent_path` `<root>\/Notes\/Development` and name `Dev Machine`/);
  assert.match(machine, /`set_html` on `<root>\/Notes\/Development\/Dev Machine`/);
  assert.match(machine, /<strong>Notes\/Development\/Dev Machine<\/strong>/);
  assert.ok(!/Notes\/Dev Machine/.test(machine), "the skill still names the old path Notes/Dev Machine");
});

const goalText = (mode) => {
  const line = coordinate.split("\n").findIndex((l) => l.startsWith(`2. **${mode} mode.**`) || l.startsWith(`3. **${mode} mode.**`));
  assert.ok(line >= 0, `no ${mode} mode step`);
  const after = coordinate.split("\n").slice(line);
  const text = after.find((l) => /^   `[^`]+`$/.test(l));
  assert.ok(text, `no ${mode} goal text`);
  return text.trim().slice(1, -1);
};

test("the Coordinator holds exactly one of two goals on her own session, set through agent_goal", () => {
  assert.match(coordinate, /^## The session goal$/m);
  assert.doesNotMatch(coordinate, /^## The planning goal$/m);
  assert.match(coordinate, /You are always in exactly one of two modes, and your own session's goal says which\./);
  assert.match(coordinate, /Call `agent_list_sessions` with `limit` 10\. For each row, call `agent_turn_status` with the row's `session-id`/);
  assert.match(coordinate, /whose answer is `running`, call `agent_get_messages` with that `session_id` and `limit` 100/);
  assert.match(coordinate, /a `user` message has exactly the text of the\n   user's message you are answering/);
  assert.match(coordinate, /Call `agent_goal` with that\n   `session_id`, `continues` 3 and this `text`:/);
  assert.match(coordinate, /`continues` 3 and this `text`, which replaces the Revise Goal:/);
  assert.match(coordinate, /A Dev Subagent never sets a goal\./);
  assert.match(coordinate, /I could not find my own session,\n   so I have not set a goal\./);
  assert.match(coordinate, /its `text` must equal what you sent/);
  assert.match(coordinate, /call `agent_goal` with `clear` true\./);
  assert.ok(coordinate.indexOf("## The session goal") < coordinate.indexOf("## 3. Dispatch a Dev Subagent"));
});

test("the Revise Goal is the commander kit's default.txt loop, worded for omega-dev-revise", () => {
  const g = goalText("Revise");
  assert.match(g, /^Use omega-dev-revise to revise this plan on a loop until you've figured it out exactly\. No placeholders/);
  assert.match(g, /No development, just plan, but you may run read-only probes and experiments to find out what you are unsure about, and cite what they showed\./);
  assert.match(g, /Include all docs and skills update tasks\./);
  assert.match(g, /written exactly as we will attempt them\. End with State: done when the plan is exact\.$/);
  assert.ok(!g.includes("/goal") && !g.includes("/revise"), "a slash command is left in the goal text");
});

test("the Development Goal is the commander kit's develop.txt loop, worded for omega-dev-develop", () => {
  const g = goalText("Development");
  assert.match(g, /^omega-dev-develop, omega-dev-revise and omega-dev-develop-surface loop until your tests are comprehensive, or the plan has to change in a scope-changing way/);
  assert.match(g, /Read the skill gates and the plan before starting\. End with State: done when the tests are comprehensive\.$/);
  assert.ok(!g.includes("/goal") && !g.includes("/develop"), "a slash command is left in the goal text");
});

test("the Revise and Development modes are chosen by what the user asks and the Plans Index Status", () => {
  assert.match(coordinate, /\*\*Revise mode\.\*\* The user asks you to brainstorm, design or plan a change/);
  assert.match(coordinate, /\*\*Development mode\.\*\* The user tells you to develop a plan whose Plans Index row has Status `planned` or `developing`\./);
  assert.match(coordinate, /it picks the one goal you set, and you never set the other first\./);
  assert.match(coordinate, /A plan whose Status is `brainstorming` or `spec` is still being planned: Revise mode\./);
  assert.match(coordinate, /Change mode with step 2 or 3 again whenever the work moves between planning and developing/);
});

test("a workspace other than Home with no record and no candidate of its own uses the Home record, and its own record wins", () => {
  assert.match(machine, /this workspace's own record, once it has one, always wins\./);
  assert.ok(machine.indexOf("1. **Look in your notes.**") < machine.indexOf("follow the `Dev Machine` link in Home's `Notes/README`"), "the Home record is used only after this workspace's own notes are searched");
});

test("neither skill names a person, a workspace id or a worker of one user", () => {
  for (const bad of [/ryan/i, /personal-worker/i, /3b12bbed/, /ca8d798a/]) {
    assert.ok(!bad.test(coordinate), `omega-dev-coordinate matches ${bad}`);
    assert.ok(!bad.test(machine), `omega-dev-machine matches ${bad}`);
  }
});
