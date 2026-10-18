---
name: omega-dev-retro
description: Use when a plan's Status is done and no retro exists for it, when the user asks for a retro or a wrap-up of finished development work, or when a Dev Subagent's job message says to follow omega-dev-retro.
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Retro

A retro is the record of how a finished plan went: what was built, what went wrong, what the user
changed, and what is left. It reads the spec, the plan and their ledgers, changes nothing in the
repository, and writes one file on the Dev Volume. Because it changes nothing outside the Dev
Volume, you run it when the plan's Status becomes `done`, without asking; the user's approval is
for `omega-dev-close-out`, not for this.

## Coordinator

1. Know the Plan Name. Read its row in `<root>/Notes/Plans`; its Status must be `done`. If it is
   not, tell the user which Status it has and stop.
2. Dispatch a Dev Subagent (`omega-dev-coordinate`, "Dispatch a Dev Subagent") with part "Retro":
   the Plan Name, the spec path, the plan path, the repository and branch from the row, and the
   final test report you gave the user, quoted. Report: the retro path and its headings, in at
   most 30 lines. The job is short; it does not need the plan-only devcontainer.
3. Tell the user, in a few lines: what the retro says went wrong and what it says is left. Then
   say that closing out is the next step and is theirs to approve (`omega-dev-close-out`).

## Dev Subagent — part "Retro"

1. Read the spec and the plan named in the job, including both ledgers (`## User Feedback Ledger`,
   `## AI Self-Revision Ledger`), and `git log --oneline` of the branch and `git status -sb` in the
   clone if it still exists. Change nothing.
2. Write `<Plans>/retros/<Plan Name>.md` (create the directory if it is missing) with exactly these
   headings:

   - `# Retro: <topic>`, then `**Date:**` (`date -u +%F`), `**Spec:**`, `**Plan:**`, `**Branch:**`
     and the last commit.
   - `## What Was Built` — one paragraph.
   - `## Incident Log` — one entry per thing that went wrong or surprised: what happened, the
     impact, the fix. If nothing did, `No incidents.`
   - `## Tests Run` — each test command that was executed and its result line. A test that was
     written but not run is listed as not run, with the reason.
   - `## Documentation` — docs changed, docs left unchanged and why, docs missed. A missed doc is
     follow-up work, not a failure to hide.
   - `## User Feedback Ledger Review` and `## AI Self-Revision Ledger Review` — what each entry
     changed. `No entries.` when a ledger is empty.
   - `## Open Items` — branches not merged, clones kept, devcontainers or fixtures still present,
     follow-up work. One line each.
   - `## What Went Well` and `## What To Improve Next Time`.
3. Reply with the retro path and its headings.
