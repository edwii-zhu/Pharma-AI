'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react";

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

export default function PrescriptionProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPrescription | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    if (!uploadedFile.type.includes('pdf') && !uploadedFile.type.includes('image')) {
      alert('Please upload a PDF or image file');
      return;
    }

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('prescription', uploadedFile);

      // Send to backend for processing
      const response = await fetch('/api/process-prescription', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process prescription');

      const data = await response.json();
      setExtractedData(data);
    } catch (error) {
      console.error('Error processing prescription:', error);
      alert('Error processing prescription. Please try again.');
    } finally {
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
    } catch (error) {
      console.error('Error verifying prescription:', error);
      alert('Error verifying prescription. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Prescription Processing</h2>
        
        {/* Upload Section */}
        <div className="mb-6">
          <Input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="mb-4"
          />
          {isProcessing && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing prescription...</span>
            </div>
          )}
        </div>

        {/* Extracted Data Display */}
        {extractedData && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Extracted Information</h3>
            
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
              <div className="space-y-2">
                <p>Name: {extractedData.medication.name}</p>
                <p>Dosage: {extractedData.medication.dosage}</p>
                <p>Frequency: {extractedData.medication.frequency}</p>
                <p>Instructions: {extractedData.medication.instructions}</p>
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
      </Card>
    </div>
  );
} 