import { createWorker, Worker } from 'tesseract.js';
import { parseBusinessCardOCR, ParsedCardData } from './ocrParser';

export type OcrLanguage = 'sr' | 'en';

const workerPromises: Partial<Record<OcrLanguage, Promise<Worker>>> = {};
let activeProgressCallback: ((progress: number, status: string) => void) | undefined;

/**
 * Initializes and caches the Tesseract worker for the requested language.
 * For Serbian ('sr'), loads 'srp_latn' (Serbian Latin: č, ć, đ, š, ž) with fallback to 'eng'.
 */
async function getWorker(
  lang: OcrLanguage,
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  activeProgressCallback = onProgress;

  if (!workerPromises[lang]) {
    workerPromises[lang] = (async () => {
      const tessLang = lang === 'sr' ? 'srp_latn' : 'eng';
      try {
        const worker = await createWorker(tessLang, 1, {
          logger: (m) => {
            if (m && typeof m.progress === 'number' && activeProgressCallback) {
              activeProgressCallback(Math.round(m.progress * 100), m.status || 'Processing...');
            }
          },
        });
        return worker;
      } catch (err) {
        if (tessLang !== 'eng') {
          console.warn('Falling back to English Tesseract model:', err);
          return createWorker('eng', 1, {
            logger: (m) => {
              if (m && typeof m.progress === 'number' && activeProgressCallback) {
                activeProgressCallback(Math.round(m.progress * 100), m.status || 'Processing...');
              }
            },
          });
        }
        throw err;
      }
    })();
  }
  return workerPromises[lang]!;
}

/**
 * Preprocesses image on an offscreen canvas to optimize OCR contrast and clarity.
 */
export function preprocessCardImage(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  cropRect?: { x: number; y: number; width: number; height: number }
): { dataUrl: string; canvas: HTMLCanvasElement } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const sx = cropRect ? cropRect.x : 0;
  const sy = cropRect ? cropRect.y : 0;
  const sw = cropRect
    ? cropRect.width
    : imageElement instanceof HTMLVideoElement
    ? imageElement.videoWidth
    : imageElement.width;
  const sh = cropRect
    ? cropRect.height
    : imageElement instanceof HTMLVideoElement
    ? imageElement.videoHeight
    : imageElement.height;

  canvas.width = Math.min(1600, sw);
  canvas.height = Math.round((sh / sw) * canvas.width);

  ctx.drawImage(imageElement, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const contrast = 1.15;
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < d.length; i += 4) {
      d[i] = factor * (d[i] - 128) + 128;
      d[i + 1] = factor * (d[i + 1] - 128) + 128;
      d[i + 2] = factor * (d[i + 2] - 128) + 128;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Keep original canvas render if pixel manipulation fails
  }

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    canvas,
  };
}

/**
 * Runs OCR on a business card image source (Blob, File, Data URL, or Canvas)
 */
export async function scanBusinessCardImage(
  imageSource: string | HTMLCanvasElement | Blob | File,
  onProgress?: (progress: number, status: string) => void,
  lang: OcrLanguage = 'sr'
): Promise<{ parsed: ParsedCardData; text: string; confidence: number }> {
  const worker = await getWorker(lang, onProgress);
  const result = await worker.recognize(imageSource);

  const rawText = result.data.text || '';
  const confidence = result.data.confidence || 0;

  const parsed = parseBusinessCardOCR(rawText);

  return {
    parsed,
    text: rawText,
    confidence,
  };
}
