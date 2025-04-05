import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('prescription') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OCR processing
    const buffer = Buffer.from(await file.arrayBuffer());

    // Perform OCR using Tesseract.js
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    // Process extracted text with Gemini to structure the data
    const prompt = `You are a medical prescription analyzer. Extract and structure the following information from the prescription text:
      - Patient information (name, date of birth, ID)
      - Medication details (name, dosage, frequency, instructions)
      - Prescriber information (name, NPI number, date)
      Format the response as a JSON object with the following structure:
      {
        "patientInfo": {
          "name": string,
          "dateOfBirth": string,
          "id": string
        },
        "medication": {
          "name": string,
          "dosage": string,
          "frequency": string,
          "instructions": string
        },
        "prescriber": {
          "name": string,
          "npi": string,
          "date": string
        }
      }
      Flag any unclear or potentially erroneous information.
      
      Prescription text:
      ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const structuredData = JSON.parse(response.text());

    // Analyze potential drug interactions (mock implementation)
    const warnings = [
      // This would be replaced with actual drug interaction checking logic
      {
        type: 'interaction',
        message: 'Potential interaction with existing medication: Aspirin',
        severity: 'medium'
      }
    ];

    return NextResponse.json({
      ...structuredData,
      warnings
    });

  } catch (error) {
    console.error('Error processing prescription:', error);
    return NextResponse.json(
      { error: 'Failed to process prescription' },
      { status: 500 }
    );
  }
} 