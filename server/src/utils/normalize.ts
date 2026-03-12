const STATE_ABBREVIATIONS: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

const COUNTRY_VARIANTS: Record<string, string> = {
  us: 'United States',
  usa: 'United States',
  'united states of america': 'United States',
  'united states': 'United States',
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  'united kingdom': 'United Kingdom',
};

const COMPANY_SUFFIXES = /\b(inc\.?|incorporated|llc|l\.l\.c\.?|ltd\.?|limited|co\.?|company|corp\.?|corporation)\s*$/i;

export function normalizeString(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');
}

export function extractNumeric(str: string): number | null {
  const match = str.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

export function normalizeUnit(str: string): string {
  return str
    .replace(/\bm[Ll]\b/gi, 'ml')
    .replace(/\b[Ll]\b/g, 'l')
    .replace(/\b[Oo][Zz]\b/g, 'oz')
    .replace(/\b[Ff][Ll]\.?\s*[Oo][Zz]\.?/g, 'fl oz');
}

export function stripTrademark(str: string): string {
  return str.replace(/[™®℠]/g, '').trim();
}

export function normalizeCompanySuffix(str: string): string {
  return str.replace(COMPANY_SUFFIXES, '').trim();
}

export function normalizeStateAbbreviation(str: string): string {
  return str.replace(/\b([A-Z]{2})\b/g, (match) => {
    return STATE_ABBREVIATIONS[match] || match;
  });
}

export function normalizeCountry(str: string): string {
  const lower = str.trim().toLowerCase();
  return COUNTRY_VARIANTS[lower] || str.trim();
}
