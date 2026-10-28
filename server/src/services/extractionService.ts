import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, USER_PROMPT } from '../prompts/extraction.js';
import { AIExtractionError, AITimeoutError } from '../utils/errors.js';
import { FIELD_NAMES } from '../utils/constants.js';
import type { ExtractedFields } from '../types.js';

const anthropic = new Anthropic();

const MODEL = 'claude-opus-5-5';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '8000', 10);

// Thinking is always on for this model and counts toward max_tokens, so leave
// room for it on top of the ~500-token JSON reply.
const MAX_TOKENS = 4096;

// Structured outputs guarantee the reply is valid JSON in this exact shape.
const fieldSchema = {
  type: 'object',
  properties: {
    value: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['value', 'confidence'],
  additionalProperties: false,
};

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(FIELD_NAMES.map((f) => [f, fieldSchema])),
  required: [...FIELD_NAMES],
  additionalProperties: false,
};

export async function extractFields(
  imageBuffer: Buffer,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
): Promise<ExtractedFields> {
  const base64 = imageBuffer.toString('base64');

  let lastError: Error | null = null;

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      const response = await anthropic.beta.messages.create(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          // Low effort keeps thinking short so we stay near the 5-second target.
          output_config: {
            effort: 'low',
            format: { type: 'json_schema', schema: EXTRACTION_SCHEMA },
          },
          // If a safety classifier declines, the API retries on a recommended model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 },
                },
                { type: 'text', text: USER_PROMPT },
              ],
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (response.stop_reason === 'refusal') {
        throw new Error('AI declined to process this image');
      }
      if (response.stop_reason === 'max_tokens') {
        throw new Error('AI response was cut off');
      }

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from AI');
      }

      const parsed = JSON.parse(textBlock.text);
      return validateExtractedFields(parsed);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AITimeoutError();
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new AIExtractionError(lastError?.message);
}

function validateExtractedFields(data: unknown): ExtractedFields {
  if (!data || typeof data !== 'object') {
    throw new Error('AI response is not an object');
  }

  const result: Record<string, { value: string | null; confidence: string }> = {};

  for (const field of FIELD_NAMES) {
    const fieldData = (data as Record<string, unknown>)[field];
    if (fieldData && typeof fieldData === 'object') {
      const fd = fieldData as Record<string, unknown>;
      result[field] = {
        value: typeof fd.value === 'string' ? fd.value : null,
        confidence: ['high', 'medium', 'low'].includes(fd.confidence as string)
          ? (fd.confidence as string)
          : 'low',
      };
    } else {
      result[field] = { value: null, confidence: 'low' };
    }
  }

  return result as unknown as ExtractedFields;
}
