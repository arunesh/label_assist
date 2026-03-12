/**
 * Generate synthetic alcohol label images for E2E testing.
 *
 * Uses Sharp to render SVG → PNG. Each label simulates a real bottle label
 * with text fields that the AI extraction service would read.
 *
 * Run:  npx tsx test/fixtures/generate-labels.ts
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'images');

interface LabelData {
  filename: string;
  description: string;
  brandName: string;
  classType: string;
  alcoholContent: string;
  netContents: string;
  governmentWarning: string;
  producerName: string;
  producerAddress: string;
  countryOfOrigin: string;
  // Visual tweaks
  warningCasing?: 'correct' | 'titlecase' | 'missing';
  bgColor?: string;
  accentColor?: string;
  labelStyle?: 'classic' | 'modern' | 'craft' | 'premium';
}

const GOV_WARNING_CORRECT =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should ' +
  'not drink alcoholic beverages during pregnancy because of the risk of ' +
  'birth defects. (2) Consumption of alcoholic beverages impairs your ' +
  'ability to drive a car or operate machinery, and may cause health problems.';

const GOV_WARNING_TITLECASE =
  'Government Warning: (1) According to the Surgeon General, women should ' +
  'not drink alcoholic beverages during pregnancy because of the risk of ' +
  'birth defects. (2) Consumption of alcoholic beverages impairs your ' +
  'ability to drive a car or operate machinery, and may cause health problems.';

const GOV_WARNING_WRONG_WORD =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, people should ' +
  'not drink alcoholic beverages during pregnancy because of the risk of ' +
  'birth defects. (2) Consumption of alcoholic beverages impairs your ' +
  'ability to drive a car or operate machinery, and may cause health problems.';

// ── Test label definitions ──────────────────────────────────────────────────

const labels: LabelData[] = [
  {
    filename: '01_perfect_bourbon.png',
    description: 'Perfect label — all fields match exactly',
    brandName: 'OLD TOM DISTILLERY',
    classType: 'Kentucky Straight Bourbon Whiskey',
    alcoholContent: '45% Alc./Vol. (90 Proof)',
    netContents: '750 mL',
    governmentWarning: GOV_WARNING_CORRECT,
    producerName: 'Old Tom Distillery Co.',
    producerAddress: 'Louisville, KY 40202',
    countryOfOrigin: 'Product of USA',
    labelStyle: 'classic',
    bgColor: '#1a0e08',
    accentColor: '#c9953c',
  },
  {
    filename: '02_case_diff_wine.png',
    description: 'Case differences in brand name — should trigger warnings',
    brandName: "Stone's Throw Vineyards",
    classType: 'Pinot Noir',
    alcoholContent: '13.5% Alc./Vol.',
    netContents: '750 mL',
    governmentWarning: GOV_WARNING_CORRECT,
    producerName: 'Stones Throw Winery LLC',
    producerAddress: 'Sonoma, CA 95476',
    countryOfOrigin: 'United States',
    labelStyle: 'modern',
    bgColor: '#2d1127',
    accentColor: '#a84f7d',
  },
  {
    filename: '03_wrong_abv_beer.png',
    description: 'ABV mismatch — label says 5.5% but correct is 5.0%',
    brandName: 'SUMMIT PEAK IPA',
    classType: 'India Pale Ale',
    alcoholContent: '5.5% Alc./Vol.',
    netContents: '12 Fl. Oz.',
    governmentWarning: GOV_WARNING_CORRECT,
    producerName: 'Summit Peak Brewing Company',
    producerAddress: 'Portland, OR 97201',
    countryOfOrigin: 'USA',
    labelStyle: 'craft',
    bgColor: '#0c2e1f',
    accentColor: '#4ade80',
  },
  {
    filename: '04_titlecase_warning.png',
    description: 'Government warning header in title case (should fail format check)',
    brandName: 'COASTAL RESERVE',
    classType: 'Chardonnay',
    alcoholContent: '14.1% Alc./Vol.',
    netContents: '750 mL',
    governmentWarning: GOV_WARNING_TITLECASE,
    producerName: 'Coastal Reserve Winery Inc.',
    producerAddress: 'Napa Valley, CA 94558',
    countryOfOrigin: 'United States of America',
    warningCasing: 'titlecase',
    labelStyle: 'premium',
    bgColor: '#f5f0e8',
    accentColor: '#1a3a4a',
  },
  {
    filename: '05_missing_warning.png',
    description: 'Government warning completely absent from label',
    brandName: 'HIGHLAND MIST',
    classType: 'Single Malt Scotch Whisky',
    alcoholContent: '43% Alc./Vol.',
    netContents: '700 mL',
    governmentWarning: '',
    producerName: 'Highland Mist Distillers Ltd.',
    producerAddress: 'Speyside, Scotland',
    countryOfOrigin: 'Product of Scotland',
    warningCasing: 'missing',
    labelStyle: 'premium',
    bgColor: '#1c1c28',
    accentColor: '#8b7355',
  },
  {
    filename: '06_wrong_warning_word.png',
    description: 'Government warning has "people" instead of "women" — word mismatch',
    brandName: 'RIVER BEND RYE',
    classType: 'Straight Rye Whiskey',
    alcoholContent: '50% Alc./Vol. (100 Proof)',
    netContents: '750 mL',
    governmentWarning: GOV_WARNING_WRONG_WORD,
    producerName: 'River Bend Distilling Co.',
    producerAddress: 'Nashville, TN 37203',
    countryOfOrigin: 'USA',
    labelStyle: 'classic',
    bgColor: '#2a1810',
    accentColor: '#d4a762',
  },
  {
    filename: '07_country_mismatch.png',
    description: 'Country says Mexico but application says USA',
    brandName: 'SOL DORADO',
    classType: 'Tequila Reposado',
    alcoholContent: '40% Alc./Vol. (80 Proof)',
    netContents: '750 mL',
    governmentWarning: GOV_WARNING_CORRECT,
    producerName: 'Sol Dorado Spirits',
    producerAddress: 'Jalisco, Mexico',
    countryOfOrigin: 'Product of Mexico',
    labelStyle: 'modern',
    bgColor: '#f7f2e4',
    accentColor: '#b8860b',
  },
  {
    filename: '08_multiple_issues.png',
    description: 'Multiple problems — wrong ABV, title-case warning, trademark in brand',
    brandName: 'VELVET CROWN\u2122',
    classType: 'Blended Whiskey',
    alcoholContent: '38% Alc./Vol.',
    netContents: '1 L',
    governmentWarning: GOV_WARNING_TITLECASE,
    producerName: 'Velvet Crown Spirits Corp.',
    producerAddress: 'Chicago, IL 60601',
    countryOfOrigin: 'USA',
    warningCasing: 'titlecase',
    labelStyle: 'craft',
    bgColor: '#1a1025',
    accentColor: '#9f7aea',
  },
  {
    filename: '09_fuzzy_match_vodka.png',
    description: 'Minor OCR-like typo in producer name — fuzzy match scenario',
    brandName: 'CRYSTAL BROOK',
    classType: 'Vodka',
    alcoholContent: '40% Alc./Vol. (80 Proof)',
    netContents: '1.75 L',
    governmentWarning: GOV_WARNING_CORRECT,
    producerName: 'Crysta1 Brook Distillers',
    producerAddress: 'Austin, TX 78701',
    countryOfOrigin: 'USA',
    labelStyle: 'modern',
    bgColor: '#e8eef4',
    accentColor: '#2563eb',
  },
  {
    filename: '10_net_contents_unit.png',
    description: 'Net contents use FL OZ vs mL — unit normalization test',
    brandName: 'DARK HARBOR',
    classType: 'Stout',
    alcoholContent: '6.2% Alc./Vol.',
    netContents: '12 FL OZ',
    governmentWarning: GOV_WARNING_CORRECT,
    producerName: 'Dark Harbor Brewing',
    producerAddress: 'San Diego, CA 92101',
    countryOfOrigin: 'USA',
    labelStyle: 'craft',
    bgColor: '#0f0f0f',
    accentColor: '#ef4444',
  },
];

// ── SVG template rendering ──────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function renderLabel(data: LabelData): string {
  const W = 600;
  const H = 900;
  const isLight = data.bgColor && data.bgColor.startsWith('#f');
  const textColor = isLight ? '#1a1a1a' : '#f0ead6';
  const subtextColor = isLight ? '#555555' : '#b0a890';
  const warningBg = isLight ? '#fff8e0' : '#1a1a0f';
  const warningBorder = isLight ? '#e0d8b0' : '#3a3520';
  const dividerColor = isLight ? '#d0c8b0' : '#3a3020';

  const accentColor = data.accentColor || '#c9953c';

  // Warning text — wrap to lines
  const warningLines = data.warningCasing === 'missing'
    ? []
    : wrapText(data.governmentWarning, 55);

  const warningBlockHeight = warningLines.length > 0
    ? 30 + warningLines.length * 16 + 20
    : 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Label background texture -->
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="${data.bgColor}" surfaceScale="1.5" result="lit">
        <feDistantLight azimuth="45" elevation="55"/>
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="lit" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
    </filter>
    <linearGradient id="labelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${data.bgColor}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${data.bgColor}" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${accentColor}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#labelGrad)" rx="16"/>

  <!-- Decorative border -->
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="${accentColor}" stroke-width="1.5" rx="8" opacity="0.4"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${accentColor}" stroke-width="0.5" rx="6" opacity="0.25"/>

  <!-- Top accent line -->
  <rect x="60" y="60" width="${W - 120}" height="2" fill="url(#accentGrad)"/>

  <!-- Brand Name (hero text) -->
  <text x="${W / 2}" y="120" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="38" font-weight="bold" fill="${accentColor}"
    letter-spacing="3">${escapeXml(data.brandName)}</text>

  <!-- Decorative divider -->
  <line x1="120" y1="145" x2="${W - 120}" y2="145" stroke="${accentColor}" stroke-width="0.8" opacity="0.5"/>

  <!-- Class/Type -->
  <text x="${W / 2}" y="180" text-anchor="middle"
    font-family="Georgia, serif"
    font-size="20" fill="${textColor}" font-style="italic"
    letter-spacing="1">${escapeXml(data.classType)}</text>

  <!-- Accent divider -->
  <rect x="180" y="200" width="${W - 360}" height="1" fill="url(#accentGrad)" opacity="0.6"/>

  <!-- Central medallion area -->
  <circle cx="${W / 2}" cy="300" r="80" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.3"/>
  <circle cx="${W / 2}" cy="300" r="70" fill="none" stroke="${accentColor}" stroke-width="0.5" opacity="0.2"/>

  <!-- Alcohol Content (in medallion) -->
  <text x="${W / 2}" y="290" text-anchor="middle"
    font-family="Georgia, serif"
    font-size="22" font-weight="bold" fill="${textColor}">${escapeXml(data.alcoholContent)}</text>

  <!-- Net Contents -->
  <text x="${W / 2}" y="320" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif"
    font-size="16" fill="${subtextColor}">${escapeXml(data.netContents)}</text>

  <!-- Divider -->
  <rect x="60" y="410" width="${W - 120}" height="1" fill="${dividerColor}"/>

  <!-- Producer Name -->
  <text x="${W / 2}" y="445" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif"
    font-size="14" fill="${subtextColor}" letter-spacing="1.5">${escapeXml(data.producerName.toUpperCase())}</text>

  <!-- Producer Address -->
  <text x="${W / 2}" y="468" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif"
    font-size="12" fill="${subtextColor}">${escapeXml(data.producerAddress)}</text>

  <!-- Country of Origin -->
  <text x="${W / 2}" y="492" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif"
    font-size="12" fill="${subtextColor}" letter-spacing="1">${escapeXml(data.countryOfOrigin)}</text>

  <!-- Divider -->
  <rect x="60" y="515" width="${W - 120}" height="1" fill="${dividerColor}"/>

  <!-- Government Warning block -->
  ${warningLines.length > 0 ? `
  <rect x="40" y="530" width="${W - 80}" height="${warningBlockHeight}" fill="${warningBg}" stroke="${warningBorder}" stroke-width="1" rx="4"/>
  ${warningLines.map((line, i) => `
  <text x="55" y="${560 + i * 16}"
    font-family="Helvetica, Arial, sans-serif"
    font-size="9.5" fill="${isLight ? '#333' : '#c0b898'}">${escapeXml(line)}</text>`).join('')}
  ` : `
  <!-- Warning intentionally omitted for this test label -->
  `}

  <!-- Bottom decorative elements -->
  <rect x="60" y="${H - 70}" width="${W - 120}" height="2" fill="url(#accentGrad)"/>

  <!-- Tiny barcode simulation -->
  ${Array.from({ length: 30 }, (_, i) =>
    `<rect x="${W / 2 - 60 + i * 4}" y="${H - 55}" width="${i % 3 === 0 ? 3 : 2}" height="25" fill="${subtextColor}" opacity="0.4"/>`
  ).join('\n  ')}

  <!-- Bottom accent -->
  <rect x="22" y="${H - 22}" width="${W - 44}" height="1" fill="${accentColor}" opacity="0.15"/>
</svg>`;

  return svg;
}

// ── Generate all images ─────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating ${labels.length} test label images...\n`);

  for (const label of labels) {
    const svg = renderLabel(label);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const outPath = join(OUT_DIR, label.filename);
    writeFileSync(outPath, buffer);
    console.log(`  ${label.filename}  — ${label.description}`);
  }

  // Also generate the manifest JSON for batch testing
  const manifest: Record<string, Record<string, string>> = {};
  const applicationData: Record<string, Record<string, string>> = {};

  for (const label of labels) {
    const appData = {
      brandName: label.brandName.replace(/[™®℠]/g, ''),
      classType: label.classType,
      alcoholContent: label.filename === '03_wrong_abv_beer.png'
        ? '5.0% Alc./Vol.'  // Intentional mismatch: app says 5.0, label says 5.5
        : label.alcoholContent,
      netContents: label.netContents,
      governmentWarning: GOV_WARNING_CORRECT, // app always has correct warning
      producerName: label.producerName,
      producerAddress: label.producerAddress,
      countryOfOrigin: label.filename === '07_country_mismatch.png'
        ? 'USA'  // Intentional mismatch: app says USA, label says Mexico
        : label.countryOfOrigin,
    };

    manifest[label.filename] = appData;
    applicationData[label.filename] = {
      ...appData,
      _description: label.description,
    };
  }

  const manifestPath = join(OUT_DIR, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  manifest.json — batch test manifest with ${labels.length} entries`);

  // Write a companion file documenting expected results
  const expectedResults = labels.map((l) => ({
    filename: l.filename,
    description: l.description,
    expectedIssues: getExpectedIssues(l),
  }));

  const expectedPath = join(OUT_DIR, 'expected-results.json');
  writeFileSync(expectedPath, JSON.stringify(expectedResults, null, 2));
  console.log(`  expected-results.json — documenting expected verification outcomes`);

  console.log(`\nDone! ${labels.length} images + manifest + expected results → ${OUT_DIR}/`);
}

function getExpectedIssues(label: LabelData): string[] {
  const issues: string[] = [];

  if (label.filename === '01_perfect_bourbon.png') {
    issues.push('NONE — all fields should pass');
  }
  if (label.filename === '02_case_diff_wine.png') {
    issues.push('brandName: case difference (warning)');
  }
  if (label.filename === '03_wrong_abv_beer.png') {
    issues.push('alcoholContent: 5.5% on label vs 5.0% in app (fail)');
  }
  if (label.warningCasing === 'titlecase') {
    issues.push('governmentWarning: title-case header instead of ALL CAPS (fail)');
  }
  if (label.warningCasing === 'missing') {
    issues.push('governmentWarning: completely absent from label (fail)');
  }
  if (label.filename === '06_wrong_warning_word.png') {
    issues.push('governmentWarning: "people" instead of "women" (fail)');
  }
  if (label.filename === '07_country_mismatch.png') {
    issues.push('countryOfOrigin: Mexico on label vs USA in app (fail)');
  }
  if (label.filename === '08_multiple_issues.png') {
    issues.push('brandName: contains TM symbol (should strip)');
    issues.push('governmentWarning: title-case header (fail)');
  }
  if (label.filename === '09_fuzzy_match_vodka.png') {
    issues.push('producerName: "Crysta1" with numeral 1 — fuzzy match test');
  }
  if (label.filename === '10_net_contents_unit.png') {
    issues.push('netContents: "FL OZ" vs "fl oz" unit normalization');
  }

  return issues.length ? issues : ['No specific issues documented'];
}

main().catch(console.error);
