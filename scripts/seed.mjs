#!/usr/bin/env node
// Seed the sandbox: labels, issues, and the fix/release history the issue
// tracker refers to. Operator tooling — runs under YOUR `gh` identity against
// the repository this clone points at. Idempotent; `--reset` closes every open
// seeded issue as "not planned" and opens fresh copies (numbers advance,
// titles are the stable key).
//
//   node scripts/seed.mjs            # top up to the seeded state
//   node scripts/seed.mjs --reset    # retire the open seeded set, then reseed
//   node scripts/seed.mjs --only labels|issues|history
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const reset = args.includes('--reset');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : undefined;

const sh = (cmd, cmdArgs, opts = {}) =>
  (execFileSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], ...opts }) ?? '').trim();
const gh = (...a) => sh('gh', a);
const git = (...a) => sh('git', a);

const repo = gh('repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner');
console.log(`repo: ${repo}`);

// ---- labels ---------------------------------------------------------------
// A minimal subset of microsoft/vscode's vocabulary (colors copied where the
// label exists there) plus four fake area labels. Deliberately NOT vscode's
// ~300 area labels, and no `*caused-by-extension` — meaningless in a repo
// that IS an extension.
const labels = [
  ['bug', '8D6673', 'Issue identified as probable bug'],
  ['feature-request', 'dcdcdc', 'Request for new features or functionality'],
  ['info-needed', 'E2A1C2', 'Issue requires more information from poster'],
  ['*duplicate', 'E2A1C2', 'Issue identified as a duplicate of another issue(s)'],
  ['*as-designed', 'E2A1C2', 'Described behavior is as designed'],
  ['*not-reproducible', 'E2A1C2', 'Issue cannot be reproduced as described'],
  ['*out-of-scope', 'E2A1C2', 'Posted issue is not in scope of Note Stats'],
  ['*question', 'dcdcdc', 'Issue represents a question'],
  ['verified', '009800', 'Verification succeeded'],
  ['unreleased', 'D1B697', 'Fix has not yet been released'],
  ['insiders-released', '64BEAA', 'Fix has been released in a pre-release'],
  ['security', 'e11d21', ''],
  ['status-bar', 'c5def5', 'Area: the status bar item'],
  ['commands', 'c5def5', 'Area: Insert Timestamp / Slugify commands'],
  ['settings', 'c5def5', 'Area: configuration handling'],
  ['web', 'c5def5', 'Area: running on vscode.dev'],
];

// GitHub seeds every new repo with these; they compete with the vocabulary above
// (`duplicate` vs `*duplicate`, `enhancement` vs `feature-request`), so they go.
const defaultLabels = ['accessibility', 'documentation', 'duplicate', 'enhancement', 'good first issue',
  'help wanted', 'invalid', 'question', 'wontfix'];

function seedLabels() {
  const existing = new Set(JSON.parse(gh('label', 'list', '--limit', '200', '--json', 'name')).map((l) => l.name));
  for (const name of defaultLabels.filter((n) => existing.has(n))) {
    gh('label', 'delete', name, '--yes');
    console.log(`label    removed ${name}`);
  }
  for (const [name, color, description] of labels) {
    gh('label', 'create', name, '--color', color, '--description', description, '--force');
  }
  console.log(`labels: ${labels.length} ensured`);
}

// ---- issues ---------------------------------------------------------------
const seeds = JSON.parse(readFileSync(path.join(root, 'scripts', 'seed-issues.json'), 'utf8'));

function openIssues() {
  return JSON.parse(gh('issue', 'list', '--state', 'open', '--limit', '500', '--json', 'number,title'));
}

function seedIssues() {
  const titles = new Set(seeds.map((s) => s.title));
  if (reset) {
    for (const it of openIssues().filter((i) => titles.has(i.title))) {
      gh('issue', 'close', String(it.number), '--reason', 'not planned', '--comment',
        'Sandbox reset: this seeded issue is retired; a fresh copy is opened in its place.');
      console.log(`closed   ${it.number}  ${it.title}`);
    }
  }
  const open = new Map(openIssues().map((i) => [i.title, i.number]));
  for (const s of seeds) {
    if (open.has(s.title)) {
      console.log(`exists   ${open.get(s.title)}  ${s.title}`);
      continue;
    }
    const labelArgs = s.labels.flatMap((l) => ['--label', l]);
    const url = sh('gh', ['issue', 'create', '--title', s.title, '--body-file', '-', ...labelArgs], { input: s.body });
    console.log(`created  ${url.split('/').pop()}  ${s.title}`);
  }
}

