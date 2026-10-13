---
name: omega-dev-revise
description: Use when the user changes a decision, a requirement or a task in a spec or plan that already exists, when a develop surface needs a plan corrected, or when a Dev Subagent's job message says to follow omega-dev-revise.
---

**Parent skill: `omega-dev-coordinate`.** If you have not invoked `omega-dev-coordinate` yet, invoke
it first — it says who does what in development work — then come back here.
A Dev Subagent skips that line and goes straight to its part below.

# Development Revise

A change to a spec or plan is recorded in its ledger and made in place, so the file always says what
is true now and the ledgers say why.

## Coordinator

1. Know which file: the Plan Name and whether it is the spec or the plan. If the user did not say
   and there is more than one candidate, ask: "Which plan, and the spec or the plan?"
2. Know which ledger. The user changing something → `User Feedback Ledger`, entry text = the user's
   own words, word for word. A correction found by you or a Dev Subagent (a develop surface, a
   contradiction) → `AI Self-Revision Ledger`, entry text = one sentence saying what was found.
3. Dispatch a Dev Subagent with part "Revise": the file path, the ledger, the entry text, and the
   change — which sections or task numbers, and what they must say now. Report: the ledger line it
   added and the headings of the sections it changed.
4. Tell the user what changed.

## Dev Subagent — part "Revise"

1. Add ONE line at the end of the named ledger: `U.N — [YYYY-MM-DD HH:MM] <entry text>` for the
   User Feedback Ledger, `A.N — [YYYY-MM-DD HH:MM] <entry text>` for the AI Self-Revision Ledger,
   where N is one more than that ledger's last number (1 if it is empty) and the time is
   `date -u '+%Y-%m-%d %H:%M'`. User entry text is copied exactly as the job quotes it. The square
   brackets are part of the line, for example
   `U.1 — [2026-10-13 09:56] In the farewell spec, make it return "Bye, <name>." instead.`
2. Rewrite the named sections or tasks in place so they say what is true now. Keep task numbers.
   Never change `Clarifying questions and answers`: it records what was asked and answered at the
   time; the new ledger line records the change.
   Replace old text; do not mark it deprecated or leave both versions. Add a task only for work
   that is new.
3. Never change, clear or reorder an existing ledger line.
4. Reply with the Report the job asks for.
