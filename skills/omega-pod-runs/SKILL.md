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

   `devcontainer` is the `devcontainer-id` that `qo block devcontainer get` printed, not the page path (a path is refused with `devcontainer-ref`). The entrypoint must live in the image: a Run Pod mounts no Volume. `dedicatedPod: true` gives each call a pod of its own, so many calls run in parallel (at most 8 Dedicated Pods at once per Account, shared with Dedicated Sessions; the 9th call answers `PodCapException`, wait and call again). `async: true` returns at once with a `pod_id`; leave it out and the call waits and returns the result. `timeout` is milliseconds the program may run before it is killed; `lease` is milliseconds the pod is kept while its program runs (default 1800000), renewed by each `qo pod status` read.
5. **Run it.** `qo run "Jobs/Build" -p Job -m run --args '[]'`. With `async` it prints `{"pod_id": "YWNjdC0xI2RlZGljYXRlZDo3ZjNj"}`; keep that `pod_id` in your notes with the page path.
6. **Read the answer.** `qo pod status POD_ID` prints `state` (`running`, `exited` or `failed`). While it says `running`, wait 30 seconds (`sleep 30`) and read again; each read keeps the pod alive. When it says `exited`, `result`, `logs` and `exit` are there; copy what you need before the pod is reaped about 3 minutes later. Large files: write them to the Artifact Dir from the program and send the link.
7. **Stop what you no longer need.** `qo pod stop POD_ID` ends the pod now.

## Errors

- `HandlerTimedOutException`: raise `timeout` in the Code and run again; do not resubmit the same call unchanged.
- `HandlerExitedException`: the program exited non-zero; the exception data carries the exit code and stderr. Fix the program, `rebuild`, run again.
- `HandlerOutputInvalidException`: stdout was not the JSON shape in rule 3.
- `NoSuccessfulBuildException`: the Devcontainer never built; fix the build first (rule 1).
- `PodBusyException`: retry after 15 seconds.
- `PodCapException`: 8 Dedicated Pods are already running; wait for one to end, or `qo pod stop` one you no longer need, and call again.
- `PodGoneException` on `qo pod status` or `qo pod stop`: the pod ended (stopped, lease lapsed, or grace over), never existed, or is not yours. Run again.
- If a `qo` verb is not found, stop and tell the user which verb and which `qo --version` you have. Do not work around it with another tool.

## Example entrypoint

```
#!/bin/sh
cd /opt/src/app && npm test 1>&2
code=$?
printf '{"result": {"exit": %s}, "logs": "see stderr"}\n' "$code"
```
