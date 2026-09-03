---
name: omega-database-pages
description: Use when writing to an OmegaAI database page — adding a row, setting a row's column values, or creating an entry that has both content and column data. Covers why a plain write can silently create a second, uuid-named page instead of updating the one you just made, and the primary-key rule that decides which happens.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Omega Database Pages

## When to use

Any time you are about to `write` to a database page, or to create an entry that needs BOTH page
content (an HTML block) and column values. Read this before the write, not after.

## The one thing that goes wrong

Asked to add a journal entry, an agent did this — and every call returned `ok`:

1. `add_page "Journal" "New entry"` — created the page
2. `write "Journal" {"header":["Date"],"rows":[["2026-09-02"]]}` — set the date
3. `set_html "Journal/New entry" "<p>…</p>"` — wrote the content

The result was a **split entry**: `Journal/New entry` had the content and no date, and a SECOND page
named `17b1d5e5-09c6-476c-9ea1-52a5ef5c647b` had the date and no content. Step 2 did not touch the
page from step 1 — it created a new row.

## Why

A database page's rows ARE pages. How a `write` behaves depends entirely on the page's primary key:

- **With a primary key**, `write {header, rows}` UPSERTS on that key — a row whose key matches an
  existing row updates it.
- **With NO primary key** (`"primary-key": []` in `describe`), there is no key to match on, so
  **every `write` INSERTS a new row page**, named by its own uuid because there is no key value to
  name it from.

**Always `describe` the page and read `primary-key` before you write.**

## Setting column values on a row page that already exists

This is the call that was missing above:

```
write "Path/To/DbPage#prop-vals:<page-id>" --data '{"prop-vals":{"ColumnName":"value"}}'
```

`#prop-vals:<page-id>` addresses that ONE row page's column values. It is an upsert: it works
whether or not the page already has values. Get the `<page-id>` from `ls` with verbose output.

## The correct sequence for "an entry with content and column data"

```
add_page "Journal" "My Entry Title"          → returns the new page-id
set_html "Journal/My Entry Title" "<p>…</p>" → the content
write "Journal#prop-vals:<that page-id>" --data '{"prop-vals":{"Date":"2026-09-02"}}'
```

One page, named, carrying both. No orphan.

## Rules

- **`describe` before you write.** The `primary-key` field decides everything.
- **`write {header, rows}` CREATES a row.** Reach for it when you want a new row, not when you want
  to modify one you already made.
- **`write "<page>#prop-vals:<page-id>"` SETS values on an existing row page.** Reach for it when
  the page already exists.
- **A uuid-named page is a symptom.** If `ls` shows a child whose name is a uuid, a write created it
  by accident — the values landed there instead of on the page you meant.
