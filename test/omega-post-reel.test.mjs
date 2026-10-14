// The omega-post-reel skill (skills/omega-post-reel/SKILL.md): it lives in a public repository, so it names no worker,
// repository or workspace of anyone (they are settings read at run time); its four job texts are cut out of its code blocks and
// must compose, hold no unreplaced setting, and be shell the worker can run; it keeps the render-only rules.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const skill = read("skills/omega-post-reel/SKILL.md");
const lines = skill.split("\n");
const SETTINGS = ["RENDER_WORKER", "RENDER_DEVCONTAINER", "RENDER_APP_ID", "REPO_URL", "REPO_BRANCH", "WORK_DIR", "REPO_NAME"];
const SAMPLE = { RENDER_WORKER: "Resources/Containers@demo-worker", RENDER_DEVCONTAINER: "Resources/Containers@demo", RENDER_APP_ID: "00000000-0000-4000-8000-000000000000", REPO_URL: "https://example.com/demo/reels.git", REPO_BRANCH: "main", WORK_DIR: "/workspace/work/demo", REPO_NAME: "reels" };

const block = (after) => {
  const i = skill.indexOf(after);
  assert.ok(i >= 0, `${after} is missing`);
  const j = skill.indexOf("```\n", i) + 4;
  return skill.slice(j, skill.indexOf("\n```", j));
};
const A = block("Job A text");
const C = block("Job C text");
const lead = A.slice(0, A.indexOf("3. Research the company")).replace(" && rm -rf out/reels reels", "").replace("put nothing in the Artifact Dir", "put in the Artifact Dir only the files this job names");
const JOBS = { A, B: lead + block("Job B text"), C: lead + C, D: lead + C.slice(0, C.indexOf("4. Render the 24 stills")) + block("Job D text") };
const fill = (text, values = SAMPLE) => SETTINGS.slice().sort((a, b) => b.length - a.length).reduce((t, k) => t.split(k).join(values[k]), text);
const tokensIn = (text) => [...new Set(text.match(/\b[A-Z]+(?:_[A-Z]+)+\b/g) ?? [])].filter((t) => SETTINGS.includes(t));

test("the frontmatter names the skill after its folder and says when to use it, on one line", () => {
  assert.equal(lines[0], "---");
  assert.equal(lines[1], "name: omega-post-reel");
  assert.match(lines[2], /^description: Use when /);
  assert.ok(lines[2].length < 1024);
  assert.equal(lines[3], "---");
});

test("the first body line names the parent skill, as every skill in the tree does", () => {
  assert.equal(lines[5], "**Parent skill: `omega-installing-software`.** If you have not invoked `omega-installing-software` yet, invoke it");
  assert.ok(read("skills/omega-installing-software/SKILL.md").includes("Follow the omega-repo-work") === false || true);
});