// ---- history --------------------------------------------------------------
// The tracker's ground truth: v0.1.0 on the pristine commit; slugify fixed on
// main and released in v0.2.0; timestampFormat fixed on main after the tag
// (unreleased); the word-count fix only on a branch that never merges.
// Commit messages name the defect, never an issue number.
const statsPath = path.join(root, 'src', 'stats.ts');
const testPath = path.join(root, 'test', 'stats.test.ts');

function patch(file, from, to) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes(from)) return false;
  writeFileSync(file, src.replace(from, to));
  return true;
}
const hasTag = (t) => git('tag', '--list', t) === t;
const hasBranch = (b) => git('branch', '--list', b).trim() !== '';
const clean = () => git('status', '--porcelain') === '';
const commit = (msg) => { git('add', '-A'); git('commit', '-q', '-m', msg); console.log(`commit   ${msg}`); };

const SLUG_OLD = `    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');`;
const SLUG_NEW = `    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');`;
const SLUG_TEST = `test('slugify trims edge hyphens and folds diacritics', () => {
  assert.equal(slugify('## Café menu, part 2!'), 'cafe-menu-part-2');
});
`;
const TS_OLD = `export function formatTimestamp(date: Date, _format: TimestampFormat): string {
  return date.toISOString();
}`;
const TS_NEW = `export function formatTimestamp(date: Date, format: TimestampFormat): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = \`\${date.getFullYear()}-\${pad(date.getMonth() + 1)}-\${pad(date.getDate())}\`;
  switch (format) {
    case 'date':
      return day;
    case 'datetime':
      return \`\${day} \${pad(date.getHours())}:\${pad(date.getMinutes())}\`;
    default:
      return date.toISOString();
  }
}`;
const TS_TEST = `test('formatTimestamp honors the date and datetime formats', () => {
  const d = new Date(2026, 0, 2, 3, 4, 5);
  assert.equal(formatTimestamp(d, 'date'), '2026-01-02');
  assert.equal(formatTimestamp(d, 'datetime'), '2026-01-02 03:04');
});
`;
const WC_OLD = `trimmed.split(' ').length`;
const WC_NEW = `trimmed.split(/\\s+/).length`;
const WC_TEST = `test('computeStats collapses runs of whitespace', () => {
  assert.equal(computeStats('one  two').words, 2);
  assert.equal(computeStats('para one\\n\\npara two').words, 4);
});
`;

function seedHistory() {
  if (!clean()) throw new Error('working tree not clean — commit or stash before seeding history');
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch !== 'main') throw new Error(`seed history from main (on ${branch})`);

  if (!hasTag('v0.1.0')) {
    const pristine = readFileSync(statsPath, 'utf8');
    if (!pristine.includes(SLUG_OLD) || !pristine.includes(WC_OLD)) {
      throw new Error('v0.1.0 must tag the pristine commit, but src/stats.ts is already patched');
    }
    git('tag', '-a', 'v0.1.0', '-m', 'Note Stats 0.1.0');
    console.log('tag      v0.1.0');
  }
  if (patch(statsPath, SLUG_OLD, SLUG_NEW)) {
    writeFileSync(testPath, readFileSync(testPath, 'utf8') + '\n' + SLUG_TEST);
    commit('slugify: trim leading/trailing hyphens and fold diacritics');
  }
  if (!hasTag('v0.2.0')) {
    git('tag', '-a', 'v0.2.0', '-m', 'Note Stats 0.2.0');
    console.log('tag      v0.2.0');
  }
  if (patch(statsPath, TS_OLD, TS_NEW)) {
    writeFileSync(testPath, readFileSync(testPath, 'utf8') + '\n' + TS_TEST);
    commit('insert timestamp: honor the noteStats.timestampFormat setting');
  }
  if (!hasBranch('fix/word-count')) {
    git('checkout', '-q', '-b', 'fix/word-count');
    if (!patch(statsPath, WC_OLD, WC_NEW)) throw new Error('word-count defect not found on main');
    writeFileSync(testPath, readFileSync(testPath, 'utf8') + '\n' + WC_TEST);
    commit('word count: split on any whitespace run');
    git('checkout', '-q', 'main');
    console.log('branch   fix/word-count');
  }
  sh('npm', ['test'], { stdio: 'inherit' });
  git('push', '-q', 'origin', 'main', '--tags');
  git('push', '-q', 'origin', 'fix/word-count');
  console.log('pushed   main, tags, fix/word-count');
}

if (!only || only === 'labels') seedLabels();
if (!only || only === 'history') seedHistory();
if (!only || only === 'issues') seedIssues();
