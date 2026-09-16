# Vision

Note Stats is a tiny VS Code extension for people who write prose in the editor:
notes, docs, blog drafts. It shows what a writer wants to know at a glance in the
status bar (how long is this?) and offers two or three keyboard-reachable helpers
for the chores of writing in markdown (timestamps, heading slugs).

## Product direction

- **Glanceable, not chatty.** One status bar item, no notifications, no webviews.
- **Zero configuration to start.** Sensible defaults; a handful of settings, each
  one with an obvious effect that applies immediately.
- **Measure, don't edit.** The extension reports on text and inserts small
  snippets on request. It never changes prose on its own and never judges it.
- **Pure logic stays pure.** Everything that can be computed without the `vscode`
  API lives in `src/stats.ts` and is unit-tested with `node:test`. The extension
  file only wires events to those helpers.
- **Small enough to read in ten minutes.** The whole extension should stay under a
  few hundred lines.

## In scope

- Counts and estimates derived from the document text or the selection: words,
  characters, lines, paragraphs, reading time.
- Small insertion helpers for markdown writing: timestamps, slugs.
- Running wherever VS Code runs, including the web (vscode.dev), as long as the
  extension stays dependency-free.

## Out of scope

- Spell checking, grammar, style or readability *advice*, rewriting, translation,
  or any AI-assisted writing feature. Other extensions own that space.
- Anything that needs a server, a database, an account, or network access.
- Language-specific tooling beyond markdown and plain text.
- Project-wide statistics or dashboards; Note Stats is about the file in front
  of you.

## How issues are handled

- Bug reports need steps to reproduce and the observed vs expected behavior;
  reports without them are asked for details.
- Feature requests are weighed against the direction above. Requests outside it
  are closed as out of scope with a pointer to this document; requests inside it
  stay open for community upvotes.
- Duplicates are closed in favor of the older, better-described issue.
- Fixes land as direct commits on `main` and ship in the next semver tag; the
  release notes are the tag's commit list.
- Issues are filed by the repository owner on behalf of outside reporters;
  who filed an issue carries no weight in how it is handled.