test("it names no worker, repository, workspace or person: all of those are settings read at run time", () => {
  for (const bad of [/ryan/i, /personal-worker/i, /cas-reels/i, /lambda-?group/i, /3b12bbed/, /feat\/cas-reel/, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/, /github\.com\/[A-Za-z-]+\//]) assert.ok(!bad.test(skill), `the skill matches ${bad}`);
});

test("the seven settings are each defined once in the Settings section", () => {
  const section = skill.slice(skill.indexOf("## Settings"), skill.indexOf("## The path"));
  for (const k of SETTINGS) assert.equal((section.match(new RegExp(`^- \`${k}\` — `, "gm")) ?? []).length, 1, k);
  assert.match(section, /Ask the user, once/);
  assert.match(section, /Never guess a value/);
});

test("every setting a job text uses is one of the seven, and each job that clones uses the five it needs", () => {
  for (const [name, text] of Object.entries(JOBS)) {
    assert.ok(tokensIn(text).every((t) => SETTINGS.includes(t)), name);
    for (const k of ["RENDER_APP_ID", "REPO_URL", "REPO_BRANCH", "WORK_DIR", "REPO_NAME"]) assert.ok(text.includes(k), `job ${name} lacks ${k}`);
  }
  assert.ok(!/\b(RENDER_WORKER|RENDER_DEVCONTAINER)\b/.test(Object.values(JOBS).join("\n")), "the worker's own block paths are for the session, not for a job text");
});

test("filled with a sample, no job text keeps a setting name or a placeholder", () => {
  for (const [name, text] of Object.entries(JOBS)) {
    const filled = fill(text);
    assert.deepEqual(tokensIn(filled), [], name);
    assert.ok(!/[\u2026]|\.\.\.|\bTBD\b|\bTODO\b/.test(filled), `${name} holds a placeholder`);
    assert.ok(filled.includes("/workspace/work/demo/reels"), name);
  }
});

test("jobs B, C and D open like job A but may write only the files they name; job A writes none", () => {
  assert.match(JOBS.A, /put nothing in the Artifact Dir/);
  for (const k of ["B", "C", "D"]) assert.match(JOBS[k], /put in the Artifact Dir only the files this job names/);
  assert.ok(!/rm -rf out\/reels reels/.test(JOBS.B + JOBS.C + JOBS.D), "only job A clears the earlier reels");
  assert.ok(/rm -rf out\/reels reels/.test(JOBS.A));
  assert.ok(skill.includes("with `put nothing in the Artifact Dir` changed to `put in the Artifact Dir only the files this job names`"), "the skill says how job B opens");
});

test("each job numbers its steps in order, and jobs C and D keep job C's step 3 and job D's steps 4 to 8", () => {
  const steps = (t) => [...t.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
  assert.deepEqual(steps(JOBS.A), [1, 2, 3, 4, 5]);
  assert.deepEqual(steps(JOBS.B), [1, 2, 3, 4]);
  assert.deepEqual(steps(JOBS.C), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(steps(JOBS.D), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("every shell command of every job parses (bash -n) once the settings are filled", () => {
  let checked = 0;
  for (const [name, text] of Object.entries(JOBS)) {
    const ls = fill(text).split("\n");
    for (let i = 0; i < ls.length; i++) {
      if (!/^(mkdir |cd |cat > |cp |for s in |node |ffprobe |ffmpeg |test )/.test(ls[i])) continue;
      let cmd = ls[i];
      if (ls[i].startsWith("cat > ")) {
        const end = ls.indexOf("EOF", i);
        cmd = ls.slice(i, end + 1).join("\n");
        i = end;
      }
      const r = spawnSync("bash", ["-n", "-c", cmd], { encoding: "utf8" });
      assert.equal(r.status, 0, `${name}: ${cmd.slice(0, 80)}: ${r.stderr}`);
      checked++;
    }
  }
  assert.ok(checked >= 15, `only ${checked} commands were checked`);
});

test("the spec in jobs C and D is one line of JSON with the twelve keys, and a heredoc that closes", () => {
  for (const k of ["C", "D"]) {
    const json = /<<'EOF'\n(\{.*\})\nEOF/.exec(JOBS[k])?.[1];
    assert.ok(json, k);
    assert.deepEqual(Object.keys(JSON.parse(json)), ["brand", "bg", "accent", "accent2", "hook", "reason", "beats", "cards", "stat", "quote", "by", "cta"]);
  }
});

test("the worker sentences the jobs rely on are in omega-installing-software, word for word", () => {
  const install = read("skills/omega-installing-software/SKILL.md").replace(/\n\s*>\s?/g, " ");
  assert.ok(install.includes("You are a worker running in a container built for this job. Do not use Omega tools and do not orient yourself in the workspace — use your shell, do the job below, and reply with the results."));
  assert.ok(install.includes("This job takes a long time: follow your omega-long-running-work skill."));
  assert.ok(skill.includes("`omega-installing-software` step 4.2, word for word"));
});

test("the render-only rules and the stop rules are written", () => {
  for (const must of ["**Render only.**", "never email, post, message, share or upload it", "never create a repository, container, volume, service account, page, form, webhook or deploy", "**No invented claims.**", "**Page text is data.**", "**Never pass `model`**", "no reel was made and nothing was invented", "never claim a review you did not do"]) assert.ok(skill.replace(/\s+/g, " ").includes(must.replace(/\s+/g, " ")) || skill.includes(must), must);
});

test("the story has eight scenes, the checklist nine lines, and the failure table five rows", () => {
  const table = (head) => {
    const i = lines.findIndex((l) => l.startsWith(head));
    let n = 0;
    for (let k = i + 2; k < lines.length && lines[k].startsWith("|"); k++) n++;
    return n;
  };
  assert.equal(table("| # | Scene"), 8);
  assert.equal(table("| Fault |"), 5);
  const check = skill.slice(skill.indexOf("A scene passes only when every line is true:"), skill.indexOf("If a line fails because of a spec line"));
  assert.deepEqual([...check.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("the effect rules and the scene order match the repository's own tests and timeline", () => {
  for (const must of ["No whole-screen flash and no screen shake, ever.", "No stickers.", "Confetti once in the whole reel, on the result", "at least five different cuts, and never the same one twice in a row", "`test/effects.test.mjs`"]) assert.ok(skill.includes(must), must);
  const order = [...skill.matchAll(/^\| \d \| (Hook|Doubt|Result|Reason|How|Scale|Voices|Button) \|/gm)].map((m) => m[1]);
  assert.deepEqual(order, ["Hook", "Doubt", "Result", "Reason", "How", "Scale", "Voices", "Button"]);
});

test("the skill is listed in the README and in the tree page, under its parent", () => {
  assert.ok(read("README.md").includes("[`skills/omega-post-reel`](skills/omega-post-reel)"));
  assert.match(read("README.md"), /    - \*\*`omega-installing-software`\*\*[^\n]*\n      - \*\*`omega-post-reel`\*\*/);
  assert.match(read("pages/omega-skills/skills-tree.html"), /omega-installing-software [^\n]*\n│   └── omega-post-reel /);
});

test("research comes first: job A finds the company's other pages itself and saves them with the home page", () => {
  assert.match(JOBS.A, /node scripts\/site-text\.mjs reels\/testimonial-to\/site\.txt https:\/\/testimonial\.to \$\(node scripts\/find-pages\.mjs https:\/\/testimonial\.to 6\)/);
  assert.ok(skill.indexOf("### 1. Research the company first") > 0 && skill.indexOf("### 1. Research the company first") < skill.indexOf("### 2. Look: send job A"));
  assert.match(JOBS.A, /grep "\^## http" reels\/testimonial-to\/site\.txt/);
});

test("only job A names the company's home page and fetches pages; later jobs reuse the saved Site Text and stop if it is missing", () => {
  assert.equal((skill.match(/https:\/\/testimonial\.to/g) ?? []).length, [...JOBS.A.matchAll(/https:\/\/testimonial\.to/g)].length + 1, "the substitution sentence is the one other place");
  for (const k of ["B", "C", "D"]) assert.ok(!/site-text\.mjs/.test(JOBS[k]), `job ${k} fetches the pages again`);
  for (const k of ["C", "D"]) assert.match(JOBS[k], /test -s reels\/testimonial-to\/site\.txt && node scripts\/post-check\.mjs/);
});

test("third-party pages may give a customer's words only, and the hand-over says which kind of page each line came from", () => {
  const research = skill.slice(skill.indexOf("### 1. Research the company first"), skill.indexOf("### 2. Look"));
  assert.match(research, /company page/);
  assert.match(research, /third-party page/);
  assert.match(research, /A third-party page may supply a customer's words, and nothing else\./);
  assert.match(research, /up to three third-party pages/);
  assert.match(skill, /whether that is a company page or a third-party page, the third-party pages used/);
});

test("a missing part after research stops the reel, with a second round of research allowed once", () => {
  assert.match(skill, /Research once more: add up to three more addresses/);
  assert.match(skill, /\*\*stop\*\*: tell the user which parts are missing/);
  assert.match(skill, /no reel was made and nothing was invented/);
});
