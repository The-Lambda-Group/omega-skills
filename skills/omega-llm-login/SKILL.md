---
name: omega-llm-login
description: Use when a task needs an Omega or Claude credential, or is about to write a login, token or key anywhere in a plan, a task, a test fixture or a doc. Names the one place a Claude login lives — the Account's LlmLogin record — and the credential-boundary scan run before finishing.
---

## Credential boundary

A Claude login lives only in the Account's `LlmLogin` record at `system:#llm-login[:ACCOUNT-ID]`. It is created in the app (Settings → Connect Claude: the bridge sends the person to Anthropic's own sign-in page and trades the pasted code for a one-year token, `pages/agent-service/llm-login-flow.html`) or outside Omega (Claude Code `setup-token`, or a Claude Console key) and written through `qo agent provider --login-token-stdin`; a plan or a development task never asks for the value and never prints it. It is never in a pod file, a pod env var, a log, a transcript, a test fixture or a documentation example. `LlmAccount` reads are redacted to `{present,kind,set-at,expires-at}`; only the owning Account, root, the agent service using the Session's own credential, and a lent login's borrower may read `system:#llm-login`. A lent login is readable only by its borrower, through the borrower's own path; the source reads its own login at its own Account path, never through the borrower's records.

Before finishing, scan the code and docs you touched for a Claude login: `rg -n 'sk-ant-(oat|ort)01-' <paths>` (ripgrep's pattern is already extended regex, so no `-E`). No output is the pass (0 matches). Any match is a leaked login: remove it, and do not commit.
