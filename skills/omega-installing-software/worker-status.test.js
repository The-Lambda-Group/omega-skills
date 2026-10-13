"use strict";
// Tests for worker-status.js (run: node --test skills/omega-installing-software/worker-status.test.js).
// Message shapes are the agent service's History Page messages as read in production on 2026-10-14: a finished
// Dev Subagent turn, a turn that failed with the OpenRouter budget 403, and a turn whose newest message carried
// ten PNG `read` results (the real ones reached 3,010,804 characters).
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { summarize, render } = require("./worker-status.js");

const SCRIPT = path.join(__dirname, "worker-status.js");
const asst = (info, parts) => ({ info: { id: "msg_2", role: "assistant", time: { created: 1 }, ...info }, parts });
const envelope = (...messages) => JSON.stringify({ ok: true, command: "svcacct-get-messages", data: { sessionId: "ses_x", result: [{ messages, limit: messages.length, "next-cursor": "c", "has-more": true }] } });
const png = (n) => ({ type: "tool", tool: "read", callID: `c${n}`, state: { status: "completed", title: `k0${n}.png`, input: { filePath: `/workspace/work/k0${n}.png` }, output: "Image read successfully", attachments: [{ type: "file", mime: "image/png", url: `data:image/png;base64,${"A".repeat(300000)}` }] } });

test("a user message is state user, its text on one line cut to 200 characters", () => {
  const s = summarize({ info: { id: "msg_1", role: "user" }, parts: [{ type: "text", text: "do\n\nthis   now" }] });
  assert.deepEqual(s, { id: "msg_1", role: "user", finish: null, state: "user", text: "do this now" });
  const long = summarize({ info: { id: "m", role: "user" }, parts: [{ type: "text", text: "job ".repeat(100) }] });
  assert.equal(long.text.length, 200);
  assert.ok(long.text.endsWith("…"));
});

test("completed with finish stop is done, every text part kept", () => {
  const m = asst({ finish: "stop", time: { created: 1, completed: 2 } }, [{ type: "step-start" }, { type: "text", text: "All checks passed." }, { type: "text", text: "Branch pushed." }, { type: "step-finish" }]);
  assert.deepEqual(summarize(m), { id: "msg_2", role: "assistant", finish: "stop", state: "done", text: "All checks passed.\nBranch pushed." });
});

test("a done answer longer than 6000 characters is cut and flagged truncated", () => {
  const s = summarize(asst({ finish: "stop", time: { created: 1, completed: 2 } }, [{ type: "text", text: "x".repeat(7000) }]));
  assert.equal(s.state, "done");
  assert.equal(s.text.length, 6000);
  assert.equal(s.truncated, true);
});

test("a step that ended in tool calls is working, activity = its newest tool", () => {
  const m = asst({ finish: "tool-calls", time: { created: 1, completed: 2 } }, [{ type: "step-start" }, { type: "tool", tool: "bash", state: { status: "completed", title: "Checks README API documentation", input: { command: "cat README.md" } } }, { type: "step-finish" }]);
  assert.deepEqual(summarize(m), { id: "msg_2", role: "assistant", finish: "tool-calls", state: "working", activity: "bash completed: Checks README API documentation" });
});

test("activity: a running tool without a title uses its description; a tool without a status has no stray space; a long text part is cut", () => {
  assert.equal(summarize(asst({}, [{ type: "tool", tool: "bash", state: { status: "running", input: { description: "Run the tests" } } }])).activity, "bash running: Run the tests");
  assert.equal(summarize(asst({}, [{ type: "tool", tool: "bash", state: { input: { description: "Run" } } }])).activity, "bash: Run");
  const a = summarize(asst({}, [{ type: "text", text: "x".repeat(500) }])).activity;
  assert.equal(a.length, 200);
  assert.ok(a.startsWith("text: xxx") && a.endsWith("…"));
});

test("info.error is error as name: message; a non-string message is JSON; a long one is cut to 300", () => {
  assert.equal(summarize(asst({ error: { name: "APIError", data: { message: "Budget limit exceeded (daily limit).", statusCode: 403 } } }, [])).error, "APIError: Budget limit exceeded (daily limit).");
  assert.equal(summarize(asst({ error: { name: "APIError", data: { message: { code: 429 } } } }, [])).error, 'APIError: {"code":429}');
  const e = summarize(asst({ error: { name: "APIError", data: { message: "y".repeat(1000) } } }, [])).error;
  assert.equal(e.length, 300);
  assert.ok(e.startsWith("APIError: yyy") && e.endsWith("…"));
});

