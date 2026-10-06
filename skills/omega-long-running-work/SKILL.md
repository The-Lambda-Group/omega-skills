---
name: omega-long-running-work
description: Use when a job in your shell will take longer than ten minutes — whether you run it yourself or a job message tells you to follow this skill. Covers keeping the job's files where they survive, starting it so it keeps running between your tool calls, checking on it every nine minutes while keeping your turn open, and starting it again after your container restarts.
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

`setsid nohup … &` keeps the job running after the bash call returns. If the job writes its own
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
