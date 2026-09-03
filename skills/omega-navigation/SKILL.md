---
name: omega-navigation
description: Use when you have the query-omega OmegaAI MCP tools and need to find your bearings in a workspace — establishes the standard entry convention (list workspaces, pick the active one, ls the root, read the root README and follow its links) and how to find out what an unfamiliar page is and what can be called on it (describe, then run).
---

**This is the ROOT skill of the Omega skills tree.** It has no parent. Every other Omega skill is a
child of this one and will tell you to come here first.

## Children

Invoke a child only after you have read this skill. Each says what it is for:

- **`omega-database-pages`** — writing to a database page: rows, row pages, and setting a row's
  column values. Use it before any `write` to a database page.
- **`omega-components`** — the component / library / install model. Use it before touching a
  component or an install.
- **`omega-devcontainers`** — defining and building a devcontainer image from a features spec.
- **`omega-packages`** — discovering, installing, and using OmegaAI packages.

# Omega Navigation

## When to use

Whenever you have the `query-omega` MCP tools (`list_workspaces`, `ls`, `get`, `read`, `write`, `describe`, `run`, etc.) available and need to orient yourself in an OmegaAI workspace — at the start of a session, when you're unsure what a workspace contains, when you've lost context on where things live, or when you've found a page and need to know what it is and whether you can call it.

## The entry convention

1. **List workspaces.** Call `list_workspaces` to see the workspaces you have access to and which one is currently active.
2. **Pick the active workspace**, unless the user has clearly asked you to work in a different one.
3. **List the root.** Call `ls` with no `page_path` (i.e. at the workspace root) to see the top-level pages.
4. **Read the root README.** Open the `README` page at the workspace root (`read "README"`). This is the canonical operator entry point and index — every workspace keeps one, and it links out to everything else (guides, notes, per-area "Skills" pages). If there is genuinely no root `README`, fall back to a `Notes/README` or the first child under `Notes`.
5. **Follow its links.** From the root `README`, follow the links and structure it describes, using `ls` and `read` to reach guides, `Skills/…` pages, and data.
6. **When you land on a page you don't recognize, `describe` it rather than guessing from its name or path.** See "Finding out what a page is" below.

## Conventions

OmegaAI workspaces are trees of pages addressed by slash-delimited paths (e.g. `Notes/README`, `Component Installs/some-package`). A few conventions hold across most workspaces:

- **Folder pages** contain sub-pages — `ls` on a folder page lists its children.
- **Database pages** hold rows. Before you `query` a database page, check its `primary-key` (from `describe`) so you understand how rows are identified — `query` is database-page-specific, unlike `describe`, which works on any page.
- **The operator entry point is the root `README`**, which links to `Notes/` and any `Skills/…` guide pages. Documentation and notes live under `Notes/`; operator guides for a specific area live under `Skills/<area>/`.
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
- **One workspace at a time**, unless the user explicitly tells you to work across multiple workspaces.
