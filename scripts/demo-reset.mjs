#!/usr/bin/env node
// Reset the sandbox after a sweeper-fix / sweeper-plan demo, so the same issues can be
// demoed again. Operator tooling — runs under YOUR `gh` identity against the repository
// this clone points at. Dry run by default; nothing changes without --apply.
//
//   node scripts/demo-reset.mjs            # show what would be reset
//   node scripts/demo-reset.mjs --apply    # do it
//
// What it resets:
//   1. open skill PRs — head branch `<you>/fix-<n>` AND a body carrying the sweeper's
//      seeded-by marker — closed, their branch deleted (the commit stays reachable
//      from the closed PR's refs/pull/<n>/head);
//   2. extra git worktrees under `<clone>.worktrees/` (the Agents window makes one per
//      session) — plan files archived, uncommitted work stashed, worktree removed;
//   3. local branches `<you>/fix-*` and `<you>/agents/*` — deleted, each SHA printed so
//      it can be restored with `git branch <name> <sha>`;
//   4. the main checkout — tracked uncommitted work stashed, back on an up-to-date `main`;
//   5. `.sweeper/plans/*.md` — moved to `.sweeper/archive/<timestamp>/`.
// Nothing is discarded: work in progress goes to a labeled `git stash`, plans to the
// archive. Issues are not touched (use `seed.mjs --reset` for that).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const MARKER = 'Seeded by a VS Code Sweeper review';
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const git = (args, cwd = root) => run('git', args, { cwd });
const gh = (args) => run('gh', args);

const actions = [];
function act(label, fn) {
  actions.push(label);
  console.log(`${apply ? '→' : '·'} ${label}`);
  if (apply) fn();
}

// Guard: this closes PRs and deletes branches — never outside the sandbox.
const repo = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
if (!/\/sweeper-sandbox$/.test(repo)) {
  console.error(`Refusing: ${repo} is not a sweeper sandbox (expected <owner>/sweeper-sandbox).`);
  process.exit(1);
}
const login = gh(['api', 'user', '--jq', '.login']);
console.log(`${apply ? 'Resetting' : 'Dry run for'} ${repo} as ${login}${apply ? '' : ' — pass --apply to reset'}\n`);

// 1 · Open skill PRs.
const prs = JSON.parse(gh(['pr', 'list', '--repo', repo, '--state', 'open', '--json', 'number,title,headRefName,body', '--limit', '100']));
const fixBranch = new RegExp(`^${login}/fix-\\d+$`);
for (const pr of prs) {
  if (!fixBranch.test(pr.headRefName) || !pr.body.includes(MARKER)) {
    console.log(`  skip PR #${pr.number} (${pr.headRefName}) — not a sweeper skill PR`);
    continue;
  }
  act(`close PR #${pr.number} "${pr.title}" and delete ${pr.headRefName}`, () =>
    gh(['pr', 'close', String(pr.number), '--repo', repo, '--delete-branch']));
}

// Stash uncommitted work under a findable label. A worktree about to be removed also
// stashes its untracked files; the main checkout stashes tracked changes only, so
// unrelated untracked files there stay put. Ignored files (.sweeper/) are never stashed.
function stashIfDirty(dir, what, { untracked }) {
  const status = git(['status', '--porcelain', `--untracked-files=${untracked ? 'all' : 'no'}`], dir);
  if (status === '') return;
  act(`stash uncommitted work in ${what} as "demo-reset ${stamp}"`, () =>
    git(['stash', 'push', ...(untracked ? ['--include-untracked'] : []), '-m', `demo-reset ${stamp} (${what})`], dir));
}

function archivePlans(dir, what) {
  const plans = path.join(dir, '.sweeper', 'plans');
  const files = existsSync(plans) ? readdirSync(plans).filter((f) => f.endsWith('.md')) : [];
  if (files.length === 0) return;
  const dest = path.join(root, '.sweeper', 'archive', stamp, what.replace(/[^\w.-]+/g, '_'));
  act(`archive ${files.join(', ')} from ${what} to ${path.relative(root, dest)}/`, () => {
    mkdirSync(dest, { recursive: true });
    for (const f of files) renameSync(path.join(plans, f), path.join(dest, f));
  });
}

// 2 · Extra worktrees (the Agents window's per-session checkouts).
const worktrees = git(['worktree', 'list', '--porcelain'])
  .split('\n\n')
  .map((block) => Object.fromEntries(block.split('\n').map((l) => [l.split(' ')[0], l.slice(l.indexOf(' ') + 1)])))
  .filter((w) => w.worktree && path.resolve(w.worktree) !== root);
for (const w of worktrees) {
  const name = path.basename(w.worktree);
  if (existsSync(w.worktree)) {
    archivePlans(w.worktree, `worktree ${name}`);
    stashIfDirty(w.worktree, `worktree ${name}`, { untracked: true });
  }
  act(`remove worktree ${w.worktree}`, () => git(['worktree', 'remove', '--force', w.worktree]));
}
if (apply) git(['worktree', 'prune']);

// 4 · The main checkout back on an up-to-date main (before deleting branches: the
// current branch can't be deleted).
stashIfDirty(root, 'main checkout', { untracked: false });
const current = git(['branch', '--show-current']);
if (current !== 'main') act(`switch the main checkout from ${current} to main`, () => git(['switch', 'main']));
git(['fetch', '--prune', 'origin']);
const behind = Number(git(['rev-list', '--count', 'main..origin/main']));
if (behind > 0) act(`fast-forward main by ${behind} commit(s) to origin/main`, () => git(['merge', '--ff-only', 'origin/main']));

// 3 · Local skill and Agents-window branches.
const branches = git(['for-each-ref', '--format=%(refname:short) %(objectname:short)', 'refs/heads/'])
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split(' '));
for (const [name, sha] of branches) {
  if (!fixBranch.test(name) && !name.startsWith(`${login}/agents/`)) continue;
  act(`delete local branch ${name} (was ${sha} — restore with: git branch ${name} ${sha})`, () =>
    git(['branch', '-D', name]));
}

// 5 · Plan files in the main checkout.
archivePlans(root, 'main checkout');

console.log(
  actions.length === 0
    ? '\nNothing to reset — the sandbox is demo-ready.'
    : apply
      ? `\nDone: ${actions.length} step(s). The sandbox is demo-ready.`
      : `\n${actions.length} step(s) would run. Re-run with --apply.`
);
