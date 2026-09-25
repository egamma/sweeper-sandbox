import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, formatStats, formatTimestamp, formatTooltip, slugify } from '../src/stats';

test('computeStats counts words in a simple sentence', () => {
  assert.equal(computeStats('one two three').words, 3);
});

test('computeStats counts words separated by whitespace runs', () => {
  const repeatedSpaces = 'one  two';
  const blankLine = 'one\n\n\ntwo';

  assert.deepEqual(computeStats(repeatedSpaces), {
    words: 2,
    characters: repeatedSpaces.length,
    lines: 1,
    paragraphs: 1,
  });
  assert.deepEqual(computeStats(blankLine), {
    words: 2,
    characters: blankLine.length,
    lines: 4,
    paragraphs: 2,
  });
});

test('computeStats returns zero for empty text', () => {
  assert.deepEqual(computeStats('   '), { words: 0, characters: 3, lines: 1, paragraphs: 0 });
});

test('computeStats counts logical lines', () => {
  const cases = [
    { text: '', expected: 1 },
    { text: 'one', expected: 1 },
    { text: 'one\ntwo', expected: 2 },
    { text: 'one\r\ntwo', expected: 2 },
    { text: 'one\rtwo', expected: 2 },
    { text: 'one\n', expected: 2 },
    { text: 'one\n\n', expected: 3 },
  ];

  for (const { text, expected } of cases) {
    assert.equal(computeStats(text).lines, expected);
  }
});

test('computeStats counts blank-line-separated paragraphs', () => {
  const cases = [
    { text: '', expected: 0 },
    { text: ' \t', expected: 0 },
    { text: 'one', expected: 1 },
    { text: 'one\ntwo', expected: 1 },
    { text: 'one\n\ntwo', expected: 2 },
    { text: 'one\n \t\n\ntwo', expected: 2 },
    { text: '\n\none\n\n', expected: 1 },
  ];

  for (const { text, expected } of cases) {
    assert.equal(computeStats(text).paragraphs, expected);
  }
});

test('formatStats appends characters only when asked', () => {
  const stats = { words: 2, characters: 9, lines: 3, paragraphs: 2 };
  assert.equal(formatStats(stats, false), '$(book) 2 words');
  assert.equal(formatStats(stats, true), '$(book) 2 words, 9 chars');
});

test('formatTooltip displays line and paragraph counts after the hide guidance', () => {
  const stats = { words: 2, characters: 9, lines: 3, paragraphs: 2 };
  assert.equal(formatTooltip(stats), 'Note Stats — click to hide\nLines: 3 · Paragraphs: 2');
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
