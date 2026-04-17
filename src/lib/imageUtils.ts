export const uploadImageFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = (
  imageUrl: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF)
};

export const validateImageMagicBytes = async (file: File): Promise<boolean> => {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const signatures of Object.values(IMAGE_MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => bytes[i] === byte)) {
        return true;
      }
    }
  }
  return false;
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Raw upload cap. Oversized files are compressed client-side before storage,
// so this is a sanity ceiling rather than a storage constraint.
export const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024;

export const validateImageFile = (file: File): { valid: boolean; reason?: string } => {
  // Reject SVGs explicitly (can contain embedded JS)
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return { valid: false, reason: 'SVG files are not supported for security reasons' };
  }

  // Check allowed MIME types
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, reason: 'Only JPEG, PNG, and WebP images are supported' };
  }

  if (file.size > MAX_IMAGE_FILE_BYTES) {
    const mb = Math.round(MAX_IMAGE_FILE_BYTES / (1024 * 1024));
    return { valid: false, reason: `Image must be less than ${mb}MB` };
  }

  return { valid: true };
};

// Target ceiling for the encoded data URL. localStorage is ~5MB total, and we
// leave headroom for the rest of the app's persisted state.
const TARGET_DATA_URL_BYTES = 2_800_000;
const MAX_COMPRESS_DIMENSION = 2048;

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageDecodeError());
    img.src = src;
  });

// Named error classes so the UI layer can show actionable messages instead of
// a generic "Upload failed" toast.
export class ImageDecodeError extends Error {
  constructor() {
    super('Image could not be decoded');
    this.name = 'ImageDecodeError';
  }
}

export class ImageOutOfMemoryError extends Error {
  constructor() {
    super('Not enough memory to process this image');
    this.name = 'ImageOutOfMemoryError';
  }
}

const drawToCanvas = (img: HTMLImageElement, width: number, height: number): HTMLCanvasElement => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageOutOfMemoryError();
    // Flatten any alpha channel onto white so JPEG conversion doesn't produce
    // black backgrounds on transparent PNGs.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  } catch (err) {
    // Canvas allocation / draw can throw on low-memory devices with large images.
    if (err instanceof ImageOutOfMemoryError) throw err;
    throw new ImageOutOfMemoryError();
  }
};

export interface CompressImageResult {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
  compressed: boolean;
}

/**
 * Produces a data URL that fits within the localStorage budget by downscaling
 * to MAX_COMPRESS_DIMENSION on the long edge and re-encoding as JPEG with
 * iteratively lower quality (and additional scale passes) until it fits.
 */
export const compressImageToDataUrl = async (file: File): Promise<CompressImageResult> => {
  const srcUrl = await uploadImageFile(file);
  const img = await loadImageElement(srcUrl);

  const maxEdge = Math.max(img.naturalWidth, img.naturalHeight);
  const initialScale = maxEdge > MAX_COMPRESS_DIMENSION ? MAX_COMPRESS_DIMENSION / maxEdge : 1;

  let width = Math.max(1, Math.round(img.naturalWidth * initialScale));
  let height = Math.max(1, Math.round(img.naturalHeight * initialScale));
  let canvas = drawToCanvas(img, width, height);

  // WebP typically compresses better; fall back to JPEG on browsers that
  // silently ignore the requested type.
  const prefersWebp =
    typeof document !== 'undefined' &&
    document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
  const mime = prefersWebp ? 'image/webp' : 'image/jpeg';

  let quality = 0.9;
  let dataUrl = canvas.toDataURL(mime, quality);

  const needsAnyCompression = initialScale < 1 || dataUrl.length > TARGET_DATA_URL_BYTES;

  while (dataUrl.length > TARGET_DATA_URL_BYTES) {
    if (quality > 0.45) {
      quality = Math.max(0.45, quality - 0.1);
      dataUrl = canvas.toDataURL(mime, quality);
      continue;
    }
    // Quality floor reached — downscale another 15% and retry.
    const nextWidth = Math.max(640, Math.round(width * 0.85));
    const nextHeight = Math.max(480, Math.round(height * 0.85));
    if (nextWidth === width && nextHeight === height) break;
    width = nextWidth;
    height = nextHeight;
    canvas = drawToCanvas(img, width, height);
    quality = 0.8;
    dataUrl = canvas.toDataURL(mime, quality);
  }

  return {
    dataUrl,
    width,
    height,
    bytes: dataUrl.length,
    compressed: needsAnyCompression,
  };
};

export const validateImageDimensions = (
  width: number,
  height: number,
): { valid: boolean; reason?: string } => {
  const MAX_DIMENSION = 2048;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      valid: false,
      reason: `Image dimensions (${width}x${height}) exceed maximum allowed size of ${MAX_DIMENSION}x${MAX_DIMENSION} pixels`,
    };
  }

  return { valid: true };
};

export const calculateOptimalCanvasSize = (
  imageWidth: number,
  imageHeight: number,
): { width: number; height: number } => {
  // Default canvas size when no image
  const DEFAULT_WIDTH = 800;
  const DEFAULT_HEIGHT = 600;

  // Maximum canvas size for performance
  const MAX_CANVAS_WIDTH = 3000;
  const MAX_CANVAS_HEIGHT = 3000;

  if (!imageWidth || !imageHeight) {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  }

  // Use image dimensions but cap at maximum
  const canvasWidth = Math.min(imageWidth, MAX_CANVAS_WIDTH);
  const canvasHeight = Math.min(imageHeight, MAX_CANVAS_HEIGHT);

  // Ensure minimum size for usability
  return {
    width: Math.max(canvasWidth, DEFAULT_WIDTH),
    height: Math.max(canvasHeight, DEFAULT_HEIGHT),
  };
};

// New utility to process image and trigger canvas updates
export const processImageForCanvas = async (
  imageUrl: string,
  updateCanvasDimensions: (width: number, height: number) => void,
  centerView?: () => void,
): Promise<{ width: number; height: number }> => {
  try {
    const imageDimensions = await getImageDimensions(imageUrl);
    const validation = validateImageDimensions(imageDimensions.width, imageDimensions.height);

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const canvasSize = calculateOptimalCanvasSize(imageDimensions.width, imageDimensions.height);

    // Update canvas dimensions which will trigger auto-centering
    updateCanvasDimensions(canvasSize.width, canvasSize.height);

    // Optional additional centering call
    if (centerView) {
      setTimeout(() => centerView(), 100); // Small delay to ensure state updates
    }

    return canvasSize;
  } catch (error) {
    console.error('Error processing image for canvas:', error);
    throw error;
  }
};

export const calculateCanvasSize = (
  aspectRatio: { width: number; height: number },
  containerWidth: number,
): { width: number; height: number } => {
  const ratio = aspectRatio.height / aspectRatio.width;
  const width = containerWidth;
  const height = width * ratio;

  return { width, height };
};

export const ASPECT_RATIO_PRESETS = [
  { name: 'Square (1:1)', width: 1, height: 1 },
  { name: 'Standard Room (3:2)', width: 30, height: 20 },
  { name: 'Wide Room (16:9)', width: 32, height: 18 },
  { name: 'Long Hall (2:1)', width: 40, height: 20 },
  { name: 'Banquet Hall (5:3)', width: 50, height: 30 },
];
