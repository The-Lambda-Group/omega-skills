---
name: omega-navigation
description: Use when you have the query-omega OmegaAI MCP tools and need to find your bearings in a workspace — establishes the standard entry convention (know your Home and Session workspaces, read your memory in the Home workspace's Notes/README, ls the Session workspace's root, read its Notes/README and follow its links), how to create a missing Notes/README, and how to find out what an unfamiliar page is and what can be called on it (describe, then run).
---

**This is the ROOT skill of the Omega skills tree.** It has no parent. Every other Omega skill is a
child of this one and will tell you to come here first.

## Children

Invoke a child only after you have read this skill. Each says what it is for:

- **`omega-database-pages`** — creating a database page (columns, key, views, README entry) and
  writing to one: rows, row pages, a row's column values. Use it before any `add_page … database`
  or `write` to a database page.
- **`omega-components`** — the component / library / install model. Use it before touching a
  component or an install.
- **`omega-devcontainers`** — defining and building a devcontainer image from a features spec.
- **`omega-installing-software`** — you need a program or library you don't have (`command not
  found`). You never install into yourself: build a container with it, hand the work to a worker
  running in that container, and record the container in your notes.
- **`omega-long-running-work`** — a shell job that takes longer than ten minutes: start it in the
  background, keep its files on a volume, and check on it every nine minutes without ending your turn.
- **`omega-repo-work`** — writing or changing code in a git repository: the clone on a volume, a
  branch from the base, the repo's own docs first, commits, pushing only your branch, and building it.
- **`omega-packages`** — discovering, installing, and using OmegaAI packages.
- **`omega-present-file`** — handing the user a public link to a file you have or produced (a
  report, an export, an image). Use it whenever the answer is a file, not chat text.

Creating a missing `Notes/README` is not a child skill: it is the section "Creating a Notes/README"
below, in this skill.

# Omega Navigation

## When to use

Whenever you have the `query-omega` MCP tools (`list_workspaces`, `ls`, `get`, `read`, `write`, `describe`, `run`, etc.) available and need to orient yourself in an OmegaAI workspace — at the start of a session, when you're unsure what a workspace contains, when you've lost context on where things live, or when you've found a page and need to know what it is and whether you can call it.

## The entry convention

1. **Know your two workspaces.** Your **Home workspace** is your base: its `Notes/README` is your
   memory. Your **Session workspace** is where this session's work happens; pass its app id as every
   `app_id`. In the OmegaAI agent your system prompt names both (and may say there is no session
   workspace: then work in the Home workspace). Without such a system prompt, call `list_workspaces`:
   its `home-app-id` is your Home workspace, and you work in the workspace the user names, else the
   Home workspace. Never choose a workspace by `active-app-id` — it is only whatever was last
   selected in the app.
2. **Read your memory: the Home workspace's `Notes/README`.** In the OmegaAI agent its content is
   already in your system prompt, inside `<notes-readme>`: use it and do not read the page again.
   Otherwise `read "Notes/README"` with the Home workspace's `app_id`. Open the note pages it links
   that matter for the task. If it does not exist yet, create it ("Creating a Notes/README" below).
3. **List the root.** Call `ls` with no `page_path` (i.e. at the workspace root) and the Session workspace's `app_id` to see the top-level pages.
4. **Read the site map: the Session workspace's `Notes/README`.** When your system prompt carries it (inside `<notes-readme>`), use that; otherwise open it with `read "Notes/README"` and the Session workspace's `app_id` (when the Session workspace is the Home workspace, step 2 already has it). This is the canonical operator entry point — the workspace's site map. It is a tree, and you navigate it **one branch at a time, one leaf at a time**: read the README, pick the one branch relevant to your task, `ls` that branch, `read` the one leaf you need. Do not sweep the whole workspace. If there is genuinely no `Notes/README`, create one ("Creating a Notes/README" below); until it exists, fall back to a root `README` or the first child under `Notes`.
If the user tells you to work inside a folder (for example "work in `Test Installs/x`"), that
folder is your **working root**: its `Notes/README` is your site map, and everything you create
for the task goes under it.

5. **Follow its links.** From `Notes/README`, follow the branch it points you to, using `ls` and `read` to reach guides, `Skills/…` pages, and data. Blocks (devcontainers, volumes, service accounts, push connectors) do not appear in `ls` — the README names the page they live on, and `read` on that page shows them.
6. **When you land on a page you don't recognize, `describe` it rather than guessing from its name or path.** See "Finding out what a page is" below.

## Conventions

OmegaAI workspaces are trees of pages addressed by slash-delimited paths (e.g. `Notes/README`, `Component Installs/some-package`). A few conventions hold across most workspaces:

- **Folder pages** contain sub-pages — `ls` on a folder page lists its children.
- **Database pages** hold rows. Before you `query` a database page, check its `primary-key` (from `describe`) so you understand how rows are identified — `query` is database-page-specific, unlike `describe`, which works on any page.
- **The operator entry point is `Notes/README`**, the site map. It links to every branch of the workspace, including where infrastructure blocks live (e.g. `Resources/Containers` for devcontainers and volumes). Documentation and notes live under `Notes/`; operator guides for a specific area live under `Skills/<area>/`.
- **Memory lives in the Home workspace's `Notes/`**: notes about the user, their preferences and where things live, each its own page, indexed by the Home `Notes/README`. Notes about one workspace's contents (what was built there, where its pages and containers are) live in that workspace's own `Notes/`, and the Home `Notes/README` has a line linking that workspace's `Notes/README` by the workspace's name, its app id and the full page path.
- **Structured data** lives under dedicated database pages, not under `Notes/`.
- **Component installs** live under `Component Installs/`.

These are conventions, not guarantees — always confirm with `ls`/`get` rather than assuming a path exists.

## Creating a Notes/README

A workspace with no `Notes/README` gets one before you finish the task, so the next session starts
with a map. You know it is missing when your system prompt says the workspace "has no Notes/README
yet", or `read "Notes/README"` fails with `PageNotFoundException`. A `Notes/README` with no content
("a Notes/README page with no content") is written the same way, from step 3.

1. **Look first.** `ls` the workspace root, and `ls "Notes"` if it exists. Write only what you saw:
   a README that guesses is worse than a short one.
2. **Create the pages that are missing.** `add_page` with `parent_path` `.` and name `Notes` if
   there is no `Notes`; then `add_page` with `parent_path` `Notes` and name `README`. `add_page`
   returns an existing page instead of making a second one.
3. **Write it** with `set_html` on `Notes/README`, block name `Content`:
   - an `<h1>` naming the workspace, and one sentence saying this is its site map;
   - one `<h2>` per top-level branch you saw, with one `<li>` per page that matters: its full path
     and what it is for. Say on which page infrastructure blocks live (devcontainers, volumes,
     service accounts), because `ls` does not show blocks;
   - in the Home workspace, also a `<h2>Notes</h2>` list linking each note page, and, when you know
     other workspaces, a `<h2>Other workspaces</h2>` list with each one's name, app id and the full
     path of its `Notes/README`.
4. **Check it landed:** `read "Notes/README"` and confirm the block holds what you wrote.
5. **Link it from your memory** when this is not your Home workspace: `read "Notes/README"` with the
   Home workspace's `app_id` and, if it does not already name this workspace, add ONE line — the
   workspace's name, its app id and the full path `Notes/README` — with `set_html` on that README's
   existing block, keeping every other line. The block's name is the `block` attribute of the Home
   `<notes-readme>` in your system prompt, or in the `read` result. A `set_html` with any other
   block name adds a second block to the README instead of changing it.
6. **Tell the user** in one sentence that you created the workspace's `Notes/README`.

Keep it a map, not a manual: names and one-line purposes. Whenever you create something or learn
where something lives, add its line and keep every other line.

## Finding out what a page is

Every OmegaAI page has a *type*, and that type is a component — the default is a built-in plain-page type with nothing callable. A page's type determines what, if anything, can be called on it. `describe` is how you ask, and it works on any page, not just database pages. Use it in place of reading source code, which is otherwise the only way to learn what a page can do.

The sequence when you find an unfamiliar page:

1. **`ls`** the surrounding folder to confirm the page exists and see its siblings.
2. **`describe`** the page. It reports one of four things:
   - **Database page** — property names, primary key, and secondary indexes.
   - **Page with a component** — the component's name and documentation, plus each callable method rendered as `Protocol/method(args…)`, with docs for both the protocol and the implementation. This tells you exactly how to call it.
   - **Plain page** — the page has no component. This is a normal outcome, not an error; a folder or note page legitimately has nothing callable.
   - **A page whose component reference doesn't resolve** — `describe` names the missing component instead of silently reporting the page as plain.
3. **If `describe` reported callables**, invoke `run` with the `page_path`, `protocol`, and `method` it showed you, and args matching what the doc describes.

`describe` is safe and read-only — reach for it whenever you're unsure what a page is, before assuming it's inert or trying to reverse-engineer it from its path.

## Hard rules

- **Read before you write.** Never write to or modify a page you have not first read or listed.
- **Never fabricate a page path.** If you don't know whether a path exists, `ls` the parent to discover it — don't guess.
- **One workspace at a time** — the Session workspace, plus your memory in the Home workspace — unless the user explicitly tells you to work across multiple workspaces.
- **Delete only pages you created yourself in this task.** Deleting a page deletes every page and block under it, and a parent such as `Component Installs`, `Notes` or `Resources` holds other people's work. If something you made is in the wrong place, stop and tell the user; they decide what to remove.
