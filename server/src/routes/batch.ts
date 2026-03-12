import { Router } from 'express';
import multer from 'multer';
import { processImage } from '../services/imageProcessor.js';
import { extractFields } from '../services/extractionService.js';
import { compareAllFields } from '../services/comparisonService.js';
import { pMap } from '../utils/concurrency.js';
import type { ApplicationData, VerificationResult } from '../types.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post('/batch', upload.array('images', 300), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No images uploaded' });
      return;
    }

    let manifest: Record<string, ApplicationData>;
    try {
      manifest =
        typeof req.body.manifest === 'string'
          ? JSON.parse(req.body.manifest)
          : req.body.manifest;
    } catch {
      res.status(400).json({ error: 'Invalid manifest JSON' });
      return;
    }

    const results = await pMap(
      files,
      async (file) => {
        const filename = file.originalname;
        const appData = manifest[filename];

        if (!appData) {
          return {
            filename,
            error: 'No matching application data in manifest',
            result: null,
          };
        }

        try {
          const startTime = Date.now();
          const { processed, mediaType } = await processImage(file.buffer);
          const extractedFields = await extractFields(processed, mediaType);
          const { fieldResults, recommendation, overallNotes } = compareAllFields(
            appData,
            extractedFields
          );

          const result: VerificationResult = {
            aiRecommendation: recommendation,
            processingTimeMs: Date.now() - startTime,
            reviewRequired: true,
            extractedFields,
            fieldResults,
            overallNotes,
          };

          return { filename, error: null, result };
        } catch (err) {
          return {
            filename,
            error: err instanceof Error ? err.message : 'Unknown error',
            result: null,
          };
        }
      },
      5 // concurrency limit
    );

    const passed = results.filter((r) => r.result?.aiRecommendation === 'pass').length;
    const failed = results.filter(
      (r) => r.result?.aiRecommendation === 'fail' || r.error
    ).length;
    const warnings = results.filter((r) => r.result?.aiRecommendation === 'warning').length;

    res.json({
      totalLabels: files.length,
      passed,
      failed,
      warnings,
      results,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
