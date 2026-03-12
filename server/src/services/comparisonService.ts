import type { FieldName, FieldResult, FieldStatus, ExtractedFields, ApplicationData } from '../types.js';
import {
  normalizeString,
  extractNumeric,
  normalizeUnit,
  stripTrademark,
  normalizeCompanySuffix,
  normalizeStateAbbreviation,
  normalizeCountry,
} from '../utils/normalize.js';
import { fuzzyMatch } from '../utils/fuzzyMatch.js';
import { validateGovernmentWarning } from './warningValidator.js';

export function compareField(
  field: FieldName,
  applicationValue: string,
  extractedValue: string | null
): FieldResult {
  // Null/empty extraction
  if (!extractedValue || extractedValue.trim().length === 0) {
    return {
      field,
      status: 'fail',
      applicationValue,
      extractedValue,
      note: 'Field not found on label',
    };
  }

  // Delegate government warning to its own validator
  if (field === 'governmentWarning') {
    return validateGovernmentWarning(applicationValue, extractedValue);
  }

  switch (field) {
    case 'brandName':
      return compareBrandName(applicationValue, extractedValue);
    case 'classType':
      return compareClassType(applicationValue, extractedValue);
    case 'alcoholContent':
      return compareAlcoholContent(applicationValue, extractedValue);
    case 'netContents':
      return compareNetContents(applicationValue, extractedValue);
    case 'producerName':
      return compareProducerName(applicationValue, extractedValue);
    case 'producerAddress':
      return compareProducerAddress(applicationValue, extractedValue);
    case 'countryOfOrigin':
      return compareCountryOfOrigin(applicationValue, extractedValue);
    default:
      return genericCompare(field, applicationValue, extractedValue);
  }
}

function compareBrandName(appVal: string, extVal: string): FieldResult {
  const field = 'brandName' as const;
  const a = stripTrademark(normalizeString(appVal));
  const b = stripTrademark(normalizeString(extVal));

  if (a === b) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: 'Exact match' };
  }
  if (a.toLowerCase() === b.toLowerCase()) {
    return { field, status: 'warning', applicationValue: appVal, extractedValue: extVal, note: 'Case difference only' };
  }
  const result = fuzzyMatch(a.toLowerCase(), b.toLowerCase());
  if (result.match) {
    return { field, status: 'warning', applicationValue: appVal, extractedValue: extVal, note: `Minor text difference (similarity: ${(result.similarity * 100).toFixed(0)}%)` };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Brand name mismatch' };
}

function compareClassType(appVal: string, extVal: string): FieldResult {
  const field = 'classType' as const;
  const a = normalizeString(appVal).toLowerCase();
  const b = normalizeString(extVal).toLowerCase();

  if (a === b) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: 'Exact match' };
  }
  const result = fuzzyMatch(a, b);
  if (result.match) {
    return { field, status: 'warning', applicationValue: appVal, extractedValue: extVal, note: `Minor text difference (similarity: ${(result.similarity * 100).toFixed(0)}%)` };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Class/type mismatch' };
}

function compareAlcoholContent(appVal: string, extVal: string): FieldResult {
  const field = 'alcoholContent' as const;
  const appNum = extractNumeric(appVal);
  const extNum = extractNumeric(extVal);

  if (appNum === null || extNum === null) {
    return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Could not parse alcohol content value' };
  }
  if (Math.abs(appNum - extNum) <= 0.1) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: `ABV match (${extNum}%)` };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: `ABV mismatch: application ${appNum}%, label ${extNum}%` };
}

function compareNetContents(appVal: string, extVal: string): FieldResult {
  const field = 'netContents' as const;
  const a = normalizeUnit(normalizeString(appVal));
  const b = normalizeUnit(normalizeString(extVal));
  const appNum = extractNumeric(a);
  const extNum = extractNumeric(b);

  if (appNum === null || extNum === null) {
    return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Could not parse net contents value' };
  }
  if (appNum === extNum) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: `Net contents match (${extNum})` };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: `Net contents mismatch: application ${appNum}, label ${extNum}` };
}

function compareProducerName(appVal: string, extVal: string): FieldResult {
  const field = 'producerName' as const;
  const a = normalizeCompanySuffix(normalizeString(appVal)).toLowerCase();
  const b = normalizeCompanySuffix(normalizeString(extVal)).toLowerCase();

  if (a === b) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: 'Exact match' };
  }
  const result = fuzzyMatch(a, b);
  if (result.match) {
    return { field, status: 'warning', applicationValue: appVal, extractedValue: extVal, note: `Minor text difference (similarity: ${(result.similarity * 100).toFixed(0)}%)` };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Producer name mismatch' };
}

function compareProducerAddress(appVal: string, extVal: string): FieldResult {
  const field = 'producerAddress' as const;
  const a = normalizeStateAbbreviation(normalizeString(appVal)).toLowerCase();
  const b = normalizeStateAbbreviation(normalizeString(extVal)).toLowerCase();

  if (a === b) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: 'Exact match' };
  }
  // Relaxed threshold for addresses
  const result = fuzzyMatch(a, b, { maxLevenshtein: 4, minJaroWinkler: 0.90 });
  if (result.match) {
    return { field, status: 'warning', applicationValue: appVal, extractedValue: extVal, note: `Minor address difference (similarity: ${(result.similarity * 100).toFixed(0)}%)` };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Producer address mismatch' };
}

function compareCountryOfOrigin(appVal: string, extVal: string): FieldResult {
  const field = 'countryOfOrigin' as const;
  const a = normalizeCountry(appVal).toLowerCase();
  const b = normalizeCountry(extVal).toLowerCase();

  if (a === b) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: 'Exact match' };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Country of origin mismatch' };
}

function genericCompare(field: FieldName, appVal: string, extVal: string): FieldResult {
  const a = normalizeString(appVal).toLowerCase();
  const b = normalizeString(extVal).toLowerCase();

  if (a === b) {
    return { field, status: 'pass', applicationValue: appVal, extractedValue: extVal, note: 'Exact match' };
  }
  return { field, status: 'fail', applicationValue: appVal, extractedValue: extVal, note: 'Mismatch' };
}

export function compareAllFields(
  applicationData: ApplicationData,
  extractedFields: ExtractedFields
): { fieldResults: FieldResult[]; recommendation: FieldStatus; overallNotes: string[] } {
  const fields: FieldName[] = [
    'brandName', 'classType', 'alcoholContent', 'netContents',
    'governmentWarning', 'producerName', 'producerAddress', 'countryOfOrigin',
  ];

  const fieldResults = fields.map((field) =>
    compareField(field, applicationData[field], extractedFields[field]?.value)
  );

  const overallNotes: string[] = [];
  let recommendation: FieldStatus = 'pass';

  for (const result of fieldResults) {
    if (result.status === 'fail') {
      recommendation = 'fail';
      overallNotes.push(`${result.field}: ${result.note}`);
    } else if (result.status === 'warning' && recommendation !== 'fail') {
      recommendation = 'warning';
    }
  }

  return { fieldResults, recommendation, overallNotes };
}
