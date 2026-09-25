import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, formatStats, formatTimestamp, slugify } from '../src/stats';

test('computeStats counts words in a simple sentence', () => {
  assert.equal(computeStats('one two three').words, 3);
});

test('computeStats counts words separated by whitespace runs', () => {
  const repeatedSpaces = 'one  two';
  const blankLine = 'one\n\n\ntwo';

  assert.deepEqual(computeStats(repeatedSpaces), { words: 2, characters: repeatedSpaces.length });
  assert.deepEqual(computeStats(blankLine), { words: 2, characters: blankLine.length });
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

test('slugify removes separator hyphens caused by edge punctuation', () => {
  assert.equal(slugify('!Hello World'), 'hello-world');
  assert.equal(slugify('Hello World!'), 'hello-world');
});

test('slugify folds accented letters to ASCII', () => {
  assert.equal(slugify('## Café menu, part 2!'), 'cafe-menu-part-2');
});

test('formatTimestamp iso returns an ISO string', () => {
  assert.equal(formatTimestamp(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)), 'iso'), '2026-01-02T03:04:05.000Z');
});

test('formatTimestamp date returns a local calendar date', () => {
  assert.equal(formatTimestamp(new Date(2026, 0, 2, 3, 4, 5), 'date'), '2026-01-02');
});

test('formatTimestamp datetime returns local date and time', () => {
  assert.equal(formatTimestamp(new Date(2026, 0, 2, 3, 4, 5), 'datetime'), '2026-01-02 03:04');
});
