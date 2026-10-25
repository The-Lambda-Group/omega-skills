---
name: omega-dedicated-pod-work
description: Use when you want several jobs to run at the same time, each on a machine of its own (a render split into parts, a batch of builds, a fan-out of independent tasks), or one job that must not share its machine with your other sessions. Covers starting a session on a Dedicated Pod with `qo agent create-session --dedicated-pod`, keeping it alive with the hold, sending it work, getting its results out as public links, the limit of eight at once, and what happens when you stop holding.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Dedicated Pod Work

## The model

Your Sessions normally share one pod: the pod of your account. Jobs started in several Sessions compete for that pod's processor and memory. A **Dedicated Pod** is a pod of one Session alone. It starts when you ask for it, it has its own processor, memory and disk, and it is deleted when you stop holding it.

A Dedicated Pod Session is **ephemeral and headless**:

- Its transcript is not kept. When the pod is deleted, the Session and everything in its disk are gone. It never appears in the list of your sessions.
- Its disk is empty at the start and is lost at the end. The only things that outlive it are files it copies into its `ARTIFACT_DIR` (`omega-present-file`), which are public links under your account.
- It lives only while you **hold** it. The hold is a connection that the `qo` command keeps open for as long as it runs. About 60 seconds after the last hold closes, the pod is deleted. A command that is stopped or killed takes its pod with it.
- You can have **eight** Dedicated Pods at once. A ninth start is refused with HTTP status 429 and the code `dedicated-pod-cap`. Stop one of the holds and start again.

## Rules

1. **Hold with a background job.** `qo agent create-session --dedicated-pod` does not return while the pod lives. Start it the way `omega-long-running-work` says (in the background, on a volume, checked every nine minutes), and read its first output line for the session id.
2. **One command, one pod.** To run eight jobs at once, start eight commands.
3. **Give the job in the first message and tell the worker where results go.** The worker cannot see your notes, your files or your Session. Say what to do, which public link names to use (`omega-present-file`), and that its disk is lost when it ends.
4. **Results leave only as public links.** Ask for the link names in the message; check each link yourself when the worker says it is done. Never put a secret in `ARTIFACT_DIR`.
5. **Release when the job is done.** Stop the holding command (end the background job). Do not keep pods you no longer need: they count against the eight.
6. **Do not rely on the transcript.** `qo agent get-messages SESSION_ID` and `qo session wait` work while the pod lives; after it is deleted they answer that the Session does not exist.
7. **A dedicated pod that ends under you is not an error to fix.** If the holding command exits with status 3, the pod is gone (it was reaped, the service restarted or the connection was lost for good). Start a new one and send the job again.

## Commands

Start a Session on a Dedicated Pod and hold it (prints the session as JSON, then holds until stopped):

```
qo agent create-session --dedicated-pod
```

Hold a pod again after its command was stopped less than a minute ago:

```
qo agent hold-session SESSION_ID
```

Send the job, asynchronously, and wait for the answer:

```
qo agent send-message SESSION_ID "THE_JOB" --async
qo session wait SESSION_ID
```

The job message ends with the names of the public links the worker must produce. When the worker's answer arrives, fetch each link before you release the pod.

## When not to use it

- A job that takes one minute does not need its own pod; the start itself takes about as long.
- A job that needs a program that is not installed follows `omega-installing-software` first: a Dedicated Pod starts from the same image as your account's pod.
- A job whose transcript you want to keep, or one you want to see in the app, runs in an ordinary Session.