test("a turn that finished with anything but stop or tool-calls is error, never working; info.error wins over finish", () => {
  for (const finish of ["length", "other", "error"]) {
    const s = summarize(asst({ finish, time: { created: 1, completed: 2 } }, [{ type: "text", text: "half an answ" }]));
    assert.equal(s.state, "error");
    assert.equal(s.error, `turn ended with finish "${finish}"`);
  }
  assert.equal(summarize(asst({ finish: "error", error: { name: "APIError", data: { message: "boom" } } }, [])).error, "APIError: boom");
});

test("a completed assistant message with no finish, and an unset finish, stay working", () => {
  assert.equal(summarize(asst({ time: { created: 1, completed: 2 } }, [{ type: "text", text: "x" }])).state, "working");
  assert.equal(summarize(asst({}, [])).state, "working");
});

test("null, number and string parts are ignored; a missing id is null, not a missing key", () => {
  const s = summarize({ info: { role: "assistant", finish: "stop", time: { created: 1, completed: 2 } }, parts: [null, 7, "x", { type: "text", text: "ok" }] });
  assert.equal(s.state, "done");
  assert.equal(s.text, "ok");
  assert.ok(Object.prototype.hasOwnProperty.call(s, "id"));
  assert.equal(s.id, null);
});

test("an envelope with no messages is state user with id null (the job is not stored yet)", () => {
  assert.deepEqual(render(envelope()), [{ id: null, role: null, finish: null, state: "user", text: "" }]);
});

test("qo's own failures are read-failed: ok false (a typed 404), non-JSON, empty output, a reply without data", () => {
  const typed = JSON.stringify({ ok: false, command: "svcacct-get-messages", error: '{"type":"omega/query-omega/agent/AgentServiceException","data":{"status":404}}' });
  const r = render(typed);
  assert.equal(r.length, 1);
  assert.equal(r[0].state, "read-failed");
  assert.match(r[0].error, /AgentServiceException/);
  assert.equal(render("bash: qo: command not found")[0].state, "read-failed");
  assert.deepEqual(render(""), [{ state: "read-failed", error: "qo printed nothing" }]);
  assert.equal(render(JSON.stringify({ ok: true })).at(0).state, "read-failed");
});

test("a message of ten 300 KB images (3 MB) becomes one short working line", () => {
  const big = asst({ finish: "tool-calls" }, Array.from({ length: 10 }, (_, i) => png(i + 1)));
  const input = envelope(big);
  assert.ok(input.length > 3_000_000, `input is ${input.length} characters`);
  const out = render(input);
  assert.equal(out.length, 1);
  const line = JSON.stringify(out[0]);
  assert.ok(line.length < 400, `line is ${line.length} characters`);
  assert.equal(out[0].state, "working");
  assert.equal(out[0].activity, "read completed: k010.png");
});

test("five messages give five lines, oldest first, each bounded", () => {
  const ms = [{ info: { id: "m1", role: "user" }, parts: [{ type: "text", text: "job" }] }, asst({ id: "m2", finish: "tool-calls" }, [png(1)]), asst({ id: "m3", finish: "tool-calls" }, [png(2), png(3)]), asst({ id: "m4", finish: "stop", time: { created: 1, completed: 2 } }, [{ type: "text", text: "done" }]), asst({ id: "m5", error: { name: "APIError", data: { message: "late" } } }, [])];
  const out = render(envelope(...ms));
  assert.deepEqual(out.map((o) => o.id), ["m1", "m2", "m3", "m4", "m5"]);
  assert.deepEqual(out.map((o) => o.state), ["user", "working", "working", "done", "error"]);
  assert.ok(out.every((o) => JSON.stringify(o).length < 400));
});

test("the script itself: reads stdin, prints one JSON line per message, exits 0, even on garbage", () => {
  const ok = spawnSync(process.execPath, [SCRIPT], { input: envelope(asst({ finish: "stop", time: { created: 1, completed: 2 } }, [{ type: "text", text: "all good" }])), encoding: "utf8" });
  assert.equal(ok.status, 0);
  const lines = ok.stdout.trim().split("\n");
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]), { id: "msg_2", role: "assistant", finish: "stop", state: "done", text: "all good" });
  const bad = spawnSync(process.execPath, [SCRIPT], { input: "Error: not logged in", encoding: "utf8" });
  assert.equal(bad.status, 0);
  assert.deepEqual(JSON.parse(bad.stdout.trim()), { state: "read-failed", error: "Error: not logged in" });
  const big = spawnSync(process.execPath, [SCRIPT], { input: envelope(asst({ finish: "tool-calls" }, Array.from({ length: 10 }, (_, i) => png(i + 1)))), encoding: "utf8", maxBuffer: 20_000_000 });
  assert.equal(big.status, 0);
  assert.ok(big.stdout.length < 400, `stdout is ${big.stdout.length} characters`);
});
