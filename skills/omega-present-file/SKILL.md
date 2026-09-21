---
name: omega-present-file
description: Turn a file the agent already has into a shareable public link and return that link. Use when the user asks to "send", "share", "link", or "get me" a file, PDF, image, report, CSV, or document; whenever you have produced a file (an HTML one-pager, a PDF, an image, an export) and need to hand the user a URL to it; or when a reply is really a document (a long table, a full report) that reads better as a link than as chat text. If you already have a public URL for the thing, just return that URL — do not re-host it.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Omega Present File

Give the user a link to a file. The runtime tells you two things through the environment:

- `ARTIFACT_DIR` — a writable directory. Files you place here are served publicly.
- `ARTIFACT_BASE_URL` — the public URL prefix those files are reachable at.

Both are set in your shell environment (`echo "$ARTIFACT_DIR" "$ARTIFACT_BASE_URL"`). If either is
missing or empty, tell the user you cannot share files right now — do not guess a URL.

## Procedure

1. Make sure the file exists on disk. If you generated content (e.g. an HTML one-pager), write it to a file first using your file tools.
2. Give the file a clear, human-readable name based on its content — hyphenate spaces so the link is clean, and keep the original extension. Example: `Pre-Listing-Packet-Anderson.pdf`. Make it distinctive enough (include the client, subject, or date) not to overwrite a different file already served.
3. Copy the file into `ARTIFACT_DIR` under that name, using your file tools (`cp <file> "$ARTIFACT_DIR/<name>"`).
4. Reply to the user with exactly the link: `ARTIFACT_BASE_URL` + `/` + the file name. For an `.html` file you may drop the `.html` from the link (`…/Report` serves `Report.html`); every other type keeps its extension (`…/Doc.pdf`). Nothing after the link needs the file path or the directory.

## When a reply is really a document

If what you are about to send is a long list, a full summary, or a table that a person would want to
read, scroll, or keep, write it to a file with a real extension (`.md`, `.html`, `.txt`, `.csv`,
`.pdf`), follow the procedure above, and answer with one short sentence saying what it is plus the link.

## Rules

- Never expose `ARTIFACT_DIR` or any local path to the user — only the `ARTIFACT_BASE_URL` link.
- One file, one clear human-readable name, one link. Do not list the directory. Reuse of the exact same name overwrites the previous file — keep names distinctive.
- The link is public to anyone who has it: never place a secret (a key, a token, a credential file) in `ARTIFACT_DIR`.
- If the user already gave you a URL, return that URL unchanged instead of re-hosting.
- Files under `ARTIFACT_DIR` belong to your account and are shared by every session of this account; do not delete files you did not create in this conversation.
