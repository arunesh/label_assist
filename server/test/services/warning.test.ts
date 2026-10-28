import { describe, it, expect } from 'vitest';
import { validateGovernmentWarning } from '../../src/services/warningValidator.js';
import { GOVERNMENT_WARNING_TEXT } from '../../src/utils/constants.js';

describe('validateGovernmentWarning', () => {
  it('exact match → pass', () => {
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, GOVERNMENT_WARNING_TEXT);
    expect(result.status).toBe('pass');
  });

  it('missing warning → fail', () => {
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, null);
    expect(result.status).toBe('fail');
    expect(result.note).toContain('not found');
  });

  it('empty string → fail', () => {
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, '');
    expect(result.status).toBe('fail');
  });

  it('wrong casing on header → fail', () => {
    const wrongCase = GOVERNMENT_WARNING_TEXT.replace('GOVERNMENT WARNING:', 'Government Warning:');
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, wrongCase);
    expect(result.status).toBe('fail');
    expect(result.note).toContain('ALL CAPS');
  });

  it('word change in body → fail', () => {
    const changed = GOVERNMENT_WARNING_TEXT.replace('women', 'people');
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, changed);
    expect(result.status).toBe('fail');
    expect(result.note).toContain('differs at word');
  });

  it('all-caps body (e.g. "ACCORDING") → pass', () => {
    const allCaps = GOVERNMENT_WARNING_TEXT.toUpperCase();
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, allCaps);
    expect(result.status).toBe('pass');
  });

  it('mixed-case body → pass', () => {
    const mixed = GOVERNMENT_WARNING_TEXT.replace('According to the Surgeon General', 'according to the surgeon general');
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, mixed);
    expect(result.status).toBe('pass');
  });

  it('word change in all-caps body → fail', () => {
    const changed = GOVERNMENT_WARNING_TEXT.toUpperCase().replace('WOMEN', 'PEOPLE');
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, changed);
    expect(result.status).toBe('fail');
    expect(result.note).toContain('expected "women", found "PEOPLE"');
  });

  it('title-case header still fails even when body case is ignored', () => {
    const wrongHeader = 'Government Warning:' + GOVERNMENT_WARNING_TEXT.toUpperCase().slice('GOVERNMENT WARNING:'.length);
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, wrongHeader);
    expect(result.status).toBe('fail');
    expect(result.note).toContain('ALL CAPS');
  });

  it('extra whitespace normalized → pass', () => {
    const extraSpaces = GOVERNMENT_WARNING_TEXT.replace('women should', 'women  should');
    const result = validateGovernmentWarning(GOVERNMENT_WARNING_TEXT, extraSpaces);
    expect(result.status).toBe('pass');
  });
});
