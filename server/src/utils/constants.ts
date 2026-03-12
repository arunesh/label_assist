export const GOVERNMENT_WARNING_TEXT =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should ' +
  'not drink alcoholic beverages during pregnancy because of the risk of ' +
  'birth defects. (2) Consumption of alcoholic beverages impairs your ' +
  'ability to drive a car or operate machinery, and may cause health problems.';

export const FIELD_NAMES = [
  'brandName',
  'classType',
  'alcoholContent',
  'netContents',
  'governmentWarning',
  'producerName',
  'producerAddress',
  'countryOfOrigin',
] as const;

export const FIELD_LABELS: Record<string, string> = {
  brandName: 'Brand Name',
  classType: 'Class/Type',
  alcoholContent: 'Alcohol Content',
  netContents: 'Net Contents',
  governmentWarning: 'Government Warning',
  producerName: 'Producer Name',
  producerAddress: 'Producer Address',
  countryOfOrigin: 'Country of Origin',
};
