import { createWorker } from 'tesseract.js';

// Type definition for the Tesseract worker options
interface TesseractWorkerOptions {
  workerPath?: string;
  langPath?: string;
  corePath?: string;
}

export async function initTesseract() {
  // Initialize the worker with explicit CDN paths
  const worker = await createWorker('eng');
  
  // Set worker properties 
  (worker as any).workerOptions = {
    workerPath: 'https://unpkg.com/tesseract.js@v5.0.5/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://unpkg.com/tesseract.js-core@v4.0.4/tesseract-core.wasm.js',
  };
  
  return worker;
} 