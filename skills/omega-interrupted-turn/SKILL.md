---
name: omega-interrupted-turn
description: Use when a worker or Dev Subagent you are waiting on reports `turn-state` `interrupted` in the output of your wait (its newest turn was cut off before it finished — the agent service was restarted, or a node was lost), or when a read of any session you started says `turn-state` `interrupted`. The session and its history are intact and one message continues it. Covers what to tell the user, the exact message to send, and when to stop.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# An Interrupted Turn

## The model

A turn runs inside the session's pod. When the pod is deleted under it — a node is lost, the
24-hour limit of a pod is reached, or the pod was not taken over when the agent service was
restarted — the turn stops where it was and writes nothing: the newest message never completes,
and the tool call in it reads `running` forever. The agent service tells that apart from a turn
that is still going: a read of the session says `turn-state` `interrupted` (with a `turn-reason`:
`pod-gone`, `not-running`, or `compaction-stalled` when the newest message is a context compaction
that was left empty and never finished). In the output of `qo block service-account get-messages
… --summary` it is `data.result[0]["turn-state"]`, beside `messages`; the newest message's `state`
in that output reads `working`, because the message never completed. The session and its history
are intact. For a stalled compaction the agent service aborts the stuck compaction as your message
arrives, and the message then re-runs the compaction first (on 2026-10-14 a plain message restarted
three hung compactions, each finished in about a minute). On 2026-10-13 one plain message to a cut-off session made
it carry on within a second, with its full context.

## 1. Tell the user, in one line

Say which agent it is and what you do next, for example: "The worker was cut off by a restart of
the agent service; I am telling it to continue."

## 2. Send one message that continues it

Before you send, run the command of `omega-installing-software` step 4.3 without its
`sleep 180;` and note the `message-id` of the last message in `data.result[0].messages`. Then
`block_service_account_send_message` with the same `block_path`, the same `session_id`,
`async: true` and this `message`, word for word:

> Your last turn was cut off by a restart of the service. Nothing you wrote before it is lost.
> Read your newest message and the files you already wrote, finish what it was doing, and reply as
> the job asked.

This is the one case in which you send an agent a message while its job is unfinished: its turn is
not running. When the job ran in a worker's container for longer than ten minutes, that container
was replaced as well, so add to the message: `Start the job again as your omega-long-running-work
skill says in step 4, after a restart: it continues where it stopped.`

## 3. Wait as before

Go back to waiting in rounds (`omega-installing-software` step 4.3). The output says `interrupted`
until the agent's new reply starts; when the last message's `message-id` differs from the one you
noted, read its `state` as usual.

## 4. Stop after two

If the same job is `interrupted` a second time, tell the user the session id and say that it was
cut off twice, and stop.
