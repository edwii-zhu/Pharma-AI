import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// For development/testing - set to true to bypass analysis and return mock data
const USE_MOCK_DATA = false;

// API processing timeout in milliseconds (90 seconds)
const PROCESSING_TIMEOUT = 90000;

// Interface for warning objects
interface Warning {
  type: 'interaction' | 'error' | 'caution';
  message: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

// Function to check drug interactions using LLM
async function checkDrugInteractions(medication: any): Promise<Warning[]> {
  if (!medication.name) {
    return [];
  }
  
  try {
    const prompt = `You are a pharmaceutical expert. Analyze the following medication and provide potential 
    drug interactions, dosage concerns, and usage warnings.
    
    Medication: ${medication.name}
    Dosage: ${medication.dosage || 'Not specified'}
    Frequency: ${medication.frequency || 'Not specified'}
    Instructions: ${medication.instructions || 'Not specified'}
    
    Return ONLY a JSON array of warning objects with no additional text. Each warning object should have:
    {
      "type": one of ["interaction", "error", "caution"],
      "message": short warning message (20 words max),
      "detail": detailed explanation (50 words max),
      "severity": one of ["low", "medium", "high"]
    }
    
    Include common interactions with other medications, foods, alcohol, and conditions.
    Include dosage concerns if the specified dosage seems unusual.
    Include 3-5 warnings total.`;

    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (parseError) {
      // If the response isn't valid JSON, try to extract the JSON portion
      const text = response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      console.error('Failed to parse LLM drug interaction response');
      return getDefaultWarnings();
    }
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    return getDefaultWarnings();
  }
}

// Fallback warnings if LLM fails
function getDefaultWarnings(): Warning[] {
  return [
    {
      type: 'interaction',
      message: 'May interact with other medications',
      detail: 'Consult with your pharmacist about potential drug interactions with your current medications.',
      severity: 'medium'
    },
    {
      type: 'caution',
      message: 'Follow dosage instructions carefully',
      detail: 'Taking more than prescribed may lead to adverse effects.',
      severity: 'medium'
    }
  ];
}

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

    // Check file size - reject if too large
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large', 
          details: 'Maximum file size is 15MB. Large files may cause timeouts.'
        },
        { status: 400 }
      );
    }

    let structuredData;
    
    if (USE_MOCK_DATA) {
      // Mock data for development/testing
      console.log('Using mock prescription data');
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
      // Process with Gemini Vision API
      try {
        // Convert file to base64 for Gemini API
        const fileArrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(fileArrayBuffer);
        const base64Image = fileBuffer.toString('base64');
        const mimeType = file.type;
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Processing timed out')), PROCESSING_TIMEOUT);
        });
        
        // Create the image processing promise
        const processingPromise = async () => {
          const prompt = `You are a medical prescription analyzer. Examine this prescription image and extract the following information from it:
            - Patient information (name, date of birth, ID)
            - Medication details (name, dosage, frequency, instructions)
            - Prescriber information (name, NPI number, date)
            
            Format the response as a JSON object with the following structure ONLY:
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
            
            If any field is unclear or missing from the image, use an empty string for that field.
            DO NOT include any explanations or notes in your response, just the JSON object.`;
          
          const result = await visionModel.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Image,
                mimeType
              }
            }
          ]);
          
          const response = await result.response;
          try {
            return JSON.parse(response.text());
          } catch (parseError) {
            // If the response isn't valid JSON, try to extract the JSON portion
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse AI response');
          }
        };
        
        // Race the promises
        structuredData = await Promise.race([processingPromise(), timeoutPromise]);
      } catch (aiError) {
        console.error('Error processing image with AI:', aiError);
        return NextResponse.json(
          { 
            error: 'Failed to analyze prescription image',
            details: aiError instanceof Error ? aiError.message : 'Error in image analysis'
          },
          { status: 500 }
        );
      }
    }

    // Get drug interaction warnings using LLM
    const warnings = await checkDrugInteractions(structuredData.medication);

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