---
name: omega-database-pages
description: Use when creating or writing to an OmegaAI database page — new page (columns, key, views, README entry), adding a row, setting a row's column values, or an entry with both content and column data. Covers why a plain write can silently create a second, uuid-named page instead of updating the one you just made, and the primary-key rule that decides which happens.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Omega Database Pages

## When to use

Any time you are about to `write` to a database page, or to create an entry that needs BOTH page
content (an HTML block) and column values. Read this before the write, not after.

## Creating a database page

A database page is not finished when `add_page … database: true` returns. Measured 2026-09-21: an
agent asked for "a project tracker board" created the page and its columns and stopped — no view,
so the page rendered as a bare table, and nothing in `Notes/README` pointed at it. Do all of this,
in this order, and read each result back:

1. **`add_page`** with `database: true` under the folder the user named (never the workspace root
   unless they said so). `describe` it: `is-database "true"`, `primary-key []`.
2. **Columns, one `set_column` per select.** Declare text columns together with `set_db_columns`
   if you like, but declare EVERY `select` column on its own with
   `set_column <page> <Name> {"prop-type": "select", "options": [{"label": "…"}, …]}` — passing
   two select columns in one `set_db_columns` call gives BOTH the union of all their options
   (engine defect, 2026-09-21). Then `get_db_props` and check each select's `options` is exactly
   its own list. Column types are `text` and `select` only — there is no date type; store dates as
   text `YYYY-MM-DD`.
3. **`set_primary_key`** on the column that names a row (the title). Rows are pages named by it.
4. **Views — at least one, or the page is unusable in the UI.** `add_view <page> {"view-type":
   "table", "name": "All", "sort-by": "<key column>", "sort-direction": "asc"}`; when the page has a
   status-like select (`Status`, `Stage`, `State`), also `add_view <page> {"view-type": "board",
   "name": "Board by <Column>", "group-by": "<Column>"}`. `list_views` and confirm both are there.
5. **The row(s)** the user asked for — `write {header, rows}` (the rest of this skill).
6. **The site map.** In the workspace the page is in, `read "Notes/README"`; if the README does not already name the page, add ONE
   line under its `Notes/` section in the README's own style (`<li><p><strong>Notes/<Name></strong>
   — <what it is>.</p></li>`) with `set_html` on the README's existing block, keeping every other
   line byte-identical; `read` it back. If that workspace is not your Home workspace, also make sure
   the Home workspace's `Notes/README` has one line linking this workspace's `Notes/README` (the
   workspace's name, its app id and the full path), the same way. A page the README does not name is
   a page the next agent cannot find (`omega-navigation`: the README is the entry point).

Tell the user the page path, the columns, the view names, and what you could not do (a date
column, for instance). Never silently downgrade.

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
write "Path/To/Table/Row#prop-vals" --data '{"prop-vals":{"ColumnName":"value"}}'
```

`Path/To/Table/Row#prop-vals` addresses THAT ROW PAGE's column values — you name the row, and
resolution supplies the table. It REPLACES the row's whole value set: send every column you want kept, and always the primary-key column(s), or it fails with MISSING_KEY_ERROR. To change only SOME columns, use the table write instead (see "To change SOME columns" below).
You do not need a page-id.

The older form `Path/To/Table#prop-vals:<row-page-id>` still works, but prefer the row path — it
needs no page-id, and mixing them (`Table/Row#prop-vals:<id>`) is rejected.

**If your tools are MCP (`omega_*`), the tool for this is `write_data` — NOT `write`.**

```
write_data  path:  "Path/To/Table/Row#prop-vals"
            patch: {"prop-vals": {"ColumnName": "value"}}
```

`write` sends its payload on stdin, and a `#fragment` path requires `--data`, so **`write` on a
`#prop-vals` path always fails** with `--data is required for a #fragment path`. `write_data` sends
`--data` and is the same call as the CLI line above. Its description says to prefer `write` for
database rows — that guidance is about whole-row `{header, rows}` writes and does **not** apply to a
`#prop-vals` fragment.

**If a write fails, do not retry it with different arguments and do not shell out.** Say which call
failed and stop — a tool that cannot express the operation is a problem for a human to fix, not
something to work around.

## The correct sequence for "an entry with content and column data"

```
add_page "Journal" "My Entry Title"          → returns the new page-id
set_html "Journal/My Entry Title" "<p>…</p>" → the content
write "Journal/My Entry Title#prop-vals" --data '{"prop-vals":{"Date":"2026-09-02"}}'
```

One page, named, carrying both. No orphan.

## The page's shape is NOT yours to change

**MEASURED 2026-09-04: this is the failure that actually happens.** Two agents, asked for a journal
entry on a page whose only column was `Date`, both decided the page was missing columns and fixed it:

```
set_db_columns  ["Date","Title","Body"]   ← added columns nobody asked for
set_primary_key ["Date"]                  ← imposed a key the page did not have
write {"header":["Date","Title","Body"], "rows":[[...]]}
```

Every call returned `ok`. The user asked for an entry and got a **schema change to their database**.
That is worse than the orphan: it is silent, it is destructive (`set_columns` DROPS any column you
omit, along with its data), and it changes how every future write to that page behaves.

**You were asked to add a ROW, not to redesign the TABLE.**

- **Never `set_db_columns` / `set_column` on a page you were asked to write to.** It is a schema
  migration.
- **Never `set_primary_key` on a page that has none.** Keyless is a deliberate design — a page whose
  rows are named entries does not want a key.
- **If the data does not fit the columns, that is because it is not column data.** On an entry page:
  the **title is the page's NAME**, the **body is an HTML block**, and only the remaining fields are
  columns. See "The correct sequence" above — `add_page` carries the title, `set_html` carries the
  body, `#prop-vals` carries the date. Nothing there needs a new column.

If you genuinely believe the schema is wrong, say so and stop. Changing it is the user's decision,
not yours.

## Rules

- **Never change the schema.** No `set_db_columns`, no `set_primary_key`, on a page you were asked
  to write a row to. Title → page name, body → HTML block, the rest → columns that already exist.
- **`describe` before you write.** The `primary-key` field decides everything.
- **`write {header, rows}` CREATES a row.** Reach for it when you want a new row, not when you want
  to modify one you already made.
- **To change SOME columns of an existing row, use the table write:** `write "<table>" --data '{"header":["<key col>","<col>"],"rows":[["<key>","<value>"]]}'` (MCP: `write`). It finds the row by its key and changes only the named columns.
- **`write "<table>/<row>#prop-vals"` replaces the row's WHOLE value set.** Use it only with every column, primary key included. Name the ROW, not the table — the table is inferred.
- **A uuid-named page is a symptom.** If `ls` shows a child whose name is a uuid, a write created it
  by accident — the values landed there instead of on the page you meant.
