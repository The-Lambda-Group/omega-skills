---
name: omega-dev-plan
description: Use when the user approves a spec and wants the implementation plan written, or when a Dev Subagent's job message says to follow omega-dev-plan.
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Plan

From an approved spec to a plan a Dev Subagent can carry out one task at a time, with nothing left
to guess.

## Coordinator

1. The plan's Plans Index row must have Status `spec`. Get the Dev Machine (`omega-dev-coordinate`
   §1).
2. Dispatch a Dev Subagent with part "Write the plan": the spec path, the plan path
   (`<Plans>/plans/<Plan Name>.md`), the repository URL and base branch from the plan's row, and the
   branch
   `feat/<topic>`. Report: one line per task, the Definition of Done items, and the three things it
   is least sure of.
3. After a clean reply, set the row's Status to `planned`, its Plan to the plan path and its Branch to the branch.
4. Tell the user the Definition of Done and the three uncertainties, and that they can change
   anything by telling you.

## Dev Subagent — part "Write the plan"

1. Read the spec. Sign in and clone exactly as `omega-repo-work` steps 1 and 2 say, with the Repos directory as
   the place the clone goes (`cd <Repos>`). Run only the setup and the check from
   `qo page read "Public/OAuth/devcontainer-git" --app-id 3b12bbed-213d-4945-a7e7-078f47c90ced`;
   installing the OAuth Client and getting a sign-in link are the Coordinator's. If the check fails
   — an error type such as `oauth/NotConnected`, or no OAuth Client in the workspace — stop and
   reply with the exact error.
   Read every file the spec's Affected Files names, the tests next to them, and the docs the README
   points to.
2. Write the plan in this template:

   ```markdown
   # <Title> — Plan

   **Spec:** <spec path>
   **Repository:** <URL>   **Base branch:** <base>   **Branch:** feat/<topic>

   ## Definition of Done
   ## Traversal Log
   ## File Map
   ## Rules
   ## Tasks
   ## User Feedback Ledger
   ## AI Self-Revision Ledger
   ```

   - **Definition of Done:** each item is something true when the work is finished, with the exact
     command that checks it and its exact expected output.
   - **Traversal Log:** one line per file you read: `` - `path` — what it revealed ``.
   - **File Map:** every file the plan creates or changes, one line each, with what it is for.
   - **Rules:** exactly these five lines: push only the branch `feat/<topic>`; never merge, never
     force-push, never push the base branch; a failing test or build of the code you are writing is
     the work — fix it and run it again; the same error twice after a fix → stop and report; a
     failing tool, container, sign-in or clone, or a push still rejected after `omega-repo-work`
     step 7's one `git pull --rebase` → stop and report the exact error.
   - **Tasks:** `### Task N: <subject>`, numbered from 1, in the order they must be done. Each has
     **Files**, **Steps** — every code change shown as the code itself, never described — a
     **Verify** line after each step (an exact command and its exact expected output), and the
     **Commit message**.
   - **Plan-only devcontainer:** when the work needs more than the Dev Machine's image (a database,
     a compiler), or the user said not to use the Dev Machine's Devcontainer, the plan's first lines
     under Tasks are `Plan-only devcontainer:` followed by a block name (the Dev Machine's
     Devcontainer name, a hyphen, the topic) and its `devcontainer-json` (the Dev Machine's `mounts`
     copied, plus the features the work needs and `curl` and `jq`). The Coordinator creates and
     deletes it (`omega-dev-coordinate`).
   - **Cleanup:** when the work creates workspaces, crons or devcontainer blocks, Task 1 saves the
     list of the ones that exist now to the Plans directory under the Plan Name with the ending
     `.before` (for crons, `qo page read PAGE-PATH` on each page that owns one), and the Definition of Done has an item whose command
     lists them again and shows the same list. Each task that creates them removes them
     (`omega-dev-develop`, "Remove what the task created").
   - Both ledgers start empty.
3. Check it once, and fix what fails: run every Verify command whose files already exist and record
   what it prints; a Verify for code a task creates states the exact output it must print once that
   task is done. No `TBD`, no "similar to Task N", no step without its code, no check without its
   exact output.
4. Reply with the Report the job asks for.
