---
name: omega-dev-develop
description: Use when the user wants a written plan carried out — build it, develop it, implement the tasks — or when a Dev Subagent's job message says to follow omega-dev-develop.
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Develop

A plan is carried out one task at a time, each by its own Dev Subagent, in order. You do none of the
work yourself.

## Children

- **`omega-dev-develop-surface`** — a task's reply is not clean.

## Coordinator

1. The plan's Plans Index row must have Status `planned` or `developing`. Set it to `developing`.
   Get the Dev Machine (`omega-dev-coordinate` §1).
2. For each task, in order, dispatch a Dev Subagent with part "Task": the plan path, the task
   number, the repository URL, base branch and branch from the plan's row, and the clone directory
   `<Repos>/<repository name>`, and every constraint the user stated for this work, quoted word
   for word (for example "don't push"). Report: the commit hash and subject, each Verify line of
   the task with its command's output and pass or fail, each failing test with whether the plan
   names it as already failing, the first line of `git status -sb` after the commit (and the push,
   when there is one), and the number of the plan's last task. When the task you dispatched is
   that last task, go to step 4.
3. A reply is **clean** when it reports the task done with its commit, reports no error, every
   Verify line it reports passed, and it meets the user's own constraints: the branch is pushed
   unless the user said not to push, and a failing test the reply says the plan or the user named
   as already failing is not a failure (`omega-dev-coordinate` §4). Tell the user one line and
   dispatch the next task. Anything else → `omega-dev-develop-surface` before you do anything
   else.
4. After the last task, dispatch a Dev Subagent with part "Done check": the plan path and the clone
   directory. Report: each Definition of Done item with its command's output and pass or fail.
5. All pass → set Status `done`. Tell the user the branch and its commits, whether it is pushed, and end with this
   sentence: "Merging it is yours; I don't merge." Any fail → tell the user which, and stop.

## Dev Subagent — part "Task"

1. Read the plan: its Rules, and the task the job names. If that task already has a `Done:` line,
   change nothing and reply with that line.
2. Sign in and clone exactly as `omega-repo-work` steps 1 and 2 say, with the Repos directory as
   the place the clone goes (`cd <Repos>`). Run only the setup and the check from
   `qo page read "Public/OAuth/devcontainer-git" --app-id 3b12bbed-213d-4945-a7e7-078f47c90ced`;
   installing the OAuth Client and getting a sign-in link are the Coordinator's. If the check fails
   — an error type such as `oauth/NotConnected`, or no OAuth Client in the workspace — stop and
   reply with the exact error.
3. Do the task as `omega-repo-work` steps 3 to 7 say, with the plan as the job's notes: the branch
   from the job, the commit identity (the plan gives none, so it comes from your GitHub sign-in),
   the repo's own docs first, then the task's steps, running each Verify. Add the files the task
   names. Commit with the task's commit message and push the branch — unless the job quotes the
   user saying not to push: then commit only, and say in the reply that the branch is not pushed.
   Follow every other constraint the job quotes. Skip step 8 unless the task asks for a build.
4. The plan file lives on the Dev Volume, outside the clone. Under the task in it, add one line:
   `Done: <git log -1 --format='%h %s'> — <first line of git status -sb> — clone <clone directory>`.
   This is the record `omega-repo-work` step 9 asks for.
5. Reply with the Report the job asks for, listing each Verify line you ran with its output and
   pass or fail, in at most 30 lines. If you stopped, the reply says where and gives the exact
   error.

## Dev Subagent — part "Done check"

Run every Definition of Done command in the clone, in order, and reply with each item, the command's
output and pass or fail. Change nothing.
