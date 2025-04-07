import * as Tesseract from 'tesseract.js';
import path from 'path';

/**
 * Initializes the Tesseract OCR worker with optimized configuration for prescription scanning
 * @returns Configured Tesseract worker ready for OCR processing
 */
export async function initTesseract(): Promise<Tesseract.Worker> {
  try {
    console.log('Initializing Tesseract OCR worker...');
    
    // Configure worker options based on environment
    const workerPath = typeof window === 'undefined'
      ? path.join(process.cwd(), 'node_modules', 'tesseract.js', 'dist', 'worker.min.js')
      : undefined;

    // Create worker with basic configuration
    const worker = await Tesseract.createWorker({
      workerPath,
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      gzip: false,
      workerBlobURL: typeof window !== 'undefined',
      logger: (m: { status: string; progress: number }) => 
        console.log(`OCR Status: ${m.status} (${(m.progress * 100).toFixed(1)}%)`),
      errorHandler: (e: Error) => console.error('OCR Error:', e),
      corePath: undefined,
      cachePath: undefined,
      dataPath: undefined,
      cacheMethod: undefined,
      workerResolved: true
    });

    // Set default parameters for better OCR results with prescription documents
    console.log('Setting OCR parameters...');
    await worker.setParameters({
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?@#$%^&*()-_+=[]{}|\\/<>\'"`~ ',
    });
    
    console.log('Tesseract worker ready');
    return worker;
  } catch (error) {
    console.error('Error initializing Tesseract worker:', error);
    throw error; // Re-throw to handle in the calling function
  }
} 