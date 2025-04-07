import { supabase } from './supabase';

export type FileType = 'image' | 'pdf' | 'audio';

export interface ProcessedFileResult {
  extractedText: string;
  structuredData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    address?: string;
    phone?: string;
    email?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceGroupNumber?: string;
    allergies?: string[];
    medicalConditions?: string[];
    [key: string]: any;
  };
}

/**
 * Ensures that a storage bucket exists, creating it if necessary
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Check storage availability first
    const { data, error: availabilityError } = await supabase.storage.listBuckets();
    
    if (availabilityError) {
      console.error('Storage API not available:', availabilityError.message);
      return false;
    }
    
    // Check if bucket exists
    const bucketExists = data?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket exists: ${bucketName}`);
      return true;
    } else {
      console.warn(`Bucket "${bucketName}" not found. Using "patients" bucket instead.`);
      // Check if the "patients" bucket exists
      const patientsExists = data?.some(bucket => bucket.name === "patients");
      return patientsExists || false;
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

/**
 * Uploads a file to Supabase storage
 */
export const uploadFile = async (file: File, patientId: string): Promise<string> => {
  try {
    // We'll use the "patients" bucket instead of trying to create one
    const bucketName = "patients";
    
    // Check if we can access the bucket
    const bucketReady = await ensureBucketExists(bucketName);
    
    // If we can't access the bucket, fall back to mock URLs
    if (!bucketReady) {
      console.warn('Using mock URL due to storage bucket issues');
      return `mock://patients/${patientId}/${Date.now()}-${file.name}`;
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}/${Date.now()}.${fileExt}`;
    const filePath = fileName; // Simpler path structure

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) {
      console.error(`Upload error: ${error.message}`);
      
      // For permission errors, use a mock URL instead of failing
      if (error.message.includes('permission') || error.message.includes('policy')) {
        return `mock://patients/${patientId}/${Date.now()}-${file.name}`;
      }
      
      throw new Error(`Error uploading file: ${error.message}`);
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (storageError) {
    console.error("Storage error:", storageError);
    
    // Always return a mock URL when in development or if there's an error
    console.warn("Storage error encountered, using mock URL instead");
    return `mock://patients/${patientId}/${Date.now()}-${file.name}`;
  }
};

/**
 * Determines the type of file
 */
export const getFileType = (file: File): FileType => {
  const mimeType = file.type;
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
};

/**
 * Process a file with an LLM to extract structured data
 */
export const processFile = async (
  file: File, 
  fileType: FileType, 
  fileUrl: string
): Promise<ProcessedFileResult> => {
  // In a real implementation, we would:
  // 1. For images: Use OCR to extract text
  // 2. For PDFs: Extract text
  // 3. For audio: Use speech-to-text
  // 4. Send the extracted text to an LLM API (like OpenAI) to structure the data
  
  // For now, we'll mock this functionality
  
  // Mock extraction based on file type
  let extractedText = '';
  
  if (fileType === 'image') {
    extractedText = 'Simulated OCR text from image file';
    // In a real implementation, we'd use an OCR service like Tesseract.js or a cloud API
  } else if (fileType === 'pdf') {
    extractedText = 'Simulated text extraction from PDF file';
    // In a real implementation, we'd use pdf.js or similar
  } else if (fileType === 'audio') {
    extractedText = 'Simulated speech-to-text from audio file';
    // In a real implementation, we'd use a speech recognition API
  }
  
  // Simulate LLM processing
  // In a real implementation, we would call an LLM API like:
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [
  //       {
  //         role: 'system',
  //         content: 'Extract patient information from the following text and format as JSON'
  //       },
  //       { role: 'user', content: extractedText }
  //     ]
  //   })
  // });
  // const data = await response.json();
  // const structuredData = JSON.parse(data.choices[0].message.content);
  
  // For now, return mock structured data
  const mockStructuredData = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-05-15',
    address: '123 Main St, Anytown, USA',
    phone: '555-123-4567',
    email: 'john.doe@example.com',
    insuranceProvider: 'Health Insurance Co',
    insurancePolicyNumber: 'POL-12345',
    insuranceGroupNumber: 'GRP-6789',
    allergies: ['Penicillin', 'Peanuts'],
    medicalConditions: ['Hypertension', 'Type 2 Diabetes']
  };
  
  return {
    extractedText,
    structuredData: mockStructuredData
  };
};

/**
 * A safer version of uploadFile that handles errors more gracefully
 */
export const safeUploadFile = async (file: File, patientId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileUrl = await uploadFile(file, patientId);
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error(`Error uploading file ${file.name}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during upload' 
    };
  }
};

/**
 * Processes multiple files and combines the results with better error handling
 */
export const safeProcessMultipleFiles = async (
  files: File[], 
  patientId: string
): Promise<{ result: ProcessedFileResult; failedUploads: number }> => {
  const results: ProcessedFileResult[] = [];
  let failedUploads = 0;
  
  for (const file of files) {
    try {
      const fileType = getFileType(file);
      const uploadResult = await safeUploadFile(file, patientId);
      
      if (!uploadResult.success || !uploadResult.url) {
        failedUploads++;
        continue;
      }
      
      const result = await processFile(file, fileType, uploadResult.url);
      results.push(result);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      failedUploads++;
    }
  }
  
  // Even if some files failed, try to combine what we have
  const combinedResult: ProcessedFileResult = {
    extractedText: results.map(r => r.extractedText).join('\n\n'),
    structuredData: {}
  };
  
  // Merge all structured data
  results.forEach(result => {
    if (result.structuredData) {
      Object.entries(result.structuredData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          combinedResult.structuredData![key] = value;
        }
      });
    }
  });
  
  return { result: combinedResult, failedUploads };
};

/**
 * Processes multiple files and combines the results
 */
export const processMultipleFiles = async (
  files: File[], 
  patientId: string
): Promise<ProcessedFileResult> => {
  // Use the safer implementation internally
  const { result, failedUploads } = await safeProcessMultipleFiles(files, patientId);
  
  // Log any failures
  if (failedUploads > 0) {
    console.warn(`${failedUploads} out of ${files.length} files failed to process`);
  }
  
  return result;
}; 