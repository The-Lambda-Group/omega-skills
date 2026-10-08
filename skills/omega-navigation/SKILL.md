---
name: omega-navigation
description: Use when you have the query-omega OmegaAI MCP tools and need to find your bearings in a workspace — establishes the standard entry convention (know your Home and Session workspaces, read your memory in the Home workspace's Notes/README, ls the Session workspace's root, read its Notes/README and follow its links) and how to find out what an unfamiliar page is and what can be called on it (describe, then run).
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
- **`omega-packages`** — discovering, installing, and using OmegaAI packages.
- **`omega-present-file`** — handing the user a public link to a file you have or produced (a
  report, an export, an image). Use it whenever the answer is a file, not chat text.

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
2. **Read your memory: the Home workspace's `Notes/README`.** `read "Notes/README"` with the Home
   workspace's `app_id`, and open the note pages it links that matter for the task. If it does not
   exist yet, you have no memory yet; carry on.
3. **List the root.** Call `ls` with no `page_path` (i.e. at the workspace root) and the Session workspace's `app_id` to see the top-level pages.
4. **Read the site map: the Session workspace's `Notes/README`.** Open it with `read "Notes/README"` and the Session workspace's `app_id` (when the Session workspace is the Home workspace, step 2 already read it). This is the canonical operator entry point — the workspace's site map. It is a tree, and you navigate it **one branch at a time, one leaf at a time**: read the README, pick the one branch relevant to your task, `ls` that branch, `read` the one leaf you need. Do not sweep the whole workspace. If there is genuinely no `Notes/README`, fall back to a root `README` or the first child under `Notes`.
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
