---
name: omega-llm-login
description: Use when a task needs an Omega or Claude credential, or is about to write a login, token or key anywhere in a plan, a task, a test fixture or a doc. Names the one place a Claude login lives — the Account's LlmLogin record — and the credential-boundary scan run before finishing.
---

## Credential boundary

A Claude login lives only in the Account's `LlmLogin` record at `system:#llm-login[:ACCOUNT-ID]`. It is created in the app (Settings → Connect Claude: the bridge sends the person to Anthropic's own sign-in page and trades the pasted code for a one-year token, `pages/agent-service/llm-login-flow.html`) or outside Omega (Claude Code `setup-token`, or a Claude Console key) and written through `qo agent provider --login-token-stdin`; a plan or a development task never asks for the value and never prints it. It is never in a pod file, a pod env var, a log, a transcript, a test fixture or a documentation example. `LlmAccount` reads are redacted to `{present,kind,set-at,expires-at}`; `system:#llm-login` is readable, for an Account's own login, by the Account itself (the agent service reads it with the Session's own credential, which is that Account), the owner of the app a service account is bound to, and root; for a lent login, by the borrower and root only. Whoever holds a service account's api-key acts as it, and that key is readable by its app's owner and its Admins, so an Admin can read a bot's login through the bot's key. A lent login is readable only by its borrower, through the borrower's own path; the source reads its own login at its own Account path, never through the borrower's records.

Before finishing, scan the code and docs you touched for a Claude login or a Claude Console key: `rg -n 'sk-ant-(oat01|ort01|api03)-'` followed by the files and folders you touched (ripgrep's pattern is already extended regex, so no `-E`). No output is the pass (0 matches). Any match is a leaked login: remove it, and do not commit.
