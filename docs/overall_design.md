# LabelAssist Implementation Plan

## Context

TTB (Alcohol and Tobacco Tax and Trade Bureau) agents manually verify ~150,000 alcohol label applications/year. This app uses AI vision (Claude) to extract label text from images, compare it against application data, and present field-by-field results for agent review. Agents make the final approve/reject decision — AI is advisory only. The critical constraint is <5 second response time.

No code exists yet — only `design.md` and the original `.docx` spec.

---

## Phase 0: Project Scaffolding

Create the monorepo structure with npm workspaces.

### Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Root workspace config (`["client", "server"]`), scripts: `dev`, `build`, `test` |
| `.gitignore` | `node_modules`, `dist`, `.env`, `*.log` |
| `.env.example` | `ANTHROPIC_API_KEY`, `PORT=3001`, `MAX_FILE_SIZE_MB=10`, `AI_TIMEOUT_MS=8000` |
| **Server** | |
| `server/package.json` | Deps: `express`, `cors`, `multer`, `sharp`, `@anthropic-ai/sdk`, `dotenv`, `fastest-levenshtein`. DevDeps: `typescript`, `tsx`, `vitest`, `@types/*` |
| `server/tsconfig.json` | `target: ES2022`, `module: NodeNext`, `strict: true` |
| `server/src/index.ts` | Express app: JSON parser, CORS, multer, mount routes, error handler. Port 3001 |
| **Client** | |
| `client/package.json` | Deps: `react`, `react-dom`. DevDeps: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite` |
| `client/vite.config.ts` | React + Tailwind plugins, proxy `/api` to `localhost:3001` |
| `client/index.html` | Vite entry point |
| `client/src/App.jsx` | Placeholder with "LabelAssist" header |
| `client/src/index.css` | Tailwind directives, base `font-size: 16px` |

**Verify**: `npm run dev` starts both. `GET /api/health` returns `{ status: "ok" }`. Client loads at `localhost:5173`.

---

## Phase 1: Verification Engine (Backend — No Routes Yet)

Pure library code with unit tests. This is the algorithmic core.

### 1A: Types & Constants

**`server/src/types.ts`**
- `FieldName` = `'brandName' | 'classType' | 'alcoholContent' | 'netContents' | 'governmentWarning' | 'producerName' | 'producerAddress' | 'countryOfOrigin'`
- `Confidence` = `'high' | 'medium' | 'low'`
- `FieldStatus` = `'pass' | 'warning' | 'fail'`
- `ExtractedField { value: string | null; confidence: Confidence }`
- `FieldResult { field, status, applicationValue, extractedValue, note }`
- `VerificationResult { aiRecommendation, processingTimeMs, reviewRequired, extractedFields, fieldResults, overallNotes }`

**`server/src/utils/constants.ts`**
- `GOVERNMENT_WARNING_TEXT` — canonical 27 CFR § 16.21 text

### 1B: String Utilities

**`server/src/utils/normalize.ts`**
- `normalizeString()` — trim, collapse whitespace, normalize unicode quotes/dashes
- `extractNumeric()` — parse first decimal from string (for ABV, net contents)
- `normalizeUnit()` — `ml`/`mL`/`ML` → `ml`
- `stripTrademark()` — remove ™, ®, ℠
- `normalizeCompanySuffix()` — strip/normalize `Co.`, `Inc.`, `LLC`, `Ltd.`
- `normalizeStateAbbreviation()` — `KY` → `Kentucky` (static map)
- `normalizeCountry()` — `US`/`USA`/`United States of America` → `United States`

**`server/src/utils/fuzzyMatch.ts`**
- `levenshteinDistance()` — via `fastest-levenshtein`
- `jaroWinklerSimilarity()` — implement (~60 lines)
- `fuzzyMatch(a, b, opts)` — returns `{ match, similarity }`; defaults: `maxLevenshtein=2`, `minJaroWinkler=0.95`

### 1C: Comparison Service

**`server/src/services/comparisonService.ts`**

`compareField(field, applicationValue, extractedValue)` — field-specific logic per design.md §5.1:

| Field | Strategy |
|-------|----------|
| brandName | stripTrademark → exact → case-insensitive → fuzzy. Case-only diff = `warning` |
| classType | case-insensitive exact, normalize abbreviations |
| alcoholContent | extractNumeric both, ±0.1 tolerance |
| netContents | extractNumeric + normalizeUnit, exact numeric match |
| governmentWarning | delegate to warningValidator |
| producerName | normalizeCompanySuffix → case-insensitive fuzzy |
| producerAddress | normalizeStateAbbreviation → fuzzy (relaxed threshold) |
| countryOfOrigin | normalizeCountry → case-insensitive exact |

`compareAllFields(applicationData, extractedFields)` → `{ fieldResults, recommendation }`
- Recommendation: any fail → `fail`; any warning → `warning`; all pass → `pass`

### 1D: Government Warning Validator

**`server/src/services/warningValidator.ts`**

`validateGovernmentWarning(applicationValue, extractedValue)` — 3 sequential checks:
1. **Presence**: null/empty → `fail` ("Government warning not found on label")
2. **Format**: must start with `GOVERNMENT WARNING:` (ALL CAPS header) → `fail` if wrong casing
3. **Content**: normalize whitespace, exact string comparison of body → `fail` with first divergence point

### 1E: Tests

| Test File | Coverage |
|-----------|----------|
| `test/utils/normalize.test.ts` | Unicode quotes, trademarks, state abbrevs, country variants, numeric extraction |
| `test/utils/fuzzyMatch.test.ts` | Exact match, case differences, known mismatches, Jaro-Winkler thresholds |
| `test/services/comparison.test.ts` | All field types: exact match, case diff, ABV numeric, net contents units, null extraction, suffix normalization, `compareAllFields` recommendation logic |
| `test/services/warning.test.ts` | Exact pass, missing (fail), wrong casing header (fail), word change (fail), extra whitespace (pass) |

**Verify**: `cd server && npm test` — all pass.

---

## Phase 2: Image Processing + AI Extraction + Routes

### 2A: Image Processor

**`server/src/services/imageProcessor.ts`**
- Load with `sharp`, get metadata
- Quality check: width/height < 200 → throw `ImageTooSmallError`
- Format: convert heic/tiff/bmp → jpeg
- Resize: max dimension > 2048 → proportional resize
- Return `{ processed: Buffer, mediaType: string, metadata }`

**`server/src/utils/errors.ts`**
- `ImageTooSmallError` (400), `UnsupportedFormatError` (400), `AIExtractionError` (502), `AITimeoutError` (504)

### 2B: AI Extraction Service

**`server/src/prompts/extraction.ts`**
- System prompt: TTB analyst persona from design.md §3.2
- User prompt: structured JSON schema for output, confidence level instructions

**`server/src/services/extractionService.ts`**
- `extractFields(imageBuffer, mediaType)` → `ExtractedFields`
- Base64 encode image, call `anthropic.messages.create()` with `claude-sonnet-4-20250514`, `max_tokens: 1024`, `temperature: 0`
- Parse response as JSON, validate 8 expected fields
- Retry once on parse failure, throw `AIExtractionError` on second failure
- `AbortController` timeout at `AI_TIMEOUT_MS` (default 8000ms) → `AITimeoutError`

### 2C: API Routes

**`server/src/routes/verify.ts`** — `POST /api/verify`
1. Validate: image file exists, application JSON present
2. `imageProcessor.processImage()` → `extractionService.extractFields()` → `comparisonService.compareAllFields()`
3. Return `VerificationResult` with `processingTimeMs`

**`server/src/routes/recompare.ts`** — `POST /api/recompare`
1. Accept `{ field, applicationValue, correctedExtraction }`
2. Call `comparisonService.compareField()`
3. Return single `FieldResult`

**`server/src/routes/batch.ts`** — `POST /api/batch`
1. Accept multiple images via `multer.array('images', 300)` + manifest JSON
2. Process with concurrency limiter (5 parallel) — simple `pMap` utility in `server/src/utils/concurrency.ts`
3. Individual failures don't abort batch — wrap each in try/catch
4. Return `{ totalLabels, passed, failed, warnings, results }`

**`server/src/routes/health.ts`** — `GET /api/health` → `{ status: "ok", timestamp }`

### 2D: Error Handler Middleware

**`server/src/middleware/errorHandler.ts`**
- Map custom errors to user-friendly messages per design.md §6
- Never expose stack traces

### 2E: Integration Tests

**`test/integration/verify.test.ts`**
- Mock `@anthropic-ai/sdk` with known JSON response
- Full pipeline: image → extraction → comparison → correct response shape
- Error cases: missing image, image too small, AI timeout

**Verify**: `curl -X POST localhost:3001/api/verify -F "image=@test.jpg" -F 'application={...}'` returns valid result.

---

## Phase 3: Frontend — Single Label Verification

### 3A: Utilities & Hooks

| File | Purpose |
|------|---------|
| `client/src/utils/constants.js` | `FIELD_LABELS` map, `GOVERNMENT_WARNING_TEXT`, `API_BASE` |
| `client/src/utils/api.js` | `verifyLabel(imageFile, appData)`, `recompareField(field, appVal, corrected)` |
| `client/src/hooks/useVerify.js` | State: `{ result, loading, error }`, `verify()` async |
| `client/src/hooks/useReviewSession.js` | Manages overrides, corrections, justifications, agent decision |

### 3B: Input Components

| Component | Key Details |
|-----------|-------------|
| `ImageUploader.jsx` | Drag-and-drop + click-to-browse, thumbnail preview, file type validation, 44px min height |
| `ApplicationForm.jsx` | 8 labeled inputs (textarea for gov warning), 16px font, "Verify Label" button disabled until image + brandName filled |

### 3C: Results & Review Components

| Component | Key Details |
|-----------|-------------|
| `StatusBadge.jsx` | Color + icon + text (green ✓ Match / yellow ⚠ Warning / red ✗ Mismatch) |
| `EditableExtraction.jsx` | Editable input for extracted text, "edited" badge, triggers recompare on blur |
| `OverrideControls.jsx` | Expandable: status dropdown + justification textarea (required) |
| `FieldReviewRow.jsx` | Composes StatusBadge + EditableExtraction + OverrideControls. Shows confidence |
| `ResultsPanel.jsx` | Header with AI recommendation + processing time, maps FieldReviewRows, agent notes |
| `AgentDecisionBar.jsx` | 3 large buttons: Approve (green) / Reject (red) / Return (amber), 44px height, disabled after decision |

### 3D: Orchestrator

**`client/src/components/SingleVerify.jsx`**
- State machine: `idle` → `inputting` → `verifying` → `reviewing` → `decided`
- Shows image alongside results during review phase
- "Verify Another Label" resets state after decision

**`client/src/App.jsx`** — Single/Batch tab toggle, routes to `SingleVerify` (default) or `BatchUpload`

**Verify**: Manual E2E test — upload image, fill form, verify, edit extraction, override field, approve.

---

## Phase 4: Frontend — Batch Processing

| Component | Key Details |
|-----------|-------------|
| `BatchUpload.jsx` | Multi-image drop zone + manifest file, progress bar, running pass/fail/warning counts |
| `BatchResultsTable.jsx` | Sortable table (filename, status, issues), filter dropdown (All/Pass/Fail/Warning), click to expand |
| `client/src/utils/exportSession.js` | `exportToCSV(results)`, `exportToJSON(session)` — browser download |

**Verify**: Upload 5 test images with manifest, see progress, see results, export CSV.

---

## Phase 5: Polish & Deployment Prep

- `ErrorBoundary.jsx` — React error boundary with friendly fallback
- `ErrorMessage.jsx` — Reusable error display with retry button
- Loading states: skeleton/spinner during verification, disabled buttons during API calls
- Image preview in review phase (max 400px wide)
- `server/Procfile` or `Dockerfile` for Railway/Render
- `vercel.json` for client deployment
- `client/.env.production` — `VITE_API_URL` for deployed backend
- Rate limiting via `express-rate-limit`
- `README.md` — setup, env vars, deployment

---

## Essential Tests Summary

| Test | Type | What It Covers |
|------|------|----------------|
| `normalize.test.ts` | Unit | All string normalization functions |
| `fuzzyMatch.test.ts` | Unit | Levenshtein, Jaro-Winkler, threshold logic |
| `comparison.test.ts` | Unit | All 8 field types, tiered matching, overall recommendation |
| `warning.test.ts` | Unit | Presence/format/content checks for gov warning |
| `imageProcessor.test.ts` | Unit | Resize, format conversion, quality rejection |
| `verify.test.ts` | Integration | Full pipeline with mocked Claude API |
| `batch.test.ts` | Integration | Concurrent processing, partial failure handling |
| `recompare.test.ts` | Integration | Re-comparison after agent correction |

---

## Key Dependencies

**Server**: `express`, `cors`, `multer`, `sharp`, `@anthropic-ai/sdk`, `dotenv`, `fastest-levenshtein`, `express-rate-limit`
**Client**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`
**Testing**: `vitest`
**Dev tooling**: `typescript`, `tsx`, `concurrently`
