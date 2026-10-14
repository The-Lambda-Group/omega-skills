---
name: omega-installing-software
description: Use when a task needs a program, library, or tool that is not installed in your own sandbox (a `command not found`, a missing interpreter or library), or when the user asks you to install software. You cannot install into your own container — software is installed by building a devcontainer that has it and handing the work to a worker agent that runs in that container. Covers checking your notes for a container you already built, building one, creating its worker, sending it a job, waiting for the answer, and recording the container in your notes so a later session reuses it.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Installing Software

## The model

You run in a sandbox built from a fixed image. You are not root, and the image of your own
container cannot change while you are in it. So you never install software into yourself.

Software is installed by **building a container** and **running the work in it**:

1. A **devcontainer** block describes a container image: the base image plus the packages you add
   (`omega-devcontainers` covers the spec and the build).
2. A **worker** is a service account whose sessions are bound to that devcontainer. When you open a
   session on the worker with the devcontainer, the worker's agent runs inside a container with
   your software installed. You send it the job; it runs the software and replies.
3. Your **notes** record which containers exist, what is in each, and which worker runs it, so any
   later session reuses them instead of building again.

Everything lives under your **working root**: the workspace root, or the folder the user told you
to work in. Below, `<root>` means that folder, `<name>` the short name you give a container, and
`<package>` a package the job needs.

Your working root is a folder of OmegaAI pages, not a directory on disk. Nothing you or a worker
runs writes files into it: a worker's files stay in the worker's container, and what you want to
keep goes into your notes as text.

This skill is the complete recipe. Read and create only under your working root — do not open
other folders to look for examples. Use only the steps below. Add no `mounts` or volumes of your
own: a job whose results come back as text in the worker's reply needs neither. A container you
reuse may already mount a volume; keep its `mounts` exactly as they are.

## 1. Check your notes first

Read your Home workspace's `Notes/README` — your memory — and then `<root>/Notes/README`, the index
of this workspace's notes, and open the pages they link that could be about installed software. A container entry names its devcontainer block, what it installs, and
its worker.

- **A container already has the software:** read its devcontainer with `block_devcontainer_get`.
  If `build-status` is `ready`, skip to step 4 and reuse its worker.
- **A container exists but lacks a package you need:** add the package to its `features` (step 2's
  write, with the full new spec — its existing `features` and `mounts` plus the new package) and wait
  for `ready` again. Its worker stays the same.
- **A container's volume is too small for the job:** grow it (`omega-devcontainers`, "Volumes")
  before you open the worker's session; it grows when the worker's container starts.
- **No container has it:** continue with step 2.

## 2. Build the container

Say what you are doing in one sentence: what is missing, that you are building a container with
it, and that this takes a few minutes. If the user only asked a question, answer it and do not
build.

1. Work out which packages provide what the job needs. The base image is Debian-based: system
   programs come from `apt`, Python libraries from `pip` (add `python3-pip` to `apt`), and anything
   else from `run` shell steps.
2. `block_devcontainer_create` with `page` = `<root>/Resources/Containers` and `name` = `<name>`.
   Create the pages `<root>/Resources` and `<root>/Resources/Containers` first with `add_page` if
   they do not exist.
3. `write_data` on `<root>/Resources/Containers@<name>` with the patch
   `{"devcontainer-json": "{\"features\":{\"apt\":[\"<package>\"]}}"}` — the value is a JSON
   **string**; list every package the job needs.
4. Every 30 seconds (`sleep 30` in bash between reads), read `block_devcontainer_get` on the same
   path until `build-status` is `ready` or `failed`. A build takes from under a minute to about ten.
   On `failed`, stop and tell the user the `build-error`.

## 3. Create the worker

`block_service_account_create` with `page` = `<root>/Resources/Containers` and
`name` = `<name>-worker`. One worker per container.

## 4. Send the worker the job

