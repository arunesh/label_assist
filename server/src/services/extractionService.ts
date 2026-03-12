import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, USER_PROMPT } from '../prompts/extraction.js';
import { AIExtractionError, AITimeoutError } from '../utils/errors.js';
import { FIELD_NAMES } from '../utils/constants.js';
import type { ExtractedFields } from '../types.js';

const anthropic = new Anthropic();

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '8000', 10);

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

      const response = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          temperature: 0,
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
