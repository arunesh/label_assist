import { GOVERNMENT_WARNING_TEXT } from '../utils/constants.js';
import { normalizeString } from '../utils/normalize.js';
import type { FieldResult } from '../types.js';

export function validateGovernmentWarning(
  applicationValue: string,
  extractedValue: string | null
): FieldResult {
  const field = 'governmentWarning' as const;

  // 1. Presence check
  if (!extractedValue || extractedValue.trim().length === 0) {
    return {
      field,
      status: 'fail',
      applicationValue,
      extractedValue,
      note: 'Government warning not found on label',
    };
  }

  const normalized = normalizeString(extractedValue);

  // 2. Format check — header must be ALL CAPS
  if (!normalized.startsWith('GOVERNMENT WARNING:')) {
    const lowerCheck = normalized.toLowerCase();
    if (lowerCheck.startsWith('government warning:')) {
      return {
        field,
        status: 'fail',
        applicationValue,
        extractedValue,
        note: 'Header must be ALL CAPS "GOVERNMENT WARNING:". Found incorrect casing.',
      };
    }
    return {
      field,
      status: 'fail',
      applicationValue,
      extractedValue,
      note: 'Government warning header not found. Expected "GOVERNMENT WARNING:" at start.',
    };
  }

  // 3. Content check — verbatim comparison
  const referenceNormalized = normalizeString(GOVERNMENT_WARNING_TEXT);
  if (normalized === referenceNormalized) {
    return {
      field,
      status: 'pass',
      applicationValue,
      extractedValue,
      note: 'Government warning matches required text',
    };
  }

  // Find first divergence point
  const refWords = referenceNormalized.split(' ');
  const extWords = normalized.split(' ');

  for (let i = 0; i < Math.max(refWords.length, extWords.length); i++) {
    if (refWords[i] !== extWords[i]) {
      const position = i + 1;
      const expected = refWords[i] || '(end)';
      const found = extWords[i] || '(end)';
      return {
        field,
        status: 'fail',
        applicationValue,
        extractedValue,
        note: `Warning text differs at word ${position}: expected "${expected}", found "${found}"`,
      };
    }
  }

  return {
    field,
    status: 'pass',
    applicationValue,
    extractedValue,
    note: 'Government warning matches required text',
  };
}
