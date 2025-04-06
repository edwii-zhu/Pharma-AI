import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// For development/testing - set to true to bypass OCR and return mock data
const USE_MOCK_DATA = false;

// OCR timeout in milliseconds (60 seconds)
const OCR_TIMEOUT = 60000;

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

    // Extract text from prescription
    let text = '';
    
    if (USE_MOCK_DATA) {
      // Mock data for development/testing
      console.log('Using mock prescription data instead of OCR');
      text = `
        PATIENT: John Smith
        DOB: 05/12/1975
        PATIENT ID: 12345678
        
        MEDICATION: Amoxicillin 500mg
        DOSAGE: 1 capsule
        FREQUENCY: three times daily
        INSTRUCTIONS: Take with food. Finish all medication.
        
        Dr. Sarah Johnson, MD
        NPI: 1234567890
        DATE: 06/15/2023
      `;
    } else {
      // Perform OCR using Tesseract.js with timeout handling
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OCR processing timed out')), OCR_TIMEOUT); // 60 seconds timeout
        });
        
        // Create the OCR promise
        const ocrPromise = async () => {
          try {
            const worker = await createWorker('eng'); // Use simpler version directly
            const result = await worker.recognize(buffer);
            await worker.terminate();
            return result.data.text;
          } catch (err) {
            console.error('Error in OCR processing:', err);
            throw new Error('OCR processing failed: ' + (err instanceof Error ? err.message : String(err)));
          }
        };
        
        // Race the promises
        text = await Promise.race([ocrPromise(), timeoutPromise]) as string;
        
        if (!text || text.trim().length === 0) {
          throw new Error('OCR produced empty text. The image may be unclear or in an unsupported format.');
        }
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
        return NextResponse.json(
          { 
            error: 'OCR processing failed or timed out', 
            details: ocrError instanceof Error ? ocrError.message : 'Unknown OCR error'
          },
          { status: 500 }
        );
      }
    }

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

    let structuredData;
    if (USE_MOCK_DATA) {
      // Use mock structured data for development
      structuredData = {
        "patientInfo": {
          "name": "John Smith",
          "dateOfBirth": "05/12/1975",
          "id": "12345678"
        },
        "medication": {
          "name": "Amoxicillin 500mg",
          "dosage": "1 capsule",
          "frequency": "three times daily",
          "instructions": "Take with food. Finish all medication."
        },
        "prescriber": {
          "name": "Dr. Sarah Johnson, MD",
          "npi": "1234567890",
          "date": "06/15/2023"
        }
      };
    } else {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        structuredData = JSON.parse(response.text());
      } catch (aiError) {
        console.error('Error processing text with AI:', aiError);
        return NextResponse.json(
          { 
            error: 'Failed to analyze prescription text',
            details: aiError instanceof Error ? aiError.message : 'Error in text analysis'
          },
          { status: 500 }
        );
      }
    }

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
      { 
        error: 'Failed to process prescription',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 