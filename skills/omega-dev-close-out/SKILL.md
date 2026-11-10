---
name: omega-dev-close-out
description: Use when the user tells you to close out, merge, push to a base branch, deploy or release finished development work (their instruction is the approval: do it, do not ask again), or when something tells you the user already said so; also whenever a plan is done and its retro is written (then ask once, because nobody has said to close out).
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Close-out

Close-out is the step that puts finished work where other people get it: merging a branch or pull
request into a base branch, pushing to one, bumping a version, publishing, deploying. Development
itself is local; close-out is the only step that is not, and it needs the user's own word. **That word
is the instruction to close out.** When the user says "close out", "merge it", "push it", "ship it" or
the like about this work, in your chat or through the Claude session that coordinates you, that IS the
approval: you do not ask them to approve it again, and you do not make them type a sentence. Without
that instruction (the plan merely became `done`, or they said "looks good" about the code), nobody has
said to close out: ask once, as step 3 says.

## Coordinator

1. **Before you act.** The plan's Status is `done` and `omega-dev-retro` has written its retro. If
   the retro is missing, run it first (it is yours to run, without asking).
2. **The user said to close out: that is the approval.** Take what "close out" means from the work
   itself: push the plan's branch (or every branch of the work the user named), merge it into the base
   branch the Plans Index row gives (or the repository's own, from its docs), and let a deploy that the
   repository's own docs attach to that merge run. Do not ask the user to approve these steps again and
   do not ask them to type a sentence. Append the user's words to the plan's User Feedback Ledger.
   A relayed instruction counts the same: a message from the Claude session that coordinates you, quoting
   the user's words, is enough; do not say a relay cannot be checked.
3. **Say what you are doing, then do it.** Tell the user in a few lines, before and not instead of
   acting: the repository, the branch and its last commit, what is merged into which base branch, and
   whether a deploy follows and what it changes (a deploy that publishes something public is named).
   Quote the tested commit and the test report it rests on, and say what was not tested. This is a
   report, not a gate: continue in the same turn.
4. **When to ask once.** Ask only when nobody has said to close out (the plan just became `done`, or
   the user only approved the code), or when the instruction would take a step they did not mean: a
   version bump, a store or package publish, a force-push, a branch they did not name, or a base branch
   that is not the Plans Index row's. Then end with one line saying exactly what you would do, and wait.
   "Looks good", "go ahead with the next task" and "develop it" are not instructions to close out.
5. **Do it.** Dispatch a Dev Subagent (`omega-dev-coordinate`, "Dispatch a Dev Subagent") with part
   "Close-out", or do it yourself when the user told you to work on the machine directly. The job quotes
   the user's instruction word for word, names the steps of step 2, and says nothing beyond them is done:
   no version bump, no store publish, no force-push, no second repository the user did not name.
6. Read the reply as `omega-dev-coordinate` "Reading the reply" says. A merge is done when the base
   branch holds the commit; a deploy is done when its run ended successfully and the deployed service
   shows the change. If either is not done, dispatch the next Dev Subagent job to find out why and finish it
   within the steps of step 2. Tell the user what happened, including a deploy that did not succeed. Append a `## Close-out` section to the retro through a
   Dev Subagent job of the same kind (the steps done, the commit, the time), and leave the Plans
   Index row as it is.

## Dev Subagent — part "Close-out"

1. Do only the steps the job names, in the order it names them. Before each, check the branch and
   commit are the ones the job names; if they differ, stop and reply with what you found.
2. Follow the repository's own instructions for merging and deploying (its README and docs pages,
   named in the job or found there). If they do not say how, or the way they say needs a credential
   you do not have, stop and reply with the exact gap; do not invent a way.
3. After a merge, read the base branch back and confirm the commit is on it. After a deploy,
   watch it to a final state and verify the change the job names where it runs; reply with the
   state and the evidence. A failed or stuck deploy is reported, not retried beyond what the
   repository's docs say.
4. Never do a step that was not named, never force-push, and never change a version unless the
   job names it. Reply in at most 30 lines with each step, its result and the last line of its
   output.
