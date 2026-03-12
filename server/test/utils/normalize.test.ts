import { describe, it, expect } from 'vitest';
import {
  normalizeString,
  extractNumeric,
  normalizeUnit,
  stripTrademark,
  normalizeCompanySuffix,
  normalizeStateAbbreviation,
  normalizeCountry,
} from '../../src/utils/normalize.js';

describe('normalizeString', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeString('  hello   world  ')).toBe('hello world');
  });

  it('normalizes unicode quotes', () => {
    expect(normalizeString('\u2018hello\u2019')).toBe("'hello'");
    expect(normalizeString('\u201Chello\u201D')).toBe('"hello"');
  });

  it('normalizes unicode dashes', () => {
    expect(normalizeString('a\u2013b\u2014c')).toBe('a-b-c');
  });

  it('normalizes ellipsis', () => {
    expect(normalizeString('wait\u2026')).toBe('wait...');
  });
});

describe('extractNumeric', () => {
  it('extracts decimal from ABV string', () => {
    expect(extractNumeric('45% Alc./Vol.')).toBe(45);
  });

  it('extracts decimal number', () => {
    expect(extractNumeric('12.5% ABV')).toBe(12.5);
  });

  it('returns null for no number', () => {
    expect(extractNumeric('no numbers here')).toBeNull();
  });

  it('extracts from net contents', () => {
    expect(extractNumeric('750 mL')).toBe(750);
  });
});

describe('normalizeUnit', () => {
  it('normalizes mL/ML/ml variants', () => {
    expect(normalizeUnit('750 mL')).toBe('750 ml');
    expect(normalizeUnit('750 ML')).toBe('750 ml');
  });

  it('normalizes fl oz variants', () => {
    expect(normalizeUnit('25.4 Fl. Oz.')).toBe('25.4 fl oz');
  });
});

describe('stripTrademark', () => {
  it('removes trademark symbols', () => {
    expect(stripTrademark('Brand™')).toBe('Brand');
    expect(stripTrademark('Brand®')).toBe('Brand');
    expect(stripTrademark('Brand℠')).toBe('Brand');
  });
});

describe('normalizeCompanySuffix', () => {
  it('strips common suffixes', () => {
    expect(normalizeCompanySuffix('Old Tom Distillery Co.')).toBe('Old Tom Distillery');
    expect(normalizeCompanySuffix('Acme Inc.')).toBe('Acme');
    expect(normalizeCompanySuffix('Acme LLC')).toBe('Acme');
    expect(normalizeCompanySuffix('Acme Ltd.')).toBe('Acme');
    expect(normalizeCompanySuffix('Acme Corporation')).toBe('Acme');
  });
});

describe('normalizeStateAbbreviation', () => {
  it('expands state abbreviations', () => {
    expect(normalizeStateAbbreviation('Louisville, KY')).toBe('Louisville, Kentucky');
    expect(normalizeStateAbbreviation('New York, NY')).toBe('New York, New York');
  });

  it('leaves non-abbreviations alone', () => {
    expect(normalizeStateAbbreviation('Louisville, Kentucky')).toBe('Louisville, Kentucky');
  });
});

describe('normalizeCountry', () => {
  it('normalizes US variants', () => {
    expect(normalizeCountry('US')).toBe('United States');
    expect(normalizeCountry('USA')).toBe('United States');
    expect(normalizeCountry('United States of America')).toBe('United States');
  });

  it('normalizes UK variants', () => {
    expect(normalizeCountry('UK')).toBe('United Kingdom');
    expect(normalizeCountry('Great Britain')).toBe('United Kingdom');
  });

  it('passes through unknown countries', () => {
    expect(normalizeCountry('France')).toBe('France');
  });
});
