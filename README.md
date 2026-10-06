# Omega Skills

Generic, public Hermes agent skills for working with OmegaAI via the query-omega MCP.

Drop a skill's folder into your agent's skills directory.

## Skills

- [`skills/omega-navigation`](skills/omega-navigation) — the standard entry convention for orienting in an OmegaAI workspace (list workspaces, pick the active one, ls the root, enter Notes/README).
- [`skills/omega-components`](skills/omega-components) — the shared model for components, packages, libraries, and installs (read before any component work).
- [`skills/omega-packages`](skills/omega-packages) — the consumer journey: discover, install, set-component, describe, and run a package.
- [`skills/omega-devcontainers`](skills/omega-devcontainers) — define and build a devcontainer: the features spec (apt/pip/run + mounts), the build-status lifecycle, reading the built image, and git with GitHub through an OAuth sign-in.
- [`skills/omega-present-file`](skills/omega-present-file) — hand the user a public link to a file: copy it into `ARTIFACT_DIR`, reply with `ARTIFACT_BASE_URL/<name>`.
- [`skills/omega-installing-software`](skills/omega-installing-software) — install software the only way an agent can: build a devcontainer with it, run the work on a worker agent in that container, and record the container in Notes for reuse.

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
