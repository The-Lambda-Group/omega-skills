#!/usr/bin/env node
"use strict";
// worker-status.js — part of omega-installing-software (step 4.3). Reads on stdin the JSON that
//   qo block service-account get-messages <worker> <session> --limit N --json
// prints, and prints ONE short JSON line per message, oldest first. A worker's newest message spans its
// whole turn and can be megabytes (every image it reads carries its base64), so the agent reads the
// worker through this filter in its shell and only these lines reach its context.
//
// Line fields: id, role, finish, state, and
//   state "done"        — an assistant message, completed, finish "stop": text = its text parts (at most 6000
//                         characters; "truncated": true when cut)
//   state "working"     — an assistant message still going, or a step that ended in tool calls:
//                         activity = its newest tool or text part (at most 200 characters)
//   state "error"       — info.error is set (error = "<name>: <message>", at most 300 characters), or finish is
//                         neither stop nor tool-calls (the turn died: other, length, error ...)
//   state "user"        — any other message (the job sent to the worker): text, at most 200 characters; also
//                         the answer when the session has no message yet (id null, text "")
//   state "read-failed" — the qo call did not return messages: error = what it printed (at most 300 characters)
// Message fields are opencode's, as GET /agent/messages returns them: info.role, info.finish,
// info.time.completed, info.error {name, data.message}; tool parts carry tool and state.{status,title}.

const ACTIVITY_MAX = 200;
const ERROR_MAX = 300;
const ANSWER_MAX = 6000;

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const asText = (v) => (typeof v === "string" ? v : JSON.stringify(v));

function activityOf(p) {
  if (!p) return "";
  if (p.type === "tool") {
    const st = p.state || {};
    const what = st.title || (st.input && st.input.description) || "";
    return clip(`${[p.tool, st.status].filter(Boolean).join(" ")}${what ? `: ${oneLine(what)}` : ""}`, ACTIVITY_MAX);
  }
  return clip(`text: ${oneLine(p.text)}`, ACTIVITY_MAX);
}

function summarize(msg) {
  const info = (msg && msg.info) || {};
  const parts = msg && Array.isArray(msg.parts) ? msg.parts.filter((p) => p && typeof p === "object") : [];
  const completed = !!(info.time && info.time.completed);
  const base = { id: info.id ?? null, role: info.role ?? null, finish: info.finish ?? null };
  const texts = parts.filter((p) => p.type === "text").map((p) => String(p.text ?? ""));
  if (info.role !== "assistant") return { ...base, state: "user", text: clip(oneLine(texts.join(" ")), ACTIVITY_MAX) };
  if (info.error) {
    const e = info.error;
    const raw = (e.data && e.data.message) || e.message || JSON.stringify(e);
    const detail = asText(raw);
    return { ...base, state: "error", error: clip(oneLine(e.name ? `${e.name}: ${detail}` : detail), ERROR_MAX) };
  }
  if (info.finish && info.finish !== "stop" && info.finish !== "tool-calls")
    return { ...base, state: "error", error: `turn ended with finish "${info.finish}"` };
  if (completed && info.finish === "stop") {
    const answer = texts.join("\n");
    return { ...base, state: "done", text: clip(answer, ANSWER_MAX), ...(answer.length > ANSWER_MAX ? { truncated: true } : {}) };
  }
  const shown = parts.filter((p) => p.type === "tool" || p.type === "text");
  return { ...base, state: "working", activity: activityOf(shown[shown.length - 1]) };
}

// input: the text qo printed. Returns the lines to print.
function render(input) {
  let r;
  try { r = JSON.parse(input); }
  catch { return [{ state: "read-failed", error: clip(oneLine(input) || "qo printed nothing", ERROR_MAX) }]; }
  if (!r || r.ok === false || !r.data)
    return [{ state: "read-failed", error: clip(oneLine(asText((r && r.error) || "no data in the reply")), ERROR_MAX) }];
  const result = Array.isArray(r.data.result) ? r.data.result[0] : r.data.result;
  if (!result || !Array.isArray(result.messages)) return [{ state: "read-failed", error: "unexpected reply shape" }];
  const messages = result.messages;
  if (messages.length === 0) return [{ id: null, role: null, finish: null, state: "user", text: "" }];
  return messages.map(summarize);
}

if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => { input += c; });
  process.stdin.on("end", () => {
    let lines;
    try { lines = render(input).map((line) => JSON.stringify(line)); }
    catch { lines = [JSON.stringify({ state: "read-failed", error: "status filter crashed" })]; }
    for (const line of lines) console.log(line);
  });
}

module.exports = { summarize, render };
