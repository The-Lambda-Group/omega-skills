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

Read `<root>/Notes/README` — the index of your notes — and open the pages it links that could be
about installed software. A container entry names its devcontainer block, what it installs, and
its worker.

- **A container already has the software:** read its devcontainer with `block_devcontainer_get`.
  If `build-status` is `ready`, skip to step 4 and reuse its worker.
- **A container exists but lacks a package you need:** add the package to its `features` (step 2's
  write, with the full new spec — its existing `features` and `mounts` plus the new package) and wait
  for `ready` again. Its worker stays the same.
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
   at the right agent service and model. The result carries the new `sessionId`. Only open the
   session once `build-status` is `ready` — before that the worker would start without your
   software.
2. `block_service_account_send_message` with `block_path`, `session_id`, `async: true`, and a
   `message` that is the whole job. Start the message with these two sentences, word for word,
   then the job:

   > You are a worker running in a container built for this job. Do not use Omega tools and do
   > not orient yourself in the workspace — use your shell, do the job below, and reply with the
   > results.

   Then say what to run, where to write files, and exactly what to report back — the measured
   values and the command output, not a summary. If the job will run longer than ten minutes, add:
   `This job takes a long time: follow your omega-long-running-work skill.`
3. Wait for the answer. Each round: `sleep 30` in bash, then `block_service_account_get_messages`
   with `limit` = 1 to read `total`, then again with `skip` = total − 1 and `limit` = 1 to read the
   newest message (do not pass `sort`). Send the worker nothing while it works. It is done when
   that newest message is from the assistant, completed, with `finish` = `stop`; its text is the
   result.

   For a job longer than ten minutes, follow `omega-long-running-work` for your own waiting: each
   round is `sleep 540` in one bash call with `timeout` `600000`, then the two reads above, then one
   line to the user saying where the worker is (from its newest message's text or tool output).
   Keep your turn open until the worker is done.

   The worker runs in its own container: files it writes stay there, and you cannot read, list or
   copy them from your sandbox. So write the job so that everything you need comes back in the
   worker's reply text.

   When the job produces a file the user should open (a document, an image, a video, a page),
   tell the worker, in the job message, to publish that file with its `omega-present-file` skill
   and to put the link it gets in its reply. Give the user that link. The link is public and
   stays valid after the worker's session ends. Otherwise report what the worker replied, and say
   the file was made in the worker's container.

4. For a later job, reuse the same worker: send the new job to its existing session, or open a new
   session exactly as in 1. Every job message — including one to a worker you are reusing — starts
   with the two worker sentences from 2, word for word; without them the worker orients itself in
   the workspace instead of doing the job.

## 5. Record it in your notes — before you answer

Your answer is not finished until both of these are done. Notes are pages: `<root>/Notes/README`
is the index (one line per note page, linking it), and every note is its own page under
`<root>/Notes`. Create each missing page with `add_page`, and write each page's content with
`set_html` into the block named `Content`.

1. **The note page.** `add_page` with `parent_path` `<root>` and name `Notes` if it is missing,
   then `add_page` with `parent_path` `<root>/Notes` and a name for installed software (for
   example `Containers`). Write one entry per container — keep the entries already there — with:
   the devcontainer's full block path, what it installs (its `features`), the worker's full block
   path and how to use it (open a session with the devcontainer, send the job async, read its
   newest message), the date, and the `build-status`.
2. **The index.** `add_page` with `parent_path` `<root>/Notes` and name `README` if it is missing.
   Keep its existing lines and make sure one line links the note page, e.g.
   `<li><a href="Containers">Containers</a> — software installed here, with its workers</li>`.

Write full block paths in notes, never paths relative to a guess.

## 6. Answer the user

Give the result the worker reported, and say which note page records the container so the next
session reuses it.
