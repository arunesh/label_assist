import sharp from 'sharp';
import { ImageTooSmallError, UnsupportedFormatError } from '../utils/errors.js';

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'tiff', 'heif', 'gif', 'bmp', 'svg'];
const MAX_DIMENSION = 2048;
const MIN_DIMENSION = 200;

export interface ProcessedImage {
  processed: Buffer;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  metadata: {
    originalWidth: number;
    originalHeight: number;
    width: number;
    height: number;
    format: string;
  };
}

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.format || !SUPPORTED_FORMATS.includes(metadata.format)) {
    throw new UnsupportedFormatError(metadata.format || 'unknown');
  }

  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new ImageTooSmallError();
  }

  let pipeline = image;
  let outputWidth = width;
  let outputHeight = height;

  // Resize if too large
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    outputWidth = Math.round(width * scale);
    outputHeight = Math.round(height * scale);
    pipeline = pipeline.resize(outputWidth, outputHeight, { fit: 'inside' });
  }

  // Convert non-web formats to jpeg
  const needsConversion = ['tiff', 'heif', 'bmp', 'svg'].includes(metadata.format);
  const outputFormat = needsConversion ? 'jpeg' : metadata.format;

  if (needsConversion || metadata.format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality: 85 });
  }

  const processed = await pipeline.toBuffer();

  const mediaTypeMap: Record<string, ProcessedImage['mediaType']> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };

  return {
    processed,
    mediaType: mediaTypeMap[outputFormat as string] || 'image/jpeg',
    metadata: {
      originalWidth: width,
      originalHeight: height,
      width: outputWidth,
      height: outputHeight,
      format: metadata.format,
    },
  };
}
