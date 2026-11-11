---
name: omega-dedicated-pod-work
description: Use when you want several jobs to run at the same time, each on a machine of its own (a render split into parts, a batch of builds, a fan-out of independent tasks), or one job that must not share its machine with your other sessions. Covers running a job on a Run Pod with `qo run` on a method whose Implementation sets `dedicatedPod` and `async`, reading it with `qo pod status`, stopping it with `qo pod stop`, getting its results out as public links, the limit of ten at once, and what happens when you stop reading.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Dedicated Pod Work

## The model

Your Sessions normally share one pod: the pod of your account. Jobs started in several Sessions compete for that pod's processor and memory. A **Run Pod** is a pod for one method run alone. It starts when you run a method whose Implementation says `"dedicatedPod": true`, it has its own processor, memory and disk, and it is deleted when the run ends or its lease lapses. (The wire name stays `dedicatedPod`, so this skill keeps its name.)

A Run Pod is **ephemeral and headless**. It has no Session and no transcript:

- Its disk is empty at the start and is lost at the end. The only things that outlive it are files it copies into its `ARTIFACT_DIR` (`omega-present-file`), which are public links under your account.
- It lives only while its **Run Lease** lasts. Every `qo pod status` read renews the lease; after the entrypoint ends the lease drops to about three minutes, which is the time to read the result; a pod nobody reads is deleted when the lease lapses.
- You can have **ten** Run Pods at once. An eleventh start is refused with HTTP status 429 and the kind `pod-cap`. Stop one and start again; a stopped pod frees its slot a short while later.

## Rules

1. **Define the job as a method.** The options live in the Implementation's Code, not on `qo run`: `{"devcontainer": "DEVCONTAINER_ID", "entrypoint": "/opt/app/run", "dedicatedPod": true, "async": true, "timeout": 600000, "lease": 1800000}`. The entrypoint lives in the image, because a Run Pod mounts no Volume, and its stdout must be exactly one JSON value of the shape `{"result": 42, "logs": "text"}`.
2. **One run, one pod.** To run eight jobs at once, run the method eight times and keep the eight Pod Ids that `qo run` prints. There is no `qo pod list`.
3. **Put the job in the arguments and tell the program where results go.** The pod cannot see your notes, your files or your Session. Pass what to do, which public link names to use (`omega-present-file`), and remember that its disk is lost when it ends.
4. **Results leave only as public links, or as the one JSON value.** Check each link yourself when `qo pod status` says the run exited. Never put a secret in `ARTIFACT_DIR`.
5. **Stop the pod when the job is done.** `qo pod stop POD_ID` reaps it now. Do not keep pods you no longer need: they count against the ten.
6. **Read every pod about every 30 seconds while it runs.** A read renews the lease and shows `starting`, `running`, `exited`, `failed` or `gone`. Use `omega-long-running-work` for the waiting.
7. **A pod that ends under you is not an error to fix.** `gone` means it was reaped, its lease lapsed or it was killed for memory. Start a new run and send the job again.

## Commands

Start a Run Pod (async answers its Pod Id at once, while the pod is still starting):

```
qo run "PAGE_PATH" -p PROTOCOL -m METHOD --args '[]'
```

Read it, then stop it:

```
qo pod status POD_ID
qo pod stop POD_ID
```

`qo pod status` prints the state and, once the entrypoint has ended, the `result`, `logs` and `exit` code.

## When not to use it

- A job that takes one minute does not need its own pod; the start itself takes about as long.
- A job that needs a program that is not installed follows `omega-installing-software` first: a Run Pod starts from the Devcontainer's image.
- A job whose transcript you want to keep, or one you want to see in the app, runs in an ordinary Session.
