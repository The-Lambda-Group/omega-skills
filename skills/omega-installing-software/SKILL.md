---
name: omega-installing-software
description: Use when a task needs a program, library, or tool that is not installed in your own sandbox — a `command not found`, no `ffmpeg`, no `python3`, no `pandoc` — or when the user asks you to install software. You cannot install into your own container; software gets installed by building a devcontainer with it and handing the work to a worker agent that runs in that container. Covers checking your notes for a container you already built, building one, creating its worker, sending it the job, waiting for the answer, and recording the container in Notes so a later session reuses it.
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
to work in. Below, `<root>` means that folder (for example
`Test Installs/omega-ai-agent-service/devcontainer-installs`).

## 1. Check your notes first

Read `<root>/Notes/README`, then `<root>/Notes/Containers` if the README links it. Each container
entry names its devcontainer block, what it installs, and its worker.

- **A container already has the software:** read its devcontainer with `block_devcontainer_get`.
  If `build-status` is `ready`, skip to step 4 and reuse its worker.
- **A container exists but lacks a package you need:** add the package to its `features` (step 2's
  write, with the full new spec) and wait for `ready` again. Its worker stays the same.
- **No container has it:** continue with step 2.

## 2. Build the container

Say what you are doing in one sentence (for example: "ffmpeg isn't installed here, so I'm building
a container with it — that takes a few minutes."). If the user only asked a question, answer it
and do not build.

1. `block_devcontainer_create` with `page` = `<root>/Resources/Containers` and `name` = the software
   (e.g. `ffmpeg`). Create the pages `<root>/Resources` and `<root>/Resources/Containers` first with
   `add_page` if they do not exist.
2. `write_data` on `<root>/Resources/Containers@<name>` with the patch
   `{"devcontainer-json": "{\"features\":{\"apt\":[\"ffmpeg\"]}}"}` — the value is a JSON **string**.
   Use `apt` for system packages, `pip` for Python packages (add `python3-pip` to `apt`), and `run`
   for any other shell step.
3. Every 30 seconds (`sleep 30` in bash between reads), read `block_devcontainer_get` on the same
   path until `build-status` is `ready` or `failed`. A build takes from under a minute to about ten.
   On `failed`, stop and tell the user the `build-error`.

## 3. Create the worker

`block_service_account_create` with `page` = `<root>/Resources/Containers` and
`name` = `<name>-worker` (e.g. `ffmpeg-worker`). One worker per container.

## 4. Send the worker the job

1. `block_service_account_create_session` with exactly two arguments besides `app_id`:
   `block_path` = `<root>/Resources/Containers@<name>-worker` and `devcontainer` =
   `<root>/Resources/Containers@<name>`. Leave `base_url`, `model` and `sandbox` out — the tools
   already point at the right agent service and model. The result carries the new `sessionId`.
   Only open the session once `build-status` is `ready` — before that the worker would start
   without your software.
2. `block_service_account_send_message` with `block_path`, `session_id`, `async: true`, and a
   `message` that is the whole job — no `base_url`. The worker has no other context, so say what to
   run, where to write files, and exactly what to report back. Example: "Use ffmpeg to create a
   5-second test video at /workspace/test.mp4, then run ffprobe on it and reply with its exact
   duration in seconds."
3. Wait for the answer. Each round: `sleep 30` in bash, then `block_service_account_get_messages`
   with `limit` = 1 to read `total`, then again with `skip` = total − 5 and `limit` = 5 (do not
   pass `sort`). The worker starts by orienting itself (listing workspaces, reading skills) — that
   is normal; keep waiting and send it nothing while it works. It is done when its newest assistant
   message is completed with `finish` = `stop`; that message's text is the result.

   The worker runs in its own container: files it writes stay there, and you cannot read, list or
   copy them from your sandbox. So write the job so that everything you need comes back in the
   worker's reply text (the measured numbers, the command output), and report that to the user —
   say the file was made in the worker's container.

4. For a later job, reuse the same worker: send the new job to its existing session, or open a new
   session exactly as in 1.

## 5. Record it in your notes

Before you answer the user, write the container into your notes with `set_html`:

- `<root>/Notes/Containers` (create the page with `add_page` under `<root>/Notes` if needed), block
  `Content`. Keep every existing entry and add or update this one:

  ```html
  <h2>ffmpeg</h2>
  <ul>
    <li>Devcontainer: <code>Test Installs/omega-ai-agent-service/devcontainer-installs/Resources/Containers@ffmpeg</code></li>
    <li>Installs: apt ffmpeg</li>
    <li>Worker: <code>Test Installs/omega-ai-agent-service/devcontainer-installs/Resources/Containers@ffmpeg-worker</code> — open a session with the devcontainer above, send the job async, read its messages</li>
    <li>Built: 2026-09-26, build-status ready</li>
  </ul>
  ```

- `<root>/Notes/README`, block `Content`: keep what is there and make sure it links the notes page,
  e.g. `<li><a href="Containers">Containers</a> — software installed here: one container per entry, with its worker</li>`.

Write full block paths in notes, never paths relative to a guess.

## 6. Answer the user

Give the result the worker reported. Mention that the software now lives in a container recorded
in `<root>/Notes/Containers`, so next time it is reused.
