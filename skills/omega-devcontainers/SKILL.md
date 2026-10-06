---
name: omega-devcontainers
description: How to define and build a devcontainer in OmegaAI — a reproducible per-container image built from a small features spec (apt/pip/run + mounts). Covers the spec shape, the build-status lifecycle, reading the resulting image, and the common gotchas (locked base image, no pip preinstalled, supported keys only).
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Omega Devcontainers

## When to use

When an agent or account needs to run in a container with extra tools installed — a python package, an apt package, a setup command — instead of the stock sandbox. You describe what you want in a **devcontainer block**, OmegaAI builds a real image for it, and pods for that block boot from your image.

Prerequisite vocabulary (block, page, `@path`): see `omega-skills:omega-navigation`.

## The model

- A **devcontainer** is a block on a page (`Page@Name`, e.g. `Resources/Containers@my-env`). It holds a spec and, after a build, a pointer to a built image.
- Writing a spec **triggers a build**. A builder renders your features into an image layered on the locked base sandbox image, builds it, and stores it. You never manage the build yourself — you write the spec and read the status.
- The build is **idempotent**: an unchanged spec reuses the existing image (no rebuild). Change the spec and it builds again.
- Once the status is `ready`, pods for that devcontainer boot from **your** image, with your tools baked in.

## The spec

The spec is a JSON string on the block's `devcontainer-json` field. Only two top-level keys are supported; anything else is rejected (see Gotchas):

```json
{
  "features": {
    "apt": ["python3-pip", "jq"],
    "pip": ["six", "requests"],
    "run": ["echo hello > /etc/motd"]
  },
  "mounts": []
}
```

- **`features.apt`** — apt packages to install (`apt-get install`).
- **`features.pip`** — pip packages (installed with `pip3`).
- **`features.run`** — arbitrary shell commands, run in order, after the package installs.
- **`mounts`** — volumes to attach (see your volume/mount setup).

Each entry becomes a build step, applied in order: apt first, then pip, then each `run` command.

## Writing the spec (what triggers the build)

Set `devcontainer-json` on the block — via the CLI (`qo write "Resources/Containers@my-env" --data '{"devcontainer-json":"…"}'`) or the MCP `write_data` patch. The write returns immediately with `build-status: pending`; the build runs in the background.

Create the block first if it doesn't exist (get-or-create), then write the spec onto it.

## Build-status lifecycle

Read the block back (`qo block devcontainer get "Resources/Containers@my-env"`, or MCP `block_devcontainer_get`) and watch `build-status`:

| Status | Meaning |
|--------|---------|
| `none` | No spec written yet — nothing built. |
| `pending` | Spec accepted; build queued. |
| `building` | Image is being built. The block is **locked** — writing again throws `BuildInProgress`. |
| `ready` | Done. `image-tag` now holds the built image reference; pods boot from it. |
| `failed` | Build failed. `build-error` holds the build log — read it to see which step broke. |

Three fields carry the result: `build-status`, `image-tag` (set on `ready`), and `build-error` (set on `failed`).

A typical build takes from tens of seconds up to a couple of minutes, longer if you install a lot via apt.

## Gotchas

- **The base image ships minimal — no `pip3` preinstalled.** A `pip`-only spec fails with `pip3: not found`. Install it first: put `"apt": ["python3-pip"]` in the same spec, which pulls in python3 + pip3, then your `pip` entries work.
- **Only `mounts` and `features` are supported at the top level.** Any other devcontainer.json key (e.g. `postCreateCommand`, `image`, `build`) is rejected with a typed `omega/query-omega/devcontainer/UnsupportedKey` error naming the offending key. Inside `features`, only `apt`, `pip`, and `run` are allowed.
- **The base image is locked — you cannot override the `FROM`.** You layer onto the standard sandbox base; you don't pick a different one. That's what keeps every devcontainer consistent and buildable.
- **You can't write while a build is in flight.** A save during `building` throws `omega/query-omega/devcontainer/BuildInProgress`. Wait for `ready`/`failed`, then write again.
- **Read `build-error` on failure.** It's the actual build log, so the failing step (a missing apt package, a pip resolution error, a bad `run` command) is visible directly.

## A minimal end-to-end

1. Create the block: `Resources/Containers@my-env`.
2. Write `{"features":{"apt":["python3-pip"],"pip":["six"]}}` onto `devcontainer-json`.
3. Poll `build-status` until `ready`.
4. `image-tag` now names your image; pods for this devcontainer boot from it.

If it comes back `failed`, read `build-error`, fix the spec, and write again.

## Using the image

A built image does nothing until something runs in it. To run work with the installed software,
open a session on a **worker** (a service account) bound to this devcontainer and send it the job —
see `omega-installing-software`. Your own session cannot switch to it.

## Git with GitHub (OAuth sign-in)

To clone or push GitHub repositories — from your own session's container or any devcontainer — never ask the user for a password, an SSH key or a token, and never store one. Use the OmegaAI **OAuth** package instead: the user signs in to GitHub once, from any browser (a phone works), and git asks for a fresh token each time. **You do not need a devcontainer or a worker for this:** git, qo and node are already in every OmegaAI container, so set it up in the shell you are in.

1. Read the package docs. They are public, so this works from any workspace:
   `qo page read "Public/OAuth/README" --app-id 3b12bbed-213d-4945-a7e7-078f47c90ced`
2. Follow its **Connect** section: install an OAuth Client in your workspace (for example at `Connections/GitHub`) from the `github` entry of `Public/OAuth Servers`, then send the user the link `get-auth-url` answers. Page props need the `qo` CLI; there is no MCP verb for them.
3. Follow `qo page read "Public/OAuth/devcontainer-git" --app-id 3b12bbed-213d-4945-a7e7-078f47c90ced`: it installs a git credential helper that asks the OAuth Client for the token on every HTTPS git operation. Use `https://github.com/...` remotes, not `git@github.com:...`.

If the helper prints `oauth/NotConnected`, `oauth/TokenExpired` or `oauth/BadState`, the user needs a new sign-in link: run `get-auth-url` again and send it.
