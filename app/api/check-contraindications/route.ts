import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(request: Request) {
  try {
    const { patientId, medicationId } = await request.json();

    if (!patientId || !medicationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Get patient information
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError) {
      return NextResponse.json(
        { error: 'Failed to fetch patient information' },
        { status: 500 }
      );
    }

    // 2. Get patient's existing prescriptions and medications
    const { data: existingPrescriptions, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        medication_id,
        medications (name, dosage_form, strength, description)
      `)
      .eq('patient_id', patientId)
      .eq('status', 'filled')
      .order('updated_at', { ascending: false });

    if (prescriptionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch patient prescriptions' },
        { status: 500 }
      );
    }

    // 3. Get new medication details
    const { data: newMedication, error: medicationError } = await supabase
      .from('medications')
      .select('*')
      .eq('id', medicationId)
      .single();

    if (medicationError) {
      return NextResponse.json(
        { error: 'Failed to fetch medication information' },
        { status: 500 }
      );
    }

    // 4. Create a list of current medications
    const currentMedications = existingPrescriptions.map((prescription) => {
      return {
        name: prescription.medications.name,
        dosageForm: prescription.medications.dosage_form,
        strength: prescription.medications.strength,
        description: prescription.medications.description
      };
    });

    // 5. Check for contraindications using LLM
    const prompt = `You are a medication safety expert. Analyze the potential contraindications or warnings for adding a new medication to a patient with the following profile:

Patient Information:
- Name: ${patientData.first_name} ${patientData.last_name}
- Age: ${calculateAge(patientData.date_of_birth)}
- Allergies: ${patientData.allergies || 'None'}
- Medical conditions: ${patientData.medical_conditions || 'None'}

New Medication:
- Name: ${newMedication.name}
- Strength: ${newMedication.strength}
- Dosage Form: ${newMedication.dosage_form}
- Description: ${newMedication.description || 'N/A'}

Current Medications:
${currentMedications.length > 0 
  ? currentMedications.map(med => `- ${med.name} ${med.strength} ${med.dosageForm}`).join('\n')
  : 'None'}

Identify and analyze:
1. Potential drug-drug interactions with current medications
2. Contraindications based on patient medical conditions
3. Age-related concerns
4. Allergy-related concerns
5. Any other significant warnings

Format response as JSON:
{
  "hasSevereContraindications": boolean (true for any high-severity issues),
  "contraindications": [
    {
      "type": "drug-interaction" | "condition" | "allergy" | "age" | "other",
      "description": "clear explanation of the issue",
      "severity": "high" | "medium" | "low",
      "recommendation": "what to do about this issue"
    }
  ]
}

Only include actual contraindications or warnings; if there are none, return an empty array.`;

    // Call Gemini model for analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = JSON.parse(response.text());

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('Error checking contraindications:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check contraindications',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
} 