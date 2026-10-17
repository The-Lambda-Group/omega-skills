# Omega Skills

Generic, public Hermes agent skills for working with OmegaAI via the query-omega MCP.

Drop a skill's folder into your agent's skills directory.

## Skills

- [`skills/omega-navigation`](skills/omega-navigation) — the standard entry convention for orienting in an OmegaAI workspace (know your Home and Session workspaces, read your memory in the Home workspace's Notes/README, ls the Session workspace's root, enter its Notes/README).
- [`skills/omega-components`](skills/omega-components) — the shared model for components, packages, libraries, and installs (read before any component work).
- [`skills/omega-packages`](skills/omega-packages) — the consumer journey: discover, install, set-component, describe, and run a package.
- [`skills/omega-devcontainers`](skills/omega-devcontainers) — define and build a devcontainer: the features spec (apt/pip/run + mounts), the build-status lifecycle, reading the built image, and git with GitHub through an OAuth sign-in.
- [`skills/omega-present-file`](skills/omega-present-file) — hand the user a public link to a file: copy it into `ARTIFACT_DIR`, reply with `ARTIFACT_BASE_URL/<name>`.
- [`skills/omega-installing-software`](skills/omega-installing-software) — install software the only way an agent can: build a devcontainer with it, run the work on a worker agent in that container, and record the container in Notes for reuse.
- [`skills/omega-repo-work`](skills/omega-repo-work) — write code in a git repository from a container: clone on a volume, branch, test, commit, push only the branch, build or render.
- [`skills/omega-post-reel`](skills/omega-post-reel) — a 15-second reel a company could post, made from its own public pages on the render worker: find the reason a customer buys, tell it as a story, review stills, render, hand over the link and the Handoff Sheet; it sends nothing to anyone but the user.
- [`skills/omega-interrupted-turn`](skills/omega-interrupted-turn) — a worker's turn was cut off (the service was restarted, a node was lost): tell the user, send the one message that continues it, stop after two.
- [`skills/omega-long-running-work`](skills/omega-long-running-work) — a shell job longer than ten minutes, or a service (a database, an engine) that later bash calls of your turn use: run it in the background on a volume and check on it every nine minutes.
- [`skills/omega-dev-coordinate`](skills/omega-dev-coordinate) — development work: the agent talking to the user coordinates, Dev Subagents on the user's Dev Machine do the file and code work.
- [`skills/omega-dev-machine`](skills/omega-dev-machine) — find, check, set up or repair the Dev Machine (devcontainer + volume + worker) and its Notes record.
- [`skills/omega-dev-brainstorm`](skills/omega-dev-brainstorm) — from an idea to an approved spec.
- [`skills/omega-dev-plan`](skills/omega-dev-plan) — from an approved spec to a plan.
- [`skills/omega-dev-revise`](skills/omega-dev-revise) — ledgered, in-place changes to a spec or plan.
- [`skills/omega-dev-develop`](skills/omega-dev-develop) — a plan carried out one task per Dev Subagent.
- [`skills/omega-dev-develop-surface`](skills/omega-dev-develop-surface) — a task that did not come back clean.
- [`skills/omega-commander`](skills/omega-commander) — look after the user's other sessions: name them, give them goals, message them, and tell the user which ones need them.

## The skills tree

Skills form a tree. Each skill names its parent in its first line; the root names its children.
Invoke the parent before a child — the parent establishes the context the child assumes.

- **`omega-navigation`** (ROOT) — orientation: list workspaces, `ls` the root, read the README,
  `describe` an unfamiliar page.
  - **`omega-database-pages`** — creating a database page (columns, key, views, README entry) and
    writing to one: rows, row pages, a row's column values.
  - **`omega-components`** — the component / library / install model.
  - **`omega-devcontainers`** — defining and building a devcontainer image.
  - **`omega-packages`** — discovering and installing packages.
  - **`omega-present-file`** — handing the user a public link to a file.
    - **`omega-installing-software`** — installing software: a devcontainer plus a worker, recorded in Notes.
      - **`omega-post-reel`** — a reel a company could post, rendered on the worker from its own pages.
  - **`omega-long-running-work`** — a shell job longer than ten minutes, or a service later bash calls need.
  - **`omega-repo-work`** — writing code in a git repository: clone on a volume, branch, commit, push, build.
  - **`omega-dev-coordinate`** — development work: you converse, Dev Subagents work.
    - **`omega-dev-machine`** — the Dev Machine and its record.
    - **`omega-dev-brainstorm`** — idea → approved spec.
    - **`omega-dev-plan`** — spec → plan.
    - **`omega-dev-revise`** — ledgered changes.
    - **`omega-dev-develop`** — plan → commits.
      - **`omega-dev-develop-surface`** — a task that did not come back clean.
  - **`omega-commander`** — looking after the user's other sessions: names, goals, messages, the board.
