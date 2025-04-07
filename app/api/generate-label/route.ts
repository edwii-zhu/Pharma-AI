import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { supabase } from '@/lib/supabase';

// Template-based label content generator
const generateLabelContent = (medication: string, dosage: string, frequency: string, instructions: string) => {
  return {
    howToUse: `Take ${dosage} ${frequency}. ${instructions}`,
    warnings: "Do not take more than the prescribed dose. Keep out of reach of children. Inform your doctor about all other medications you use. Discontinue use and contact your doctor if you experience severe side effects.",
    sideEffects: "Common side effects may include drowsiness, dizziness, headache, or upset stomach. Serious side effects are rare but may include allergic reaction (rash, itching, swelling), difficulty breathing, or unusual bleeding/bruising.",
    storage: "Store at room temperature away from moisture and heat. Keep container tightly closed. Do not store in the bathroom. Keep all medications away from children and pets."
  };
};

export async function POST(request: Request) {
  try {
    const { prescriptionId } = await request.json();

    if (!prescriptionId) {
      return NextResponse.json(
        { error: 'No prescription ID provided' },
        { status: 400 }
      );
    }

    // Fetch prescription data from Supabase
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        dosage,
        frequency,
        duration,
        quantity,
        refills,
        instructions,
        date_written,
        date_filled,
        status,
        notes,
        patients (first_name, last_name, date_of_birth),
        medications (name, dosage_form, strength, description),
        prescribers (first_name, last_name)
      `)
      .eq('id', prescriptionId)
      .single();

    if (error || !prescription) {
      return NextResponse.json(
        { error: 'Failed to fetch prescription data', details: error?.message },
        { status: 404 }
      );
    }

    // Generate label content using our template
    const labelContent = generateLabelContent(
      prescription.medications.name,
      prescription.dosage,
      prescription.frequency,
      prescription.instructions
    );

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 396]); // 8.5x5.5 inches (label size)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 36; // 0.5 inch margins
    const fontSize = 10;
    const lineHeight = 14;
    
    // Add pharmacy header
    page.drawText("HEALTH FIRST PHARMACY", {
      x: margin,
      y: height - margin,
      size: 16,
      font: boldFont,
      color: rgb(0, 0.3, 0.6),
    });
    
    page.drawText("123 Main Street, Anytown, USA • (555) 123-4567", {
      x: margin,
      y: height - margin - 20,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add patient info
    page.drawText(`PATIENT: ${prescription.patients.first_name} ${prescription.patients.last_name}`, {
      x: margin,
      y: height - margin - 45,
      size: fontSize,
      font: boldFont,
    });
    
    // Add prescription info
    page.drawText(`RX #: ${prescription.id.substring(0, 8)}`, {
      x: margin,
      y: height - margin - 60,
      size: fontSize,
      font: boldFont,
    });
    
    page.drawText(`PRESCRIBED: ${new Date(prescription.date_written).toLocaleDateString()}`, {
      x: margin + 200,
      y: height - margin - 60,
      size: fontSize,
      font,
    });
    
    page.drawText(`MEDICATION: ${prescription.medications.name} ${prescription.medications.strength}`, {
      x: margin,
      y: height - margin - 80,
      size: fontSize + 2,
      font: boldFont,
    });
    
    page.drawText(`DOSAGE: ${prescription.dosage} | FREQUENCY: ${prescription.frequency}`, {
      x: margin,
      y: height - margin - 100,
      size: fontSize,
      font,
    });

    page.drawText(`QTY: ${prescription.quantity} | REFILLS: ${prescription.refills}`, {
      x: margin,
      y: height - margin - 115,
      size: fontSize,
      font,
    });
    
    page.drawText(`PRESCRIBER: ${prescription.prescribers.first_name} ${prescription.prescribers.last_name}`, {
      x: margin,
      y: height - margin - 130,
      size: fontSize,
      font,
    });
    
    // Add medication information from template
    let currentY = height - margin - 160;
    
    // 1. How to Use
    page.drawText("1. HOW TO USE", {
      x: margin,
      y: currentY,
      size: fontSize,
      font: boldFont,
    });
    currentY -= lineHeight + 5;
    
    // Draw the how to use text with word wrapping
    const howToUseWords = labelContent.howToUse.split(' ');
    let currentLine = '';
    
    for (const word of howToUseWords) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > width - (margin * 2)) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
        });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
      });
      currentY -= lineHeight * 1.5;
    }
    
    // 2. Warnings
    page.drawText("2. WARNINGS", {
      x: margin,
      y: currentY,
      size: fontSize,
      font: boldFont,
    });
    currentY -= lineHeight + 5;
    
    // Draw the warnings with word wrapping
    const warningsWords = labelContent.warnings.split(' ');
    currentLine = '';
    
    for (const word of warningsWords) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > width - (margin * 2)) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
        });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
      });
      currentY -= lineHeight * 1.5;
    }
    
    // 3. Side Effects
    page.drawText("3. SIDE EFFECTS", {
      x: margin,
      y: currentY,
      size: fontSize,
      font: boldFont,
    });
    currentY -= lineHeight + 5;
    
    // Draw the side effects with word wrapping
    const sideEffectsWords = labelContent.sideEffects.split(' ');
    currentLine = '';
    
    for (const word of sideEffectsWords) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > width - (margin * 2)) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
        });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
      });
      currentY -= lineHeight * 1.5;
    }
    
    // 4. Storage
    page.drawText("4. STORAGE", {
      x: margin,
      y: currentY,
      size: fontSize,
      font: boldFont,
    });
    currentY -= lineHeight + 5;
    
    // Draw the storage with word wrapping
    const storageWords = labelContent.storage.split(' ');
    currentLine = '';
    
    for (const word of storageWords) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > width - (margin * 2)) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
        });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
      });
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prescription_label_${prescription.id.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating prescription label:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate prescription label',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 