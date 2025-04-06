'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, AlertTriangle, FilePlus, Clock, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExtractedPrescription {
  patientInfo: {
    name: string;
    dateOfBirth: string;
    id: string;
  };
  medication: {
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
  };
  prescriber: {
    name: string;
    npi: string;
    date: string;
  };
  warnings: Array<{
    type: 'interaction' | 'unclear' | 'error';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface ProcessingError {
  error: string;
  details?: string;
}

const PrescriptionProcessor = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [processingError, setProcessingError] = useState<ProcessingError | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPrescription | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [isEditing, setIsEditing] = useState(false);

  // Processing timer
  let timerInterval: NodeJS.Timeout | null = null;

  const handleNewPrescription = () => {
    setFile(null);
    setFilePreview(null);
    setExtractedData(null);
    setVerificationStatus('pending');
    setProcessingError(null);
    setProcessingTime(0);
    setIsEditing(false);
    // Reset the file input by recreating it
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    if (!uploadedFile.type.includes('pdf') && !uploadedFile.type.includes('image')) {
      alert('Please upload a PDF or image file');
      return;
    }

    setFile(uploadedFile);
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingTime(0);
    
    // Create preview URL for the file
    const fileURL = URL.createObjectURL(uploadedFile);
    setFilePreview(fileURL);
    
    // Start a timer to show processing time
    let seconds = 0;
    timerInterval = setInterval(() => {
      seconds += 1;
      setProcessingTime(seconds);
      // After 60 seconds, update the UI to show processing is still ongoing
      if (seconds >= 60) {
        setProcessingError({
          error: "Processing is taking longer than expected.",
          details: "Please wait as we continue processing or try again with a clearer image."
        });
      }
    }, 1000);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('prescription', uploadedFile);

      // Send to backend for processing
      const response = await fetch('/api/process-prescription', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process prescription', { 
          cause: errorData.details 
        });
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (error: any) {
      console.error('Error processing prescription:', error);
      setProcessingError({
        error: error.message || 'Error processing prescription',
        details: error.cause || 'Please try again with a clearer image or a different file format.'
      });
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      setIsProcessing(false);
    }
  };

  const handleVerification = async (status: 'verified' | 'rejected') => {
    if (!extractedData) return;

    try {
      const response = await fetch('/api/verify-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          prescriptionData: extractedData,
        }),
      });

      if (!response.ok) throw new Error('Failed to verify prescription');

      setVerificationStatus(status);
      // After successful verification, redirect to dashboard
      if (status === 'verified') {
        router.push('/');
      }
    } catch (error) {
      console.error('Error verifying prescription:', error);
      alert('Error verifying prescription. Please try again.');
    }
  };

  const handleMedicationChange = (field: keyof ExtractedPrescription['medication'], value: string) => {
    if (!extractedData) return;
    
    setExtractedData({
      ...extractedData,
      medication: {
        ...extractedData.medication,
        [field]: value
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Prescription Processing</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewPrescription}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isProcessing}
            >
              <FilePlus className="h-4 w-4" />
              Clear Form
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="mb-4"
            />
            
            {/* Document Preview */}
            {filePreview && (
              <div className="border rounded-md overflow-hidden mt-4 h-[500px] max-h-[500px]">
                {file?.type.includes('pdf') ? (
                  <iframe 
                    src={filePreview} 
                    className="w-full h-full" 
                    title="PDF Preview"
                  />
                ) : (
                  <img 
                    src={filePreview} 
                    alt="Prescription Preview" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing prescription... {processingTime}s</span>
                </div>
                <Progress value={Math.min(processingTime, 60)} max={60} className="h-2" />
                <p className="text-xs text-muted-foreground">OCR processing can take up to 60 seconds for complex images</p>
                
                {processingTime >= 30 && (
                  <Alert variant="default" className="mt-2 border-yellow-500">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <AlertTitle>Processing Time</AlertTitle>
                    <AlertDescription>
                      This is taking longer than usual. Processing complex images may take up to 60 seconds.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {processingError && !isProcessing && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{String(processingError.error)}</AlertTitle>
                <AlertDescription>
                  {processingError.details && (
                    <p className="mt-1">{processingError.details}</p>
                  )}
                  {processingError.error.includes('timed out') && (
                    <div className="mt-2">
                      <p className="text-sm">Suggestions:</p>
                      <ul className="text-sm list-disc ml-5 mt-1">
                        <li>Try with a clearer, higher resolution image</li>
                        <li>Ensure the prescription text is clearly visible and well-lit</li>
                        <li>Upload a PDF instead of an image if available</li>
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Extracted Data Display */}
          {extractedData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Extracted Information</h3>
                <Button 
                  onClick={() => setIsEditing(!isEditing)} 
                  size="sm"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Done Editing" : "Edit Medication"}
                </Button>
              </div>
              
              {/* Patient Information */}
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <p>Name: {extractedData.patientInfo.name}</p>
                  <p>DOB: {extractedData.patientInfo.dateOfBirth}</p>
                  <p>ID: {extractedData.patientInfo.id}</p>
                </div>
              </div>

              {/* Medication Details */}
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Medication</h4>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="med-name">Name:</Label>
                        <Input 
                          id="med-name"
                          value={extractedData.medication.name}
                          onChange={(e) => handleMedicationChange('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="med-dosage">Dosage:</Label>
                        <Input 
                          id="med-dosage"
                          value={extractedData.medication.dosage}
                          onChange={(e) => handleMedicationChange('dosage', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="med-frequency">Frequency:</Label>
                        <Input 
                          id="med-frequency"
                          value={extractedData.medication.frequency}
                          onChange={(e) => handleMedicationChange('frequency', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="med-instructions">Instructions:</Label>
                        <Textarea 
                          id="med-instructions"
                          value={extractedData.medication.instructions}
                          onChange={(e) => handleMedicationChange('instructions', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p>Name: {extractedData.medication.name}</p>
                      <p>Dosage: {extractedData.medication.dosage}</p>
                      <p>Frequency: {extractedData.medication.frequency}</p>
                      <p>Instructions: {extractedData.medication.instructions}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {extractedData.warnings.length > 0 && (
                <div className="space-y-2">
                  {extractedData.warnings.map((warning, index) => (
                    <Alert key={index} variant={warning.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{warning.type.charAt(0).toUpperCase() + warning.type.slice(1)}</AlertTitle>
                      <AlertDescription>{warning.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Verification Buttons */}
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={() => handleVerification('verified')}
                  disabled={verificationStatus !== 'pending'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Prescription
                </Button>
                <Button
                  onClick={() => handleVerification('rejected')}
                  disabled={verificationStatus !== 'pending'}
                  variant="destructive"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reject Prescription
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PrescriptionProcessor; 