---
name: omega-dev-machine
description: Use when development work needs the user's Dev Machine — before the first Dev Subagent job of a conversation — or when the user asks whether they have a dev machine, asks you to set one up, or says theirs is broken or missing.
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.

# Dev Machine

## The model

A **Dev Machine** is three blocks in the user's workspace that together give a Dev Subagent a
computer to work on:

- a **Devcontainer** (the image), whose `devcontainer-json` `mounts` attach
- a **Volume**, the **Dev Volume**: persistent disk where the repositories, specs and plans live, and
- a **Worker**: a service account whose sessions boot that Devcontainer.

The **Dev Machine Record** is the note page `<root>/Notes/Dev Machine`, linked from
`<root>/Notes/README`. It says which blocks they are. This skill ends with a ready Dev Machine and
its seven values — Workspace, Devcontainer, Volume, Mount, Worker, Repos, Plans — or stops and tells
the user why.

`<root>` is your working root (`omega-navigation`). At the workspace root, paths have no prefix:
`Notes/Dev Machine`, `Resources/Containers@dev-machine`. Today's date is `date -u +%F` in your
shell.

## 1. Find the record

Read `<root>/Notes/README` (for the Home workspace it is already in your system prompt). If it links
`Notes/Dev Machine`, `read` that page and go to step 3.

## 2. No record yet

1. **Look in your notes.** Open every note page `<root>/Notes/README` links whose name or line
   mentions containers, devcontainers, workers or development. For every devcontainer block they
   name, `block_devcontainer_get` it. It is a candidate when its `devcontainer-json` has a `mounts`
   entry and a note names a worker (a service-account block) that runs it.
