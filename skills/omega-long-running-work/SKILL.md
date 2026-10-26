---
name: omega-long-running-work
description: Use when a job in your shell will take longer than ten minutes — or a service (a database, an engine) that later bash calls of your turn use — whether you run it yourself or a job message tells you to follow this skill. Covers keeping the job's files where they survive, starting it so it keeps running between your tool calls, checking on it every nine minutes while keeping your turn open, and starting it again after your container restarts.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Long-Running Work

## The model

Your container stays up while you are working on your turn. About fifteen seconds after your turn
ends, it is deleted, and every process in it goes with it. A single bash command is stopped after at
most ten minutes. So a job that takes longer runs in the background, and you stay in your turn —
checking on it — until it has finished.

## 1. Keep the job's files where they survive

Work inside the mounted volume your job message names (for example `/workspace/work`), not in
`/workspace` or `/tmp`: the volume outlives the container; nothing else does. Prefer a job that
skips work it has already finished, so starting it again continues where it stopped.

## 2. Start it in the background

Create the log file's directory first, then start the job in one bash call, exactly in this shape:

```bash
cd <job directory> && mkdir -p <log directory> && setsid nohup <command> > <log file> 2>&1 < /dev/null &
```

`setsid nohup … &` keeps the job running after the bash call returns. Give that call `timeout`
`30000`: the shell can wait on the started job and end the call only at its timeout, with a
"terminated command after exceeding timeout" note. That is expected — the job runs on in its own
session. Your first check (step 3) confirms it started; do not start it a second time. If the job writes its own
progress file, read that; otherwise read the log file.

## 3. Check on it until it finishes

Each check is one bash call with `timeout` set to `600000` (ten minutes, the maximum):

```bash
sleep 540; tail -n 3 <progress or log file>
```

After each check, write one short line saying where the job is. Then check again. Do not end your
turn while the job is running: ending it deletes your container and stops the job.

- **It finished** when its own output says so (for example a last line `DONE …`).
- **It failed** when its output says so (`FAIL …`), or when its process is gone without a finished
  line (`[ -d /proc/<pid> ]` is false for the process id it wrote). Read the last 30 lines of its log
  once, then start it again exactly as in step 2 — once. If it fails a second time, stop and report
  those log lines.

Never signal or stop the job yourself, and never check more often than every nine minutes: each
check costs a model call, and the job does not go faster for being watched.

## 4. After a restart

If your container was restarted, your session continues in a new container with the volume
mounted again. Start the job again exactly as in step 2; a job that skips finished work continues
where it stopped. Then check on it as in step 3.

## 5. A service that must stay up across your bash calls

Section 2 is for a job you wait on until it ends. A database or an engine that later bash calls of
the same turn use is a service: it does not end. Do not start it with a bare `command &`: the bash
call stays open until the command ends (a `sleep 1000 &` holds the call for all 1000 seconds). Start it
as a session of the worker's own server, which keeps it running and lets you stop it. The devcontainer
needs `curl` and `jq` in `features.apt` (the Dev Machine's has them):

```bash
PTY_ID=$(curl -s -X POST "http://localhost:${PORT:-4096}/pty" -H 'Content-Type: application/json' \
  -d "$(jq -cn '{command:"bash",args:["-c","exec sleep 3600"],cwd:"/workspace/work",title:"service"}')" | jq -r .id)
echo "$PTY_ID" > /tmp/service.pty
curl -s "http://localhost:${PORT:-4096}/pty"
curl -s -X DELETE "http://localhost:${PORT:-4096}/pty/$(cat /tmp/service.pty)"
```

The first call prints nothing and saves the id in `/tmp/service.pty`, because a shell variable does not
survive into your next bash call. The second lists the session with `"status":"running"`; the third, in a
later call, stops it. Replace `sleep 3600` with the service's own command. Then wait for the service's health command:
run it every 5 seconds, at most 24 times; if it still fails, stop and report its last output. The
service ends with your container, so each new session starts it again.

## 6. On a Claude Code session in the chat

Sections 1 to 5 are for a session whose container ends with your turn. A Claude Code session that
the user talks to in the AI panel keeps its container while a background task runs, and it wakes
you when the task ends. There, start the job with the Bash tool's `run_in_background` set to
`true`; do not use `setsid nohup` or a trailing `&`. For example, a render that writes its own log:

```bash
cd /workspace/work && ./render.sh > /workspace/work/logs/render.log 2>&1
```

The call returns a task id at once. Write one line saying what you started and where its log is,
then end your turn. The session stays busy while the task runs (the user sees "Background task
running" with a Stop button), and when the command exits you get a new turn with its result: read
the log file, then report. Never `sleep` to wait for it and never poll it, because each wait is a
model call and the exit wakes you anyway. A call that has already been running a while can be moved
to the background by the user with the Background button; you do not do that yourself.

This holds only in the AI panel chat. A job message that reaches you over HTTP (`async: true`) or from a
cron has no open chat to keep the session busy, so the task ends with your turn: use sections 2 and 3.
