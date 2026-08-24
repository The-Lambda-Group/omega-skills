# Omega Skills

Generic, public Hermes agent skills for working with OmegaAI via the query-omega MCP.

Drop a skill's folder into your agent's skills directory.

## Skills

- [`skills/omega-navigation`](skills/omega-navigation) — the standard entry convention for orienting in an OmegaAI workspace (list workspaces, pick the active one, ls the root, enter Notes/README).
- [`skills/omega-components`](skills/omega-components) — the shared model for components, packages, libraries, and installs (read before any component work).
- [`skills/omega-packages`](skills/omega-packages) — the consumer journey: discover, install, set-component, describe, and run a package.
- [`skills/omega-devcontainers`](skills/omega-devcontainers) — define and build a devcontainer: the features spec (apt/pip/run + mounts), the build-status lifecycle, and reading the built image.
