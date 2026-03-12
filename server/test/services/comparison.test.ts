import { describe, it, expect } from 'vitest';
import { compareField, compareAllFields } from '../../src/services/comparisonService.js';
import type { ExtractedFields, ApplicationData } from '../../src/types.js';

describe('compareField', () => {
  it('brandName: exact match', () => {
    const result = compareField('brandName', 'OLD TOM DISTILLERY', 'OLD TOM DISTILLERY');
    expect(result.status).toBe('pass');
  });

  it('brandName: case difference → warning', () => {
    const result = compareField('brandName', 'OLD TOM DISTILLERY', 'Old Tom Distillery');
    expect(result.status).toBe('warning');
    expect(result.note).toContain('Case difference');
  });

  it('brandName: with trademark symbol', () => {
    const result = compareField('brandName', 'BrandName', 'BrandName™');
    expect(result.status).toBe('pass');
  });

  it('brandName: mismatch', () => {
    const result = compareField('brandName', 'Brand A', 'Brand B Completely Different');
    expect(result.status).toBe('fail');
  });

  it('classType: case-insensitive match', () => {
    const result = compareField('classType', 'Kentucky Straight Bourbon Whiskey', 'kentucky straight bourbon whiskey');
    expect(result.status).toBe('pass');
  });

  it('alcoholContent: numeric match within tolerance', () => {
    const result = compareField('alcoholContent', '45% Alc./Vol.', '45.0% ABV');
    expect(result.status).toBe('pass');
  });

  it('alcoholContent: numeric mismatch', () => {
    const result = compareField('alcoholContent', '45% Alc./Vol.', '40% ABV');
    expect(result.status).toBe('fail');
  });

  it('netContents: unit normalization', () => {
    const result = compareField('netContents', '750 mL', '750 ML');
    expect(result.status).toBe('pass');
  });

  it('producerName: suffix normalization', () => {
    const result = compareField('producerName', 'Old Tom Distillery Co.', 'Old Tom Distillery');
    expect(result.status).toBe('pass');
  });

  it('producerAddress: state abbreviation expansion', () => {
    const result = compareField('producerAddress', 'Louisville, KY', 'Louisville, Kentucky');
    expect(result.status).toBe('pass');
  });

  it('countryOfOrigin: variant normalization', () => {
    const result = compareField('countryOfOrigin', 'USA', 'United States');
    expect(result.status).toBe('pass');
  });

  it('countryOfOrigin: mismatch', () => {
    const result = compareField('countryOfOrigin', 'USA', 'France');
    expect(result.status).toBe('fail');
  });

  it('handles null extraction → fail', () => {
    const result = compareField('brandName', 'Brand', null);
    expect(result.status).toBe('fail');
    expect(result.note).toContain('not found');
  });
});

describe('compareAllFields', () => {
  const makeApp = (overrides: Partial<ApplicationData> = {}): ApplicationData => ({
    brandName: 'Test Brand',
    classType: 'Bourbon Whiskey',
    alcoholContent: '45%',
    netContents: '750 ml',
    governmentWarning: 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.',
    producerName: 'Test Co.',
    producerAddress: 'Louisville, KY',
    countryOfOrigin: 'USA',
    ...overrides,
  });

  const makeExtracted = (overrides: Partial<Record<string, { value: string | null; confidence: string }>> = {}): ExtractedFields => {
    const defaults: Record<string, { value: string | null; confidence: string }> = {
      brandName: { value: 'Test Brand', confidence: 'high' },
      classType: { value: 'Bourbon Whiskey', confidence: 'high' },
      alcoholContent: { value: '45%', confidence: 'high' },
      netContents: { value: '750 ml', confidence: 'high' },
      governmentWarning: { value: 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.', confidence: 'high' },
      producerName: { value: 'Test Co.', confidence: 'high' },
      producerAddress: { value: 'Louisville, KY', confidence: 'high' },
      countryOfOrigin: { value: 'USA', confidence: 'high' },
    };
    return { ...defaults, ...overrides } as unknown as ExtractedFields;
  };

  it('all pass → recommendation pass', () => {
    const { recommendation } = compareAllFields(makeApp(), makeExtracted());
    expect(recommendation).toBe('pass');
  });

  it('any fail → recommendation fail', () => {
    const { recommendation } = compareAllFields(
      makeApp(),
      makeExtracted({ brandName: { value: 'Wrong Brand', confidence: 'high' } })
    );
    expect(recommendation).toBe('fail');
  });

  it('warning only → recommendation warning', () => {
    const { recommendation } = compareAllFields(
      makeApp(),
      makeExtracted({ brandName: { value: 'test brand', confidence: 'high' } })
    );
    expect(recommendation).toBe('warning');
  });
});
