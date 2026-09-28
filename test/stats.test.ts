import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, formatStats, formatTimestamp, slugify } from '../src/stats';

test('computeStats counts words in a simple sentence', () => {
  assert.equal(computeStats('one two three').words, 3);
});

test('computeStats returns zero for empty text', () => {
  assert.deepEqual(computeStats('   '), { words: 0, characters: 3 });
});

test('formatStats appends characters only when asked', () => {
  const stats = { words: 2, characters: 9 };
  assert.equal(formatStats(stats, false), '$(book) 2 words');
  assert.equal(formatStats(stats, true), '$(book) 2 words, 9 chars');
});

test('slugify lowercases and strips the heading marker', () => {
  assert.equal(slugify('## Hello World'), 'hello-world');
});

test('slugify folds accents and trims punctuation from the reported heading', () => {
  assert.equal(slugify('## Café menu, part 2!'), 'cafe-menu-part-2');
});

test('slugify does not produce separators at either edge', () => {
  assert.equal(slugify('...Hello world!!!'), 'hello-world');
});

test('slugify folds precomposed and combining accents equivalently', () => {
  assert.equal(slugify('## Crème brûlée'), 'creme-brulee');
  assert.equal(slugify('## Cre\u0300me bru\u0302le\u0301e'), 'creme-brulee');
});

test('slugify collapses repeated internal separators', () => {
  assert.equal(slugify('## Hello---   World'), 'hello-world');
});

test('formatTimestamp iso returns an ISO string', () => {
  assert.equal(formatTimestamp(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)), 'iso'), '2026-01-02T03:04:05.000Z');
});
