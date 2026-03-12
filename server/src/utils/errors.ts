export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public userMessage: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ImageTooSmallError extends AppError {
  constructor() {
    super(
      'Image dimensions too small',
      400,
      'The uploaded image is too small. Please provide an image at least 200px on each side.'
    );
  }
}

export class UnsupportedFormatError extends AppError {
  constructor(format: string) {
    super(
      `Unsupported image format: ${format}`,
      400,
      `The image format "${format}" is not supported. Please upload a JPG, PNG, WebP, or TIFF image.`
    );
  }
}

export class AIExtractionError extends AppError {
  constructor(detail?: string) {
    super(
      `AI extraction failed: ${detail || 'unknown'}`,
      502,
      'The AI service was unable to extract text from the label image. Please try again or use a clearer image.'
    );
  }
}

export class AITimeoutError extends AppError {
  constructor() {
    super(
      'AI extraction timed out',
      504,
      'The AI service took too long to respond. Please try again.'
    );
  }
}
