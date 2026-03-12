export type FieldName =
  | 'brandName'
  | 'classType'
  | 'alcoholContent'
  | 'netContents'
  | 'governmentWarning'
  | 'producerName'
  | 'producerAddress'
  | 'countryOfOrigin';

export type Confidence = 'high' | 'medium' | 'low';
export type FieldStatus = 'pass' | 'warning' | 'fail';

export interface ExtractedField {
  value: string | null;
  confidence: Confidence;
}

export type ExtractedFields = Record<FieldName, ExtractedField>;

export interface FieldResult {
  field: FieldName;
  status: FieldStatus;
  applicationValue: string;
  extractedValue: string | null;
  note: string;
}

export interface VerificationResult {
  aiRecommendation: FieldStatus;
  processingTimeMs: number;
  reviewRequired: boolean;
  extractedFields: ExtractedFields;
  fieldResults: FieldResult[];
  overallNotes: string[];
}

export interface ApplicationData {
  brandName: string;
  classType: string;
  alcoholContent: string;
  netContents: string;
  governmentWarning: string;
  producerName: string;
  producerAddress: string;
  countryOfOrigin: string;
}
