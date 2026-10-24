---
name: omega-commander
description: Use when a task is big or separate enough to give to another session: start a worker session, send it one task, and read what it answers. Do not use inside a session that was told it is a worker.
---

# Delegating to worker sessions

If your first message told you that you are a worker, stop reading: do your task yourself, never start or message other sessions.

Otherwise you can start workers. Every command takes `--json`, and `--host "${OMEGA_URL:-https://db.queryomega.com}"`. The commands that talk to the agent service also take `--base-url "${AGENT_URL:-https://agent.cloud.queryomega.com}"`.

1. Start one: `qo agent create-session --json` prints the new session's id (`ses_...`).
2. Send it one task, with this first line exactly, so it does not delegate again:
   `You are a worker session started by another session. Do this task yourself. Do not start or message other sessions.`
   then the task on the next lines: `qo agent send-message SESSION_ID "TEXT" --async --json`.
3. Wait for its answer: `qo session wait SESSION_ID --json` prints the reply when its turn ends.
4. List sessions when you need an id: `qo agent list-sessions --json`.
5. Tell the user what each worker answered, in your own words, and name the session so they can open it.

Name a session so the user can find it: `qo write "system:#session:SESSION_ID" --data '{"title":"SHORT TITLE"}' --json` (80 characters at most).

Do not wait on a worker that has not been sent a task. Do not send a worker more than one task at a time. If a worker's answer is wrong, send it a correction in the same session instead of starting another.
