// The spec carries two or three approaches and the chosen one (skills/omega-dev-brainstorm/SKILL.md), also when no user can answer.
// A structural test of the skill text.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const brainstorm = read("skills/omega-dev-brainstorm/SKILL.md");
const coordinate = read("skills/omega-dev-coordinate/SKILL.md");

test("the spec template has an Approaches section between the questions and the decisions", () => {
  const template = brainstorm.slice(brainstorm.indexOf("```markdown"), brainstorm.indexOf("```", brainstorm.indexOf("```markdown") + 3));
  assert.match(template, /   ## Clarifying questions and answers\n   ## Approaches\n   ## Proposed decisions\n/);
});

test("the Approaches section holds two or three approaches, a Recommendation and a Chosen line", () => {
  assert.match(brainstorm, /`Approaches` holds two or three `###` approaches, each with its trade-offs, then one\n   `\*\*Recommendation:\*\*` line and one `\*\*Chosen:\*\*` line that names the approach and who chose it\./);
  assert.match(brainstorm, /Also fix a spec whose `Approaches` section has fewer than two approaches, or lacks the\n   `\*\*Recommendation:\*\*` line or the `\*\*Chosen:\*\*` line\./);
});

test("with no user to answer, the Coordinator still proposes, chooses and records the user's words", () => {
  assert.match(brainstorm, /If the user's message says they are not available to answer, or hands the choice to you in their\n   own words \(for example "you pick"\), do not wait: write the two or three approaches in your reply,/);
  assert.match(brainstorm, /`chosen by the Coordinator under the user's words` followed by those words, quoted\. When neither\n   holds, wait as above\./);
});

test("a job names one part, spelled as the skill spells it", () => {
  assert.match(coordinate, /^6\. \*\*One part per job\.\*\* A job names exactly one part of one skill, spelled as the skill spells it$/m);
  assert.match(coordinate, /Never merge two parts into one job and never rename a part/);
  assert.ok(coordinate.indexOf("6. **One part per job.**") < coordinate.indexOf("## 4. Reading the reply"));
});
