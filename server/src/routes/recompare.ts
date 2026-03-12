import { Router } from 'express';
import { compareField } from '../services/comparisonService.js';
import type { FieldName } from '../types.js';
import { FIELD_NAMES } from '../utils/constants.js';

const router = Router();

router.post('/recompare', (req, res) => {
  const { field, applicationValue, correctedExtraction } = req.body;

  if (!field || !applicationValue) {
    res.status(400).json({ error: 'Missing field or applicationValue' });
    return;
  }

  if (!FIELD_NAMES.includes(field)) {
    res.status(400).json({ error: `Invalid field name: ${field}` });
    return;
  }

  const result = compareField(field as FieldName, applicationValue, correctedExtraction);
  result.note += ' (after agent correction)';

  res.json(result);
});

export default router;