2. **One candidate:** tell the user its devcontainer, its Volume (the mount's `source`), the mount's
   `target` and its worker, and ask: "Shall I use this as your dev machine?" End your turn. On yes,
   write the record (step 4), then check it (step 3).
3. **Several candidates:** list them the same way and ask which one. End your turn.
4. **None:** if the user already asked you to set one up, go to step 5. Otherwise ask: "You don't
   have a dev machine recorded. If you have one, tell me its devcontainer's page path; otherwise I
   can set one up for you — shall I?" End your turn. A path → check it as in 1, then 2. A yes →
   step 5.

Look only in your working root and your notes; never search other folders for a machine.

## 3. Check it

Do this once per conversation, before the first Dev Subagent job, and right after writing a record.

1. If a note says a credential of this machine (its worker's key, its GitHub sign-in) is exposed or
   must be rotated or re-authorised before use, and the record has no `Go-ahead` line, tell the user
   what the note says and ask whether to go ahead. End your turn. On their yes, add
   `<li>Go-ahead: <code>{today's date} — {the user's words}</code></li>` as the record's last line
   (`set_html` on `Content`, everything else as read) and continue; do not ask again while that line
   is there.
2. `block_devcontainer_get` the Devcontainer.
   - **Not found:** repair it (step 6.1).
   - **`failed`:** tell the user its `build-error` and stop.
   - **`pending` or `building`:** wait as `omega-devcontainers` says (`sleep 30` between reads, up
     to 15 minutes).
   - **`ready`:** refresh it — `write_data` on the Devcontainer with
     `{"devcontainer-json": "<its devcontainer-json exactly as you just read it>"}` — then `sleep 30`
     and read it until it is `ready` again. Unchanged, it is ready at once; if OmegaAI was updated
     since its last build it rebuilds, so Dev Subagents get the current skills.
3. `block_volume_get` the Volume. **Not found:** tell the user: "Your dev machine's disk
   (<Volume>) is gone, and the repositories, specs and plans that were on it." Ask whether to
   create a new, empty one (step 6.2). End your turn.
4. `block_service_account_list`. The Worker is there when an entry's `name` equals the part of the
   Worker path after `@`. **Not there:** repair it (step 6.3).
5. Update the record's `Checked` line to today's date: `set_html` on `<root>/Notes/Dev Machine`,
   block `Content`, with the whole record as read and only that line changed; `read` it back. Hand
   the seven values to the Coordinator.

## 4. Write the record

`ls "<root>/Notes"` first. If it lists `Dev Machine` although the README does not link it, `read` it:
if it records a machine, add the README line below and go to step 3 with it; write nothing else.
Otherwise `add_page` with `parent_path` `<root>/Notes` and name `Dev Machine` (create `<root>/Notes`
first if it is missing), then `set_html` on `<root>/Notes/Dev Machine`, block `Content`, with this
HTML, each `{…}` replaced by its value, and `<`, `>`, `&` inside a value written as `&lt;`, `&gt;`,
`&amp;`:

```html
<h1>Dev Machine</h1>
<p>The computer Dev Subagents work on. Read by omega-dev-machine; change it only through that skill.</p>
<ul>
<li>Workspace: <code>{app id}</code></li>
<li>Devcontainer: <code>{devcontainer Page@Name}</code></li>
<li>Devcontainer JSON: <code>{its devcontainer-json, exactly as read}</code></li>
<li>Volume: <code>{volume Page@Name}</code></li>
<li>Mount: <code>{mount target}</code></li>
<li>Worker: <code>{worker Page@Name}</code></li>
<li>Repos: <code>{repos directory}</code></li>
<li>Plans: <code>{plans directory}</code></li>
<li>Checked: <code>not yet</code></li>
</ul>
```

- **Repos** is the directory that holds the clones: the one the notes give (for a layout
  `/workspace/work/omega/<repo>` it is `/workspace/work/omega`), or `{mount target}/repos` when the
  notes give none.
- **Plans** is `{mount target}/.omega`.

Then add ONE line to `<root>/Notes/README`: `read` it — the result gives its block name and HTML —
add `<li><p><strong>Notes/Dev Machine</strong> — the dev machine: its devcontainer, disk, worker and
folders.</p></li>` after the last `<li>` of its first `<ul>`, keep everything else exactly as read,
`set_html` on that block name, and `read` both pages back.

## 5. Set one up

Say in one sentence that you are setting up a dev machine and that it takes a few minutes.

1. `add_page` `<root>/Resources` and `<root>/Resources/Containers` if they are missing.
2. **Volume:** `block_volume_create` with `page` `<root>/Resources/Containers`, `name`
   `dev-machine-work`. Then `write_data` on `<root>/Resources/Containers@dev-machine-work` with
   `{"volume-spec": {"name": "dev-machine-work", "description": "Dev Volume: repositories, specs
   and plans", "size": 21474836480}}` (20 GiB). `block_volume_get` it: `size` is `21474836480`.
3. **Devcontainer:** `block_devcontainer_create` with `page` `<root>/Resources/Containers`, `name`
   `dev-machine`. Then `write_data` on `<root>/Resources/Containers@dev-machine` with
   `{"devcontainer-json": "{\"features\":{\"apt\":[\"ca-certificates\",\"curl\",\"jq\",\"ripgrep\"]},\"mounts\":[{\"source\":\"<root>/Resources/Containers@dev-machine-work\",\"target\":\"/workspace/work\"}]}"}`
   — the value is a JSON string, with `<root>/` written out (or left out at the workspace root).
   Wait for `ready` (`sleep 30` between reads, up to 15 minutes).
4. **Worker:** `block_service_account_create` with `page` `<root>/Resources/Containers`, `name`
   `dev-machine-worker`.
5. Write the record (step 4) with Mount `/workspace/work`, Repos `/workspace/work/repos`, Plans
   `/workspace/work/.omega`.
6. Tell the user it is ready and which note records it.

## 6. Repair a missing part

Use the page and name the record gives, then update the record's `Checked` line (step 3.5).

1. **Devcontainer:** `block_devcontainer_create`, then `write_data` with the record's Devcontainer
   JSON as `devcontainer-json`; wait for `ready`.
2. **Volume:** `block_volume_create`, then `write_data` with the whole `volume-spec` as in step 5.2,
   with the record's Volume name.
3. **Worker:** `block_service_account_create`.

## Rules

- Never delete a block, never shrink a Volume, and never change a mount's `source` or `target`.
- Leave a worker's default devcontainer as it is; every session names its devcontainer, so do not
  set one.
- This skill opens no sessions; `omega-dev-coordinate` does.
- A tool that fails: tell the user the exact error and stop.
