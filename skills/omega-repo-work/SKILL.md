---
name: omega-repo-work
description: Use when a job is to write or change code in a git repository — clone it, work on a branch, run its tests, commit, push the branch to GitHub, and produce its output (a build, a render) — whether you do it yourself or a job message tells you to follow this skill. Covers where the clone lives, reading the repo's own docs before writing code, the branch and commit identity, fixing your own code versus stopping on a tool failure, pushing only your branch, and recording where the work is.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here. This skill
uses three siblings: `omega-installing-software` (the container and its worker),
`omega-devcontainers` ("Git with GitHub": the sign-in) and `omega-long-running-work` (jobs longer
than ten minutes).

# Working in a Repository

## The model

The code is worked on inside a container that has the repo's tools, by the agent in that container:
the worker of a container you built with `omega-installing-software`, which mounts a volume. The
clone lives on that volume, so it survives between sessions; nothing else in a container does.
When you hand the work to a worker, start its job message with the two worker sentences from
`omega-installing-software`, then the sentence `Follow the omega-repo-work skill.`, then the job:
the repository, the base branch, your branch, the commit identity and what to build, all taken from
the job's notes.

Everything about the job — which repository, which base branch, which branch to work on, the
commit name and email, what to build and what done means — comes from the job's notes. Never guess
one of them; if the notes do not say, stop and ask.

Every instruction you need is in your skills, the job's notes and the repository. Before your first
command, read the skill this one names for the step you are on: a worker reads
`omega-devcontainers` ("Git with GitHub") before it signs in. Never search the web, call a search
API or guess a URL to find instructions; if your skills and the notes do not say how, stop and
report. A worker does not look around the workspace, so a job message gives it every OmegaAI path
and command it needs exactly, as the skills and notes write them (for example the `qo page read`
command, with its `--app-id`, of a page it must follow).

## 1. Sign in to GitHub

Follow `omega-devcontainers`, "Git with GitHub (OAuth sign-in)", in the container that will run git.
Use `https://github.com/...` remotes only. Never ask for, store or print a token.

Do it at the start of **every** session, before the first `git fetch`, `clone` or `push`: the
credential helper is installed in the container's home directory, and a new session starts in a new
container where only the volume is kept. A clone that is already on the volume still needs it. If git
answers `could not read Username for 'https://github.com'`, the helper is missing in this container:
set it up as that section says, then run the git command again once.

## 2. Clone onto the volume, or continue the clone that is there

```bash
cd <volume mount> && { [ -d <repo name>/.git ] || git clone https://github.com/<owner>/<repo name>.git; } && cd <repo name> && git fetch origin
```

## 3. Your branch

If the branch exists on GitHub, continue it; otherwise start it from the base branch:

```bash
git switch <branch> 2>/dev/null || git switch -c <branch> --track origin/<branch> 2>/dev/null || git switch -c <branch> origin/<base branch>
```

Set the commit identity in this clone only (never `--global`), exactly as the notes give it:

```bash
git config user.name "<name from the notes>" && git config user.email "<email from the notes>"
```

## 4. Read the repo before writing code

Read its `README.md`, then the docs it points to (layout, rules, the terms it defines, how to run
it). The repo's docs are the source of truth for its commands: run them as they say, directly in
the container. Install its dependencies the way its docs say (for a Node repo with a
`package-lock.json`, `npm ci`). Add no dependency the job did not ask for.

## 5. Write the code

Work in small steps. After each step, run the repo's tests the way its docs say. A failing test, a
compile error or a stack trace from **code you wrote** is part of the work: read the error, fix
your code, run it again. A failure of a **tool or the platform** — an OmegaAI tool, the container
or its build, the worker, the GitHub sign-in, `git clone` or `git push` — is not: follow the job's
failure rules (stop and report the exact error).

## 6. Commit

Look before you add: `git status --porcelain`. Add only the files you meant to change, by name —
never build output, `node_modules`, logs or renders. Then commit with a message that says what
changed and why:

```bash
git add <file> <file> && git commit -m "<what changed and why>"
```

## 7. Push your branch

```bash
git push -u origin <branch>
```

Push only your branch. Never push the base branch, never `--force`, never delete a branch. If the
push is rejected because GitHub has commits you do not have, run `git pull --rebase origin <branch>`
once and push again; if it is rejected a second time, stop and report the exact error.

## 8. Build or render

Run the repo's build or render command as its docs say. If it will take longer than ten minutes,
follow `omega-long-running-work`. Check the output the way the job's notes say done is measured,
then hand it over with `omega-present-file`. That skill is a shell copy (`cp` into `$ARTIFACT_DIR`,
link `$ARTIFACT_BASE_URL/<name>`), not an OmegaAI tool, so a worker uses it too and puts the link in
its reply. A page that shows other files (an `index.html` of images) goes over with those files, under
names that keep its links working.

## 9. Record where the work is

Before you end, write in the job's notes: the clone's path on the volume, the branch, the last
commit (`git log -1 --format='%h %s'`) and whether it is pushed (`git status -sb`, first line).
