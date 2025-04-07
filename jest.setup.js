const { TextDecoder, TextEncoder } = require('util');

// Add TextEncoder and TextDecoder to global scope
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch globally
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
);

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  append(key, value) {
    this.data.set(key, value);
  }
  get(key) {
    return this.data.get(key);
  }
};

// Mock File API
global.File = class File {
  constructor([content], filename, options = {}) {
    this.content = content;
    this.name = filename;
    this.type = options.type || '';
    this.size = content.length;
  }
  arrayBuffer() {
    return Promise.resolve(this.content);
  }
};

// Mock window for Tesseract.js
global.window = undefined;

// Mock canvas for Tesseract.js
jest.mock('canvas', () => {
  return {
    createCanvas: jest.fn(() => ({
      getContext: jest.fn(() => ({
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(100),
        })),
      })),
    })),
  };
});

// Increase timeout for OCR tests
jest.setTimeout(30000); 