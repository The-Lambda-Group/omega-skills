---
name: omega-dev-brainstorm
description: Use when the user wants to brainstorm, explore or design a change to code before anything is built, or when a Dev Subagent's job message says to follow omega-dev-brainstorm.
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Brainstorm

From an idea to a spec the user has approved. The design comes out of the conversation — questions,
approaches, approval — and the spec is the record of what was decided together.

## Coordinator

1. **Set up.** Get the Dev Machine (`omega-dev-coordinate` §1). Choose the Plan Name and write its
   Plans Index row with Status `brainstorming`, the repository URL, and the base branch if the user
   named one (§2). When the first "Explore" reply reports the default branch, write it into the
   row's Base.

2. **Explore.** Dispatch a Dev Subagent (§3) with part "Explore": the repository URL, its base
   branch if the user named one (otherwise ask the Dev Subagent to report the default branch), the
   spec path, what the user wants, and what you need to know to ask good questions.
   Report: each file it read with one sentence on what it revealed, then the facts that bear on the
   idea.
3. **Ask.** One clarifying question per message, then end your turn. Write the question, its options
   and your recommendation as plain text in your reply. Never use the `question` tool or any tool that
   waits for an answer: the user reaches you through messages, a message cannot answer a tool call,
   and the session would wait for ever. Keep every question and the
   user's answer, word for word. Dispatch another "Explore" job whenever an answer opens a question
   only the code can settle.
4. **Approaches.** In one message, propose two or three distinct approaches with their trade-offs
   and your recommendation. End your turn. The user picks or redirects.
5. **Design.** Present the design in short sections — what changes, which files, how data flows,
   what happens on errors — asking after each whether it is right. Revise until the user says it
   is.
6. **Write.** Dispatch a Dev Subagent with part "Write the spec": the spec path and everything the
   spec needs, written out: the problem, every question and answer word for word, the approaches
   with the chosen one and why, the approved design, the non-goals, and the files that will change.
   Report: the spec's section headings, its line count, and any fix the self-review made.
7. **Hand back.** Set the row's Status to `spec`. Tell the user in a few sentences what the spec
   decided and what is left open, and that they can change any decision by telling you
   (`omega-dev-revise`).

Never dispatch "Write the spec" before the user has approved the design. (The "Explore" part
creates the spec file with empty headings only, to hold the Traversal Log.)

## Dev Subagent — part "Explore"

1. Sign in and clone exactly as `omega-repo-work` steps 1 and 2 say, with the Repos directory as
   the place the clone goes (`cd <Repos>`). Run only the setup and the check from
   `qo page read "Public/OAuth/devcontainer-git" --app-id 3b12bbed-213d-4945-a7e7-078f47c90ced`;
   installing the OAuth Client and getting a sign-in link are the Coordinator's. If the check fails
   — an error type such as `oauth/NotConnected`, or no OAuth Client in the workspace — stop and
   reply with the exact error.
   Do not create a branch. If the job names no base branch, find the default one with
   `git -C <Repos>/<repository name> remote show origin | sed -n 's/.*HEAD branch: //p'` and report
   it.
2. Read its `README.md`, the docs it points to, and the files that bear on the job. Run
   `git log --oneline -10` on the paths that matter.
3. `mkdir -p <Plans>/specs <Plans>/plans`. Create the spec file if it does not exist, with the
   headings of the template below and nothing under them, then append one line per file you read under `## Traversal Log`:
   `` - `path/in/repo` — what it revealed ``.
4. Reply with the Report the job asks for.

## Dev Subagent — part "Write the spec"

1. Write the spec at the path the job gives, in this template, keeping every `## Traversal Log` line
   already there:

   ```markdown
   # <Title>

   ## Problem
   ## Traversal Log
   ## Affected Files
   ## Clarifying questions and answers
   ## Proposed decisions
   ## Non-goals
   ## Design
   ## User Feedback Ledger
   ## AI Self-Revision Ledger
   ```

   `Clarifying questions and answers` holds every question and answer as given (`Q:` / `A:` lines).
   `Proposed decisions` has one `###` per decision with `**Recommendation:**` and
   `**Alternatives considered:**`. `Non-goals` says `none` only if the job says none. Both ledgers
   start empty.
2. Self-review and fix in place: no `TBD`, `TODO` or empty section other than the two ledgers; no two
   sections that contradict; no requirement that can be read two ways.
3. Reply with the Report the job asks for.
