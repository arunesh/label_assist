import { describe, it, expect } from 'vitest';
import { jaroWinklerSimilarity, fuzzyMatch, levenshteinDistance } from '../../src/utils/fuzzyMatch.js';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns correct distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
  });
});

describe('jaroWinklerSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(jaroWinklerSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('returns 0 for empty string', () => {
    expect(jaroWinklerSimilarity('', 'hello')).toBe(0);
  });

  it('returns high similarity for similar strings', () => {
    const sim = jaroWinklerSimilarity('MARTHA', 'MARHTA');
    expect(sim).toBeGreaterThan(0.95);
  });

  it('returns low similarity for very different strings', () => {
    const sim = jaroWinklerSimilarity('hello', 'world');
    expect(sim).toBeLessThan(0.5);
  });
});

describe('fuzzyMatch', () => {
  it('matches identical strings', () => {
    const result = fuzzyMatch('hello', 'hello');
    expect(result.match).toBe(true);
    expect(result.similarity).toBe(1.0);
  });

  it('matches strings within levenshtein threshold', () => {
    const result = fuzzyMatch('hello', 'helo');
    expect(result.match).toBe(true);
  });

  it('does not match very different strings', () => {
    const result = fuzzyMatch('hello world', 'goodbye universe');
    expect(result.match).toBe(false);
  });

  it('respects custom thresholds', () => {
    const strict = fuzzyMatch('abc', 'abx', { maxLevenshtein: 0, minJaroWinkler: 0.99 });
    expect(strict.match).toBe(false);
  });
});
