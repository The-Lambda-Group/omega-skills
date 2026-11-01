---
name: omega-pod-runs
description: Run a command or a service on a prebuilt Devcontainer image with no agent session, in parallel pods. Use when the work is a program (a build, a test run, a batch job, a server) rather than a conversation, or when many copies of the same job should run at once.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it first, then come back here.

# Pod Runs

A Run starts a pod from a Devcontainer image that is already built, runs one program in it, and ends the pod. No agent session is involved. Use `omega-installing-software` instead when the work needs an agent to think.

## Rules, in order

1. **The image must be ready.** Read the block: `qo block devcontainer get "PAGE@NAME"`. `build-status` must be `ready`. If you changed the definition, write it and wait for `ready`; to build the same definition again run `qo block devcontainer rebuild "PAGE@NAME"`. A failed build leaves the last good image in place, so a Run still works on the old image while `build-status` is `failed`; read `build-error` before you rely on it. `qo block devcontainer rebuild` may reuse an image the registry already holds for the same content; add `--force` to build it again anyway. `get` prints the `devcontainer-id` you need in rule 4.
2. **Put the program in the image.** The entrypoint is a path inside the image, for example `/opt/app/run`. Code that is not in the image yet goes in with `features.fetch` (see `omega-devcontainers`) or `features.run`.
3. **The entrypoint prints exactly one JSON value on stdout:** `{"result": 42, "logs": "text"}` (the result may be any JSON value). Anything else on stdout is an error (`HandlerOutputInvalidException`). Write progress to stderr.
4. **Write the Implementation once.** Create the page's protocol, component and implementation with the `add_protocol`, `add_component` and `add_implementation` tools, then set the Code with `write_data` on `PAGE@IMPLEMENTATION_NAME`:

```
{"language": "script", "code": "{\"devcontainer\":\"DEVCONTAINER_ID\",\"entrypoint\":\"/opt/app/run\",\"dedicatedPod\":true,\"async\":true,\"timeout\":600000,\"lease\":1800000}"}
```

   `devcontainer` is the `devcontainer-id` that `qo block devcontainer get` printed, not the page path (a path is refused with `devcontainer-ref`). The entrypoint must live in the image: a Run Pod mounts no Volume. `dedicatedPod: true` gives each call a pod of its own, so many calls run in parallel (at most 10 Dedicated Pods at once per Account, shared with Dedicated Sessions; the 11th call answers `PodCapException`, wait and call again). `async: true` returns at once with a `pod_id`, while the pod may still be starting; leave it out and the call waits and returns the result. `timeout` is milliseconds the program may run before it is killed; `lease` is milliseconds the pod is kept while its program runs (default 1800000), renewed by each `qo pod status` read.
5. **Run it.** `qo run "Jobs/Build" -p Job -m run --args '[]'`. With `async` it prints a one-element array, `[{"pod_id": "YWNjdC0xI2RlZGljYXRlZDo3ZjNj"}]`; keep that `pod_id` in your notes with the page path.
6. **Read the answer.** `qo pod status POD_ID` prints `state` (`starting`, `running`, `exited` or `failed`). While it says `starting` or `running`, wait 30 seconds (`sleep 30`) and read again; each read of a running pod keeps it alive. A cold node can stay `starting` for minutes. When it says `exited`, `result` and `logs` are there (`exit` is the entrypoint's exit status when the runner reports it, always for `failed`; `omega-ai-agent-service` `pages/agent-service/pod-runs.html` says it is present once the entrypoint has ended); copy what you need before the pod is reaped about 3 minutes later. Large files: write them to the Artifact Dir from the program and send the link. Large inputs (a recording, a take) reach the pods the same way, the other direction: a method of the same Implementation downloads them into a folder of the Artifact Dir, streamed to disk and checked against a sha256, and every Run Pod of the Account reads that folder; not a `features.fetch` download entry, which the build holds in memory whole and gives 120 seconds, twice (`omega-ai-agent-service` `src/build/fetchStep.ts` lines 114 and 132). Delete the folder after: the Artifact Dir serves every file to whoever has its link. A branch runs from a second Devcontainer whose `fetch` ref is the branch (omega-commercials `pages/commercials/containers.html`, "A container for a branch").
7. **Stop what you no longer need.** `qo pod stop POD_ID` ends the pod now.
8. **Many pods at once.** Count the nodes first: `kubectl get nodes -l nodepool=devcontainers --no-headers | wc -l` (the kubeconfig is in `omega:kubernetes`). A Run Pod whose Devcontainer asks for as much as a node holds (the commercials Render one asks for 2 cpu and 3gb, the Reels one 4 cpu and 5gb, so one per node) needs a node of its own, the autoscaler adds nodes slowly (two to eight in about seven minutes, measured 2026-11-01), and a pod that waits more than 300000 ms fails with `kind` `start`. Start all the pods, read each every 30 seconds, and start only the failed ones again with the same arguments; never start the whole job again. Stop every pod you started with `qo pod stop POD_ID` when its result is copied. The full page is `omega-ai-agent-service` `pages/agent-service/isolated-pods.html`.

## Errors

- `HandlerTimedOutException`: raise `timeout` in the Code and run again; do not resubmit the same call unchanged.
- `HandlerExitedException`: the program exited non-zero; the exception data carries the exit code and stderr. Fix the program, `rebuild`, run again.
- `HandlerOutputInvalidException`: stdout was not the JSON shape in rule 3.
- `NoSuccessfulBuildException`: the Devcontainer never built; fix the build first (rule 1).
- `PodBusyException`: retry after 15 seconds.
- `PodCapException`: 10 Dedicated Pods are already running; wait for one to end, or `qo pod stop` one you no longer need, and call again.
- A `state` of `failed` with `kind` `start` and an `error`: the pod never became ready or refused the work, and it has been stopped. Run again. On a cold pool, only that pod is run again (rule 8).
- `PodGoneException` on `qo pod status` or `qo pod stop`: the pod ended (stopped, lease lapsed, or grace over), never existed, or is not yours. Run again.
- **Pod size and OOM.** A Run Pod requests and limits exactly the Devcontainer's `hostRequirements` (`cpus`, `memory`, `storage`), with no clamp (`omega-ai-agent-service` `src/sandbox/resources.ts` lines 11 to 22); a program that needs more memory than that is killed. Changing `hostRequirements` alone does not rebuild the image. A `PodGoneException` can therefore be an OOM kill, not only a stop or a lapsed lease. Confirm it read-only: `kubectl get pods` (kubeconfig in `omega:kubernetes`) shows the pod `OOMKilled` with exit code 137. Then raise `memory` in `hostRequirements` and write the spec again, or lower the program's own concurrency or cache; do not run the same call again unchanged.
- If a `qo` verb is not found, stop and tell the user which verb and which `qo --version` you have. Do not work around it with another tool.

## Example entrypoint

```
#!/bin/sh
cd /opt/src/app && npm test 1>&2
code=$?
printf '{"result": {"exit": %s}, "logs": "see stderr"}\n' "$code"
```
