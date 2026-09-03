---
name: omega-components
description: Umbrella model skill for OmegaAI components — component vs package, library (a definition) vs install (a running instance), and the guardrail against running a library directly. Read this first, then follow to a child skill for the specific journey (consuming, developing).
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Omega Components

## When to use

Whenever "component", "package", "library", or "install" comes up and you need the shared vocabulary before doing anything — this skill holds the model, not the task steps. It exists to be linked FROM other skills, not to be the whole answer.

## The model

- A **component** is a reusable definition: a protocol (interface) plus an implementation (the code that satisfies it).
- A **library** is the page tree, in the OWNER's workspace, where a component is DEFINED. It is source code — just that, nothing runs by visiting it.
- An **install** is a page whose type is set to a component — the RUNNING INSTANCE. It's your data/config plus a reference `{app-id, component-id}` pointing back at the library. Dispatch resolves that reference at call time; you never get a copy of the library's code.
- A **package** is the discoverable, installable unit wrapping a component for a consumer workspace (see `omega-skills:omega-packages` for that journey).

## The guardrail

**A library page is a definition, not an executable. You never `run` a library.** Set its component onto an install page (`set-component`), then `describe` and `run` THAT install page — never the library page itself.

## Children

- `omega-skills:omega-packages` — the CONSUMER journey: discover, install, set-component, describe, run/export_csv.
- A future producer-side sibling skill — developing component libraries and publishing packages via `qo push` — is anticipated but not yet created.
