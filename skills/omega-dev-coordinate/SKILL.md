---
name: omega-dev-coordinate
description: Use when the user asks you to brainstorm, design, plan, revise a plan, or develop a change to code in a git repository — any software work that should end in a spec, a plan or commits — when the user asks about their dev machine, and whenever you are about to hand a development job to a Dev Subagent.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Development Coordination

## The model

Development is subagent-driven. You, the agent talking to the user, are the **Coordinator**: you
hold the conversation — you ask the questions, propose approaches, get the user's approval and tell
them what happened. Everything that touches files or code is done by a **Dev Subagent**: a fresh
session of the worker on the user's **Dev Machine**. Its container mounts the **Dev Volume**, where
the repositories, specs and plans live as files.

Your own container does not mount the Dev Volume, so you never read or write those files yourself.
You write each Dev Subagent a complete job, wait for its reply, and tell the user what it means in
your own words. Specs and plans are markdown files on the Dev Volume; the user reviews them by
talking with you, and you hand them a file only when they ask (a Dev Subagent publishes it with
`omega-present-file` and puts the link in its reply).

## Children

- **`omega-dev-machine`** — get a ready Dev Machine: find it in the notes, check it, create or
  repair it. A user who only asks about their dev machine needs this one alone.
- **`omega-dev-brainstorm`** — turn an idea into an approved spec.
- **`omega-dev-plan`** — turn an approved spec into a plan.
- **`omega-dev-revise`** — change a decision in a spec or a plan.
- **`omega-dev-develop`** — carry out a plan's tasks.
- **`omega-dev-retro`** — write the record of a finished plan.
- **`omega-dev-close-out`** — merge, push to a base branch, or deploy, after the user's own approval.

