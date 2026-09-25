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

for (const [name, text, expected] of [
  ['empty text', '', 1],
  ['one line', 'one', 1],
  ['LF separator', 'one\ntwo', 2],
  ['CRLF separator', 'one\r\ntwo', 2],
  ['CR separator', 'one\rtwo', 2],
  ['one trailing line break', 'one\n', 2],
  ['multiple trailing line breaks', 'one\n\n', 3],
] as const) {
  test(`computeStats counts lines for ${name}`, () => {
    assert.equal(computeStats(text).lines, expected);
  });
}

for (const [name, text, expected] of [
  ['empty text', '', 0],
  ['whitespace-only text', ' \t ', 0],
  ['one paragraph', 'one', 1],
  ['consecutive blank lines', 'one\n\n\ntwo', 2],
  ['whitespace-only separator lines', 'one\n \t \ntwo', 2],
  ['a paragraph spanning multiple lines', 'one\ntwo', 1],
] as const) {
  test(`computeStats counts paragraphs for ${name}`, () => {
    assert.equal(computeStats(text).paragraphs, expected);
  });
}

test('formatStats appends characters only when asked', () => {
  const stats = { words: 2, characters: 9, lines: 3, paragraphs: 2 };
  assert.equal(formatStats(stats, false), '$(book) 2 words');
  assert.equal(formatStats(stats, true), '$(book) 2 words, 9 chars');
});

test('formatTooltip includes line and paragraph counts with hide guidance', () => {
  const stats = { words: 2, characters: 9, lines: 3, paragraphs: 2 };
  assert.equal(formatTooltip(stats), 'Note Stats — 3 lines, 2 paragraphs — click to hide');
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
