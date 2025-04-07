const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const TEST_DATA_DIR = path.join(process.cwd(), '__tests__', 'test-data');

// Ensure test data directory exists
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}

// Function to create a prescription image
function createPrescriptionImage(options = {}) {
  const {
    filename = 'prescription.png',
    quality = 'clear', // 'clear', 'low', 'handwritten'
    text = `
PRESCRIPTION

PATIENT: John Smith
DOB: 05/12/1975
PATIENT ID: 12345678

MEDICATION: Amoxicillin 500mg
DOSAGE: 1 capsule
FREQUENCY: three times daily
INSTRUCTIONS: Take with food. 
Finish all medication.

Dr. Sarah Johnson, MD
NPI: 1234567890
DATE: 06/15/2023
    `.trim()
  } = options;

  const canvas = createCanvas(800, 1000);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Configure text based on quality
  if (quality === 'clear') {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
  } else if (quality === 'low') {
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333333';
    // Add noise
    for (let i = 0; i < 5000; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }
  } else if (quality === 'handwritten') {
    ctx.font = '26px "Comic Sans MS"';
    ctx.fillStyle = 'navy';
  }

  // Draw text
  const lines = text.split('\n');
  let y = 50;
  for (const line of lines) {
    if (quality === 'handwritten') {
      // Add slight randomness to position for handwritten effect
      const x = 40 + Math.random() * 5;
      y += Math.random() * 2;
      ctx.fillText(line, x, y);
    } else {
      ctx.fillText(line, 40, y);
    }
    y += 40;
  }

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(TEST_DATA_DIR, filename), buffer);
}

// Generate test images
console.log('Generating test prescription images...');

// Clear prescription
createPrescriptionImage({
  filename: 'clear_prescription.png',
  quality: 'clear'
});

// Low quality prescription
createPrescriptionImage({
  filename: 'low_quality_prescription.jpg',
  quality: 'low'
});

// Handwritten prescription
createPrescriptionImage({
  filename: 'handwritten_prescription.jpg',
  quality: 'handwritten'
});

// Complex prescription (for timeout testing)
createPrescriptionImage({
  filename: 'complex_prescription.png',
  quality: 'low',
  text: Array(100).fill(`
PRESCRIPTION DETAILS
Complex medical terminology
Multiple medications and instructions
Patient history and notes
  `.trim()).join('\n')
});

console.log('Test images generated successfully in', TEST_DATA_DIR); 