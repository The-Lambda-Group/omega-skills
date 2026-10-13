---
name: omega-dev-develop-surface
description: Use when a Dev Subagent carrying out a plan task replies with anything other than the task done, committed and pushed — an error, a repeated failure, an unexpected finding, a conflict with how the code works, or a stop without a clear reason — or when a Dev Subagent's job message says to follow omega-dev-develop-surface.
---

**Parent skill: `omega-dev-develop`.** If you have not invoked `omega-dev-develop` yet, invoke it
first — it says how a plan is carried out — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Surface

A task that did not come back clean is understood before anything is tried again. You route; Dev
Subagents investigate and fix.

## Coordinator

1. **Classify** the reply, from its own words:
   - `TOOL` — an OmegaAI tool, the container, a clone, a sign-in or a push failed;
   - `FLOG` — the same error twice;
   - `FIND` — a fact the plan did not expect;
   - `ARCH` — the task contradicts how the code works;
   - `UNKNOWN` — it stopped and did not say why.
2. **`TOOL`:** handle it as `omega-dev-coordinate` §4 says (a GitHub sign-in link, or tell the user
   the exact error and stop). Nothing else in this skill applies.
3. **Probe.** Dispatch a Dev Subagent with part "Probe": the plan path, the task number, and the
   failed reply quoted word for word — not your guess at the cause. Report: the cause, with every
   file and line it rests on.
4. **No file and line in the report:** tell the user the classification and the report, and stop.
   Do not dispatch a second probe.
5. **Revise.** Follow `omega-dev-revise` with the AI Self-Revision Ledger, entry text
   `Surface <class>. Error: <the error in one line>. Finding: <one sentence>. Readings: <the files
   and lines>.`, and the task corrected in place — same number.
6. **Re-dispatch** the corrected task once (`omega-dev-develop` step 2). If it is not clean again,
   tell the user and stop.

Never look into the failure yourself, and never send a Dev Subagent your theory as a fact.

## Dev Subagent — part "Probe"

Sign in as `omega-dev-develop`, part "Task", step 2 says, in the clone directory the job gives. Read
the plan task, the failed reply in the job, the repository's files and docs that bear on it, and
`git log` / `git diff` on the branch. Find the cause. Change nothing, commit nothing. Reply with the
cause and every file and line it rests on.
