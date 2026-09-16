# Note Stats

A deliberately small VS Code extension: a word count in the status bar, an
**Insert Timestamp** command, and a **Slugify Current Line** command for markdown
headings. Two settings, `noteStats.showCharacters` and `noteStats.timestampFormat`.

This repository is a **sandbox for issue-triage tooling**. Its issue tracker is
seeded with a graded mix of bug reports and feature requests, some of them vague,
some of them overlapping, written the way real reporters write them. The code
has bugs on purpose; they are what the issues are about. Nothing here is a
product.

The sandbox is issues-only: no pull requests are opened here. Fixes, when they
land, are direct commits on `main`, and releases are plain semver tags.

## Develop

```sh
npm install
npm test          # tsc + node --test over the pure helpers in src/stats.ts
```

Press F5 in VS Code to run the extension in an Extension Development Host.

## Layout

- `src/stats.ts` — pure helpers (unit-tested, no `vscode` import)
- `src/extension.ts` — activation, status bar item, commands
- `test/` — `node:test` suites
- `scripts/seed.mjs` — recreates the labels, seeded issues and release history
  (operator tooling, see below)

## Behavior notes

- **Counting.** Anything separated by whitespace counts as a word, including
  numbers and standalone punctuation, so the count matches what `wc -w` and most
  editors report. `3 apples and 2 pears` is five words.
- **Scope.** Note Stats measures text and inserts small snippets. It does not
  check, correct or rewrite prose: no spell checking, no grammar, no AI features,
  nothing that needs a server or an account. See [vision.md](vision.md).
- **Status bar item.** Left-aligned, click to hide. It hides itself when no
  editor is active.

## Seeding the sandbox

`scripts/seed.mjs` is run by the repository owner with the `gh` CLI signed in.
It is idempotent: it creates missing labels, opens every seeded issue whose title
has no open twin, and lays down the fix commits and release tags if absent.

```sh
node scripts/seed.mjs            # top up to the seeded state
node scripts/seed.mjs --reset    # close every open seeded issue, then reseed
```

GitHub issues cannot be deleted, so a reset closes the old set as *not planned*
and opens fresh copies. Issue numbers advance; titles are the stable key.
