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

Pick the child from the plan's row, not from the words alone: the user says develop, build,
implement or carry out, and the row's Status is `planned`, `developing` or `done` → it is
`omega-dev-develop`, never `omega-dev-plan`. Change a Plans Index row only with `write` on
`<root>/Notes/Plans`; never `set_html` or add a block on a row's own page.

## 1. Get the Dev Machine

Invoke `omega-dev-machine`. It ends with seven values from the Dev Machine Record: Workspace,
Devcontainer, Volume, Mount, Worker, Repos and Plans. Use them exactly as written in every job. If
`omega-dev-machine` stops, you stop.

## 2. The Plans Index

Every plan has one row in the database page `<root>/Notes/Plans` (`<root>` is your working root, as
in `omega-navigation`; at the workspace root the path is `Notes/Plans`).

**Its name.** A Plan Name is the date and a short topic: `YYYY-MM-DD-<topic>`, the date from
`date -u +%F` in your shell and the topic in lowercase words joined by hyphens, for example
`2026-10-13-farewell-function`. Its spec is `<Plans>/specs/<Plan Name>.md`, its plan
`<Plans>/plans/<Plan Name>.md`, its branch `feat/<topic>`. A Plan Name is unique: before you use
one, `read "<root>/Notes/Plans/<Plan Name>"`. If that page exists and is the same work, continue
that plan; if it is other work, add `-2` (then `-3`) to the topic.

**Create the page once**, if `ls "<root>/Notes"` does not list `Plans`. These steps are this page's
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
3. Wait for the reply as `omega-installing-software` step 4.3 says, except for a lost job (below);
   the limit on rounds in which it is doing the same thing is that of `omega-installing-software` step 4.3.
   Each round is one bash call with `timeout` `400000`:

   ```bash
   sleep 180; qo block service-account get-messages "<Worker>" <session_id> --app-id <Workspace> --limit 1 --json --host "${OMEGA_URL:-https://db.queryomega.com}" --base-url "${AGENT_URL:-https://agent.cloud.queryomega.com}"
   ```

   Repeat it, with `sleep 180` every time, until the newest message in `data.result[0].messages`
   (the LAST one; empty `messages` = nothing yet, same as USER) is DONE — its `text` parts,
   joined, are the reply — or ERROR (tell the user its `info.error` exactly and stop; during
   `omega-dev-develop`, give it to `omega-dev-develop-surface`). DONE, ERROR, USER and WORKING are
   the rules of `omega-installing-software` step 4.3. Output with an error instead of `messages`
   is handled as `omega-installing-software` step 4.3 says: read THAT round with
   `block_service_account_get_messages` (`limit` 1); the NEXT round is again the full bash call
   `sleep 180; qo block service-account get-messages …`. One line to the user when what the Dev
   Subagent is doing now (the newest part's tool name plus its status, or the first 200
   characters of its text) says something new. Read only the newest message; the one
   extra `--limit 5` call is as in `omega-installing-software` step 4.3. Never
   `block_service_account_list_sessions` or `qo block service-account list-sessions` to check
   progress (the CLI one is only for step 3.1's timed-out create). Never send a working Dev Subagent another message, and never
   act on anything but its final message. If the newest message is still USER (or
   `messages` is empty) after 4 rounds in a row (about 12 minutes) — no reply from the assistant
   has started — the job may be lost: run the round command once more with `--limit 1`; only if the newest message
   is still USER, open a new session (step 3.1) and send the same job once. Lost
   again → tell the user the session id and that the job did not start, and stop.
4. The next job is a new session (step 3.1 again).

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
   same, tell the user and stop.
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
- One question to the user per message when you need an answer; then end your turn and wait.