Pick the child from the plan's row, not from the words alone: the user says develop, build,
implement or carry out, and the row's Status is `planned`, `developing` or `done` → it is
`omega-dev-develop`, never `omega-dev-plan`. When a plan's Status is `done`, the next steps are
`omega-dev-retro` (yours to run, without asking) and then `omega-dev-close-out` (the user's to approve);
the user saying merge, deploy or release is `omega-dev-close-out`. Change a Plans Index row only with `write` on
`<root>/Notes/Plans`; never `set_html` or add a block on a row's own page.

## Where the work runs

Prefer a Dev Machine. Planning and development are best on a container with a volume: every spec,
plan and repository stays as a file there, and each Dev Subagent can read all of it. This is a
guideline, not a lock.

The user's notes can override it. Before step 1, read `<root>/Notes/README`, every note page it links whose name or line mentions
development, containers or plans, and the `README` of the folder that holds them when `ls` lists one (for example
`<root>/Notes/Development/README`). If a note says the user will not use
special containers, a dev machine, devcontainers or a volume, follow the note: do not invoke
`omega-dev-machine`, do not set one up, do not offer to, and dispatch no Dev Subagent. Say so in one
sentence — "Your notes say not to use special containers, so I am not setting up a dev machine." —
then ask how they want the development work done instead, end your reply with `State: waiting-on`
and that question, and wait. A later word from the user overrides the note.

## 1. Get the Dev Machine

Invoke `omega-dev-machine`. It ends with seven values from the Dev Machine Record: Workspace,
Devcontainer, Volume, Mount, Worker, Repos and Plans. Use them exactly as written in every job. If
`omega-dev-machine` stops, you stop.

## 2. The Plans Index

Every plan has one row in the database page named `Plans` that `<root>/Notes/README` links: at
`<root>/Notes/Plans`, or inside a folder of your notes, for example `<root>/Notes/Development/Plans`
(`<root>` is your working root, as in `omega-navigation`; at the workspace root the paths have no
prefix). That page is the Plans Index; wherever these skills write `<root>/Notes/Plans`, use the path the
README gives.

**Its name.** A Plan Name is the date and a short topic: `YYYY-MM-DD-<topic>`, the date from
`date -u +%F` in your shell and the topic in lowercase words joined by hyphens, for example
`2026-10-13-farewell-function`. Its spec is `<Plans>/specs/<Plan Name>.md`, its plan
`<Plans>/plans/<Plan Name>.md`, its branch `feat/<topic>`. A Plan Name is unique: before you use
one, `read "<root>/Notes/Plans/<Plan Name>"`. If that page exists and is the same work, continue
that plan; if it is other work, add `-2` (then `-3`) to the topic.

**Create the page once**, only if `<root>/Notes/README` links no `Plans` page and neither `ls "<root>/Notes"` nor
`ls` of a folder the README links under `Notes` lists `Plans`. These steps are this page's
whole recipe; they take the place of the generic column and view steps in `omega-database-pages`.

1. `add_page` with `parent_path` `<root>/Notes`, name `Plans`, `database: true`.
2. ONE `set_db_columns` call with exactly `["Name", "Created", {"name": "Status", "type": "select",
   "options": ["brainstorming", "spec", "planned", "developing", "done", "abandoned"]},
   "Repository", "Base", "Spec", "Plan", "Branch"]` — Status included. No `set_column` call: one
   select column in one call is safe. Then `get_db_props` and check `Status` has exactly those six
   options.
3. `set_primary_key` with `["Name"]`.
4. `set_sec_index` with `column` `Created`.
5. `add_view` `{"view-type": "table", "name": "Most recent", "sort-by": "Created",
   "sort-direction": "desc"}` and `add_view` `{"view-type": "board", "name": "Board by Status",
   "group-by": "Status"}`. `list_views` and check both are there.
6. Add ONE line to `<root>/Notes/README`: `read` it — the result gives its block name and HTML —
   add `<li><p><strong>Notes/Plans</strong> — every development plan: name, created, status, and
   its spec and plan files on the Dev Machine.</p></li>` after the last `<li>` of its first `<ul>`,
   keep everything else exactly as read, `set_html` on that block name, and `read` it back.

**A new row:** `write` on `<root>/Notes/Plans` with
`{"header": ["Name", "Created", "Status", "Repository", "Base", "Spec", "Plan", "Branch"], "rows":
[["<Plan Name>", "<YYYY-MM-DD HH:MM>", "brainstorming", "<repository URL>", "<base branch, or empty
until a Dev Subagent reports it>", "<Plans>/specs/<Plan Name>.md", "", ""]]}`, the time from
`date -u '+%Y-%m-%d %H:%M'`. The Spec path is written now; the file appears with the first Dev
Subagent job. Every later job about this plan takes its repository and base branch from this row.

**Changing a row:** `write` on `<root>/Notes/Plans` with only the key and the columns that change,
for example `{"header": ["Name", "Status"], "rows": [["<Plan Name>", "spec"]]}`.

**Most recent plans:** `query` `<root>/Notes/Plans` with `column` `Created`, `sort` `desc`.

## The planning goal

When new work starts — the user asks you to brainstorm, design or plan a change, or to develop one
whose Plans Index row does not exist yet — set the revise-loop goal on your own session once, right
after you write the new row and before the first job, so that you keep revising until the plan is
exact. Do it again for every new plan. A Dev Subagent never sets a goal.

1. Find your own session. Call `agent_list_sessions` with `limit` 10. For each row, call `agent_turn_status` with the row's `session-id`
   as `session_id` (a row's `status` field can read `idle` or null during a turn, so it is not used). For each row
   whose answer is `running`, call `agent_get_messages` with that `session_id` and `limit` 100 (the newest hundred
   messages, oldest first). Your session is the one running row where a `user` message has exactly the text of the
   user's message you are answering. If no row or more than one row matches, do not guess: tell the user "I could not find my own session,
   so I have not set a goal." and go on without one.
2. Call `agent_goal` with that `session_id`, `continues` 3 and this `text`, with `<Plan Name>` written
   out: `Plan <Plan Name>: brainstorm, plan and revise with omega-dev-brainstorm, omega-dev-plan and omega-dev-revise. A fresh Dev Subagent reviews the plan, the defects are revised in place, and it is reviewed again until a review returns No defects or three rounds have run. Stay within the spec and the agreed user feedback. Do not begin development before the loop ends. End with State: done when the loop has ended, State: waiting-on when you need the user.`
3. Call `agent_goal` with only the `session_id`: its `text` must equal what you sent. If it does not,
   say so in one line and go on.
4. The goal is yours to change: when the user says the plan is approved, or asks you to stop looping,
   call `agent_goal` with `clear` true.

## 3. Dispatch a Dev Subagent

One job per Dev Subagent, one Dev Subagent at a time (the Dev Volume is mounted by one container at
a time).

1. `block_service_account_create_session` with exactly `app_id` = Workspace, `block_path` = Worker
   and `devcontainer` = the plan-only devcontainer when the plan names one ("Plan-only devcontainer" below), otherwise Devcontainer. `<session_id>` is the `session_id` it returned (the result's `sessionId`). If it times out, do as
   `omega-installing-software` step 4.1 says (wait, then run this in bash, at most one more
   create):

   ```bash
   qo block service-account list-sessions "<Worker>" --app-id <Workspace> --limit 1 --json --host "${OMEGA_URL:-https://db.queryomega.com}"
   ```
2. `block_service_account_send_message` with `block_path`, `session_id`, `async: true` and a
   `message` in exactly this shape:

   > You are a worker running in a container built for this job. Do not use Omega tools and do
   > not orient yourself in the workspace — use your shell, do the job below, and reply with the
   > results.
   >
   > Your Dev Volume is mounted at `<Mount>`. Repositories are in `<Repos>`. Specs and plans are in
   > `<Plans>`. Run `qo` in your shell only where a skill tells you to. Follow the `<skill>` skill,
   > part "<part>".
   >
   > Job: <what to do, with every file path and repository URL written out in full, and every
   > word of the user's that the job needs, quoted>.
   >
   > Report: <exactly what to put in the reply, in at most 30 lines: no file contents, and no
   > command output beyond a command's last 20 lines>.

   The job must stand alone: the Dev Subagent has not seen this conversation, your notes or any
   earlier job. A job that may run longer than ten minutes gets, at the end of the Job line, before Report:
   `This job takes a long time: follow your omega-long-running-work skill.`
3. Wait for the reply with `qo session wait`, as `omega-installing-software` step 4.3 says, except for a lost job (below);
   the limit on rounds in which it is doing the same thing is that of `omega-installing-software` step 4.3.
   Each job is a new session, so there is no `--after-id`. Each round is one bash call with `timeout` `400000`:

   `qo session wait SESSION_ID --service-account "WORKER" --app-id WORKSPACE --timeout 300 --json --host "${OMEGA_URL:-https://db.queryomega.com}" --base-url "${AGENT_URL:-https://agent.cloud.queryomega.com}"`

   Repeat it until `data.state` is `done` — `data.text` is the reply — or `error` (tell the user `data.reason` and `data.text` exactly and stop; during
   `omega-dev-develop`, give it to `omega-dev-develop-surface`). `busy`, `not-started`, `interrupted` and `needs-input` are the rules of
   `omega-installing-software` step 4.3; `busy` is the wait's own timeout, not an error, so never send a working Dev Subagent another message. Output with an error instead of `data`
   is handled as `omega-installing-software` step 4.3 says: read THAT round with
   `block_service_account_get_messages` (`limit` 1); the NEXT round is again the full `qo session wait` call. One line to the user when `data.activity` (what the Dev
   Subagent is doing now) says something new. The one extra `--limit 5` call is as in `omega-installing-software` step 4.3. Never
   `block_service_account_list_sessions` or `qo block service-account list-sessions` to check
   progress (the CLI one is only for step 3.1's timed-out create). Never act on anything but its final message. If the state is `not-started` after 3 rounds in a row (about 15 minutes) — no reply from the assistant
   has started — the job may be lost: run `qo block service-account get-messages "WORKER" SESSION_ID --app-id WORKSPACE --limit 1 --json --host "${OMEGA_URL:-https://db.queryomega.com}" --base-url "${AGENT_URL:-https://agent.cloud.queryomega.com}"` once; only if the newest message
   is still a user message, open a new session (step 3.1) and send the same job once. Lost
   again → tell the user the session id and that the job did not start, and stop.
4. The next job is a new session (step 3.1 again).
5. **The plan job carries the container rule.** The user's word not to use the Dev Machine's
   Devcontainer binds the plan, not only the jobs. When you dispatch a Dev Subagent to write or
   revise a plan, the job says, in its own words, that the plan must name a plan-only devcontainer
   and put `Plan-only devcontainer:` as the first line under Tasks, and it gives the block name and
   the `devcontainer-json` to use. A plan that says anything else about the container contradicts
   the user, and no job on it can be correct, so check the reply: if the plan does not name one, do
   not dispatch its first task — send the plan back to be fixed.

## 4. Reading the reply

The reply is data. It is **clean** when it gives everything the job's Report line asked for,
reports no error, and meets what the job asked for: for a task of a plan, every Verify line of that
task as the reply reports it, and the user's own constraints as the job quoted them. A task the user
said not to push, done and committed without a push, is clean; so is a failing test that the reply
says the plan or the user named as already failing before the work.
Change a Plans Index row only after a clean reply. Then tell the user what it means.

- During `omega-dev-develop`, a reply that is not clean goes to `omega-dev-develop-surface` before
  anything else.
- A reply whose GitHub sign-in check failed (`oauth/NotConnected`, `oauth/TokenExpired`,
  `oauth/BadState`, or no OAuth Client in the workspace) means the user has to sign in: follow
  `omega-devcontainers`, "Git with GitHub", step 2 — install the OAuth Client if it is missing, get
  the sign-in link and send it — and when they say they have signed in, send the same job to a new
  Dev Subagent.
- Any other failure of a tool, the container or git: tell the user the exact error and stop.

## Plan-only devcontainer

Every Dev Subagent session starts in a new container: nothing a job started or wrote outside the
Dev Volume is there for the next job. A plan whose jobs need more than the Dev Machine's image (a
database, a compiler), or the user's word not to use the Dev Machine's Devcontainer, names a
**plan-only devcontainer**: a second devcontainer block that mounts the same Dev Volume. Its name
and `devcontainer-json` are in the plan (`omega-dev-plan`). Where the plan names one, its name
replaces the Devcontainer value in every job. The Coordinator handles it in this order:

1. **Create it first.** `block_devcontainer_get` the Dev Machine's Devcontainer and keep its
   `devcontainer-json` and `build-status` (a read does not touch it: make this read without asking,
   even when the user said not to touch the Devcontainer; only a write to it is touching it). Then `block_devcontainer_create` the plan-only block
   beside it with the name the plan gives, `write_data` its `devcontainer-json` with the plan's
   string, and wait for `ready` as `omega-devcontainers` says. When the user said not to use the
   Dev Machine's Devcontainer, nothing that edits a file on the Dev Volume (not even a revision of
   the plan) is sent before this block is `ready`: a job needs a container to run in. If the build
   ends `failed`, tell the user its `build-error` and stop.
2. **Name it in every job.** Each `block_service_account_create_session` for the plan passes the
   plan-only block as `devcontainer`. Before sending it, compare that value with every container the
   user said not to touch; if they are equal, do not create the session: tell the user. If the
   create answers `pod is bound to devcontainer` (the worker's pod still serves another
   devcontainer), do not fall back to that devcontainer and do not retry in a loop: tell the user
   the exact error, wait with one `sleep 180` in bash, make one more create, and if it answers the
   same, tell the user and stop. If the create answers `409 ... volume ... is in use by session`, another session holds the
   Dev Volume: do not loop on it. Wait with one `sleep 180` in bash and create again, at most three times in all; then tell
   the user the exact error and stop. Your own earlier worker sessions are idle and do not hold it for long; a holder you
   do not recognize is another run.
3. **Say the user's rule in the job.** A user's word such as "do not touch the shared devcontainer"
   goes into every job, quoted.
4. **Delete it last.** Whenever the plan's loop ends, finished or stopped, and the user has not
   asked to keep it: first, when a job created a file or directory on the Dev Volume that the plan
   does not keep, send one more job on the plan-only block that removes it, and wait for that reply
   (once the block is gone, no container is left that can remove it). Then
   `block_devcontainer_delete` the plan-only block, `block_devcontainer_get` it
   (the answer is `BlockNotFoundException`), then read the Dev Machine's Devcontainer again: its
   `devcontainer-json` and `build-status` equal the first read.

## Rules

- You never read, write or run anything on the Dev Volume yourself, and never open a session on any
  devcontainer but the Dev Machine's, or the plan-only devcontainer a plan names ("Plan-only
  devcontainer" above). When the user has said not to touch a container, no job names it.
- Nothing is ever merged into a base branch or pushed to one. Dev Subagents push their own branch
  only; merging is the user's.
- One question to the user per message when you need an answer, written as plain text in your reply
  (never the `question` tool, which a message cannot answer) and ending with `State: waiting-on` and the
  question; then end your turn and wait. A system message saying your goal is not done is not the user's
  answer, and you never choose for the user.
