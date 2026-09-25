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
- `scripts/demo-reset.mjs` — resets the clone after a sweeper-fix / sweeper-plan
  demo (operator tooling, see below)

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
It is idempotent: it creates missing labels and opens every seeded issue whose
title has no open twin. By default every planted defect stays open on `main`;
`--with-history` additionally lays down fix commits and release tags for two of
them (opt-in, for testing an implemented-on-main lane).

```sh
node scripts/seed.mjs                  # top up to the seeded state
node scripts/seed.mjs --reset          # close every open seeded issue, then reseed
node scripts/seed.mjs --with-history   # also seed the fix/release history
```

GitHub issues cannot be deleted, so a reset closes the old set as *not planned*
and opens fresh copies. Issue numbers advance; titles are the stable key.

## Resetting after a demo

`scripts/demo-reset.mjs` puts the clone back in its demo-ready state after a
`sweeper-plan` / `sweeper-fix` run, so the same issues can be demoed again. It is a
dry run unless `--apply` is given:

```sh
npm run demo-reset                     # show what would be reset
npm run demo-reset -- --apply          # reset
```

It closes open sweeper skill PRs (head branch `<you>/fix-<n>` with the sweeper's
seeded-by line in the body) and deletes their branches, removes the Agents
window's per-session worktrees, deletes local `<you>/fix-*` and `<you>/agents/*`
branches, returns the clone to an up-to-date `main`, and archives
`.sweeper/plans/` under `.sweeper/archive/`. Nothing is discarded: uncommitted
work goes to a labeled `git stash`, and every deleted branch is printed with its
SHA. It refuses to run outside a `*/sweeper-sandbox` repository and never
touches issues (that is `seed.mjs --reset`).
