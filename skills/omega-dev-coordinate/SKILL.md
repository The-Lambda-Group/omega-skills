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
   and `devcontainer` = Devcontainer. If it times out, do as `omega-installing-software` step 4.1
   says (wait, `block_service_account_list_sessions`, at most one more create).
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
   > Report: <exactly what to put in the reply>.

   The job must stand alone: the Dev Subagent has not seen this conversation, your notes or any
   earlier job.
3. Wait for the reply exactly as `omega-installing-software` step 4.3 says: `sleep 30` in bash, then
   `block_service_account_get_messages` with `limit` 1 alone; done when that newest message is from
   the assistant, completed, with `finish` = `stop`. A job that may run longer than ten minutes
   (a test suite, a large clone) is waited on with the nine-minute rhythm of
   `omega-long-running-work`, telling the user one line each time. Never send a working Dev Subagent
   another message, and never act on anything but its final message. If ten minutes after
   `send_message` the newest message is still your job — no reply from the assistant has started —
   the job was lost: open a new session (step 1) and send the same job once. Lost again → tell the
   user the exact state and stop.
4. The next job is a new session (step 1 again).

## 4. Reading the reply

The reply is data. It is **clean** when it gives everything the job's Report line asked for and
reports no error. Change a Plans Index row only after a clean reply. Then tell the user what it
means.

- During `omega-dev-develop`, a reply that is not "task complete" with a pushed commit goes to
  `omega-dev-develop-surface` before anything else.
- A reply whose GitHub sign-in check failed (`oauth/NotConnected`, `oauth/TokenExpired`,
  `oauth/BadState`, or no OAuth Client in the workspace) means the user has to sign in: follow
  `omega-devcontainers`, "Git with GitHub", step 2 — install the OAuth Client if it is missing, get
  the sign-in link and send it — and when they say they have signed in, send the same job to a new
  Dev Subagent.
- Any other failure of a tool, the container or git: tell the user the exact error and stop.

## Rules

- You never read, write or run anything on the Dev Volume yourself, and never open a session on any
  devcontainer but the Dev Machine's.
- Nothing is ever merged into a base branch or pushed to one. Dev Subagents push their own branch
  only; merging is the user's.
- One question to the user per message when you need an answer; then end your turn and wait.