1. `block_service_account_create_session` with exactly two arguments besides `app_id`:
   `block_path` = `<root>/Resources/Containers@<name>-worker` and `devcontainer` =
   `<root>/Resources/Containers@<name>`. Leave `model` and `sandbox` out — the tools already point
   at the right agent service and model. The result carries the new `sessionId`. Below, `<app_id>` is the same `app_id` you passed to
   `block_service_account_create_session`, and `<session_id>` the `session_id` it returned (the
   result's `sessionId`). Only open the
   session once `build-status` is `ready` — before that the worker would start without your
   software.

   The first session on a new or rebuilt container can take ten minutes or more: its machine may
   still be starting, and the image is pulled the first time. If `block_service_account_create_session`
   times out, do not try another way. Wait (`sleep 300` in one bash call), then run this in bash:

   ```bash
   qo block service-account list-sessions "<root>/Resources/Containers@<name>-worker" --app-id <app_id> --limit 1 --json --host "${OMEGA_URL:-https://db.queryomega.com}"
   ```

   (the CLI drops each row's whole system prompt; the MCP `list_sessions` returns it and costs
   tens of thousands of tokens). If it lists a session, use that one; otherwise call `block_service_account_create_session` once more. If that times out too, stop and
   tell the user.
2. If the session already has messages, first run the step 4.3 command without `sleep 180;` and
   write down the newest `message-id` (or `none` if `messages` is empty; if the output has no
   `"state"`, use MCP `limit` 1 and write down `info.id`).

   Then `block_service_account_send_message` with `block_path`, `session_id`, `async: true`, and a
   `message` that is the whole job. Start the message with these two sentences, word for word,
   then the job:

   > You are a worker running in a container built for this job. Do not use Omega tools and do
   > not orient yourself in the workspace — use your shell, do the job below, and reply with the
   > results.

   Then say what to run, where to write files, and exactly what to report back — the measured
   values and the key lines of command output, not a summary, in at most 30 lines (no file
   contents, and no command output beyond a command's last 20 lines). If the job will run longer
   than ten minutes, add:
   `This job takes a long time: follow your omega-long-running-work skill.`
3. Wait for the answer in rounds, whatever the job's length. Each round is ONE bash call with
   `timeout` `400000`, using the worker block path, session id and app id of steps 4.1 and 4.2:

   ```bash
   sleep 180; qo block service-account get-messages "<root>/Resources/Containers@<name>-worker" <session_id> --app-id <app_id> --limit 1 --summary --json --host "${OMEGA_URL:-https://db.queryomega.com}" --base-url "${AGENT_URL:-https://agent.cloud.queryomega.com}"
   ```

   Every round sleeps 180 seconds: not less because the worker looks nearly done, and not more.
   `--summary` makes `qo` print its usual JSON envelope with each message replaced by a short
   summary, never the message itself, which is megabytes when the worker has read images. The
   summaries are in `data.result[0].messages`, oldest first, so the LAST one is the newest. Each has
   `message-id`, `role`, `finish`, `completed` and a `state`. If `messages` is empty, the worker has
   no message yet: treat it as `user`. If the newest `message-id` is the `message-id` you wrote
   down in step 4.2, it is an earlier job's: do one more round; if it is still that id
   after 4 rounds, the job did not start: tell the user the session id and stop. Otherwise its
   `state` says where the worker is:
   - `done` — the worker has finished; `text` is its answer (when `truncated` is `true`, say so
     when you pass it on).
   - `working` — the worker is still busy. When its `activity` says something new, write the user
     one line from it. Then the next round. If `activity` is the same for 20 rounds in a row and the
     job message did not carry the omega-long-running-work sentence, tell the user the session id
     and that `activity`, and stop. If it did carry it, the limit is 60 rounds (three hours). Keep
     your turn open until `done` or `error`.
   - `user` — the newest message is still your job (`text` is its first 200 characters): the worker
     has not started it yet. Do the next round. Still `user` (or `messages` empty) after 4 rounds in
     a row (about 12 minutes) → tell the user the session id and that the job did not start, and
     stop.
   - `error` — the worker's turn failed: tell the user its `error` exactly, and stop.

   **`turn-state`.** The same output has `data.result[0]["turn-state"]` beside `messages`: `running`,
   `idle` or `interrupted` (absent when the agent service cannot tell: treat it as `running`). When
   it is `interrupted` and the newest `state` is not `done`, the worker's turn was cut off (the
   service was restarted, a node was lost): its newest message reads `working` and never changes.
   Stop the rounds and follow `omega-interrupted-turn`. When the newest `state` is `done` or
   `error`, ignore `turn-state`.

   **No `"state"` in the output** (an error message, `error: unknown option '--summary'` from an
   old `qo`, not logged in, anything else): the shell read did not work. Read THAT round
   immediately with `block_service_account_get_messages` with `limit` 1 and nothing else (no
   `skip`, no `sort`, no `before`, no `include_reasoning`); the failed call already slept 180
   seconds. That returns the raw newest message: it is `done` when `info.role` is `assistant`,
   `info.time.completed` is set and `info.finish` is `stop` (its `text` parts are the answer);
   `error` when `info.error` is set or `info.finish` is neither `stop` nor `tool-calls`; `user`
   when `info.role` is `user`; otherwise `working`. If that read fails too, tell the user its error
   exactly and stop. The NEXT round is again the full bash call `sleep 180; qo block
   service-account get-messages …` — one failure does not change the recipe, so do not switch to
   MCP reads after a single failed shell read. Only when two rounds in a row had no `"state"`,
   every later round is a bash call of exactly `sleep 180` (`timeout` `400000`) then the MCP read.
   Any round whose bash output has `"state"` resets the count to zero. In MCP mode the activity is
   the newest part's tool name plus status, or its text's first 200 characters; apply the 4-round
   `user` limit and the same-activity limits using that.

   Read only the newest message. If `activity` is the same for 5 rounds in a row, make ONE extra
   shell call with `--limit 5` in place of that round's call (never MCP `limit` above 1, never more
   than 5 messages, never the whole transcript), read each `activity`, and go on. Do this at most
   once per job. With `--limit 5` the LAST message in `messages` is the newest and its `state` is
   the worker's state.
   Send the worker nothing while it works. Until it is `done`, everything in its messages is work
   in progress: a failed command in one of them (a `git fetch` before it has signed in, a test it
   is still fixing) is the worker's to handle, not your answer. Never call
   `block_service_account_list_sessions` or `qo block service-account list-sessions` to see how the
   worker is doing: the CLI one is only for step 4.1's timed-out create.

   The worker runs in its own container: files it writes stay there, and you cannot read, list or
   copy them from your sandbox. So write the job so that everything you need comes back in the
   worker's reply text.

   When the job produces a file the user should open (a document, an image, a video, a page),
   tell the worker, in the job message, to publish that file with its `omega-present-file` skill
   and to put the link it gets in its reply. Give the user that link. The link is public and
   stays valid after the worker's session ends. Otherwise report what the worker replied, and say
   the file was made in the worker's container.

