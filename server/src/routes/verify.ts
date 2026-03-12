import { Router } from 'express';
import { processImage } from '../services/imageProcessor.js';
import { extractFields } from '../services/extractionService.js';
import { compareAllFields } from '../services/comparisonService.js';
import type { ApplicationData, VerificationResult } from '../types.js';

const router = Router();

router.post('/verify', async (req, res, next) => {
  try {
    const startTime = Date.now();

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }

    let applicationData: ApplicationData;
    try {
      applicationData =
        typeof req.body.application === 'string'
          ? JSON.parse(req.body.application)
          : req.body.application;
    } catch {
      res.status(400).json({ error: 'Invalid application data JSON' });
      return;
    }

    if (!applicationData?.brandName) {
      res.status(400).json({ error: 'Application data must include at least brandName' });
      return;
    }

    // Process image
    const { processed, mediaType } = await processImage(file.buffer);

    // Extract fields via AI
    const extractedFields = await extractFields(processed, mediaType);

    // Compare fields
    const { fieldResults, recommendation, overallNotes } = compareAllFields(
      applicationData,
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

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