4. For a later job, reuse the same worker: send the new job to the session id kept in your
   notes, or open a new session exactly as in step 4.1; never look for a session with
   `block_service_account_list_sessions`. Note the newest `message-id` first, as step 4.2 says.
   Every job message — including one to a worker you are reusing — starts with the two worker
   sentences from step 4.2, word for word; without them the worker orients itself in the
   workspace instead of doing the job.

## 5. Record it in your notes — before you answer

Your answer is not finished until all of these are done. Notes are pages: `<root>/Notes/README`
is the index (one line per note page, linking it), and every note is its own page under
`<root>/Notes`. Create each missing page with `add_page`, and write each page's content with
`set_html` into the block named `Content`.

1. **The note page.** `add_page` with `parent_path` `<root>` and name `Notes` if it is missing,
   then `add_page` with `parent_path` `<root>/Notes` and a name for installed software (for
   example `Containers`). Write one entry per container — keep the entries already there — with:
   the devcontainer's full block path, what it installs (its `features`), the worker's full block
   path, the worker session id you used (so a later job reuses it), and how to use it (open a
   session with the devcontainer, send the job async, read its newest message with the step 4.3
   command), the date, and the
   `build-status`.
2. **The index.** `add_page` with `parent_path` `<root>/Notes` and name `README` if it is missing.
   Keep its existing lines and make sure one line links the note page, e.g.
   `<li><a href="Containers">Containers</a> — software installed here, with its workers</li>`.
3. **The link from Home.** If `<root>` is not in your Home workspace, `read` the Home workspace's
   `Notes/README` (create it with `add_page` there if it is missing) and keep its existing lines;
   make sure one line links this workspace's notes by the workspace's name, its app id and the full
   path, e.g. `<li><p><strong><workspace name></strong> (<code><app-id></code>) —
   <code><root>/Notes/README</code>: this workspace's notes, including its containers</p></li>`.

Write full block paths in notes, never paths relative to a guess.

## 6. Answer the user

Give the result the worker reported, and say which note page records the container so the next
session reuses it.
