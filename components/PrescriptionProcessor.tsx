'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Upload, CheckCircle, AlertTriangle, Edit, 
  FilePlus, Clock, X, FileText, Image
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    detail?: string;
  }>;
}

interface ContraindicationResponse {
  hasContraindications: boolean;
  severity: 'low' | 'medium' | 'high';
  details: string[];
}

interface ProcessingError {
  error: string;
  details?: string;
}

// Add this new component for warning display
const WarningCard = ({ 
  warnings, 
  isAcknowledged, 
  onAcknowledge 
}: { 
  warnings: ExtractedPrescription['warnings'], 
  isAcknowledged: boolean, 
  onAcknowledge: () => void 
}) => {
  return (
    <div className="mb-6" id="warnings-section">
      <div className={`overflow-hidden rounded-lg border-2 ${isAcknowledged ? 'border-orange-400' : 'border-red-600'} shadow-lg`}>
        {/* Warning header */}
        <div className={`w-full px-4 py-3 ${isAcknowledged ? 'bg-orange-500' : 'bg-red-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3" />
              <h3 className="text-lg font-bold">
                {isAcknowledged ? 'Warnings Acknowledged' : 'Medication Warnings'}
              </h3>
            </div>
            {!isAcknowledged && (
              <span className="inline-block animate-pulse bg-white text-red-600 text-xs font-bold px-2 py-1 rounded">
                ACTION REQUIRED
              </span>
            )}
          </div>
        </div>
          
        {/* Warning content */}
        <div className={`p-4 ${isAcknowledged ? 'bg-orange-50' : 'bg-red-50'}`}>
          <ul className="space-y-3">
            {warnings.map((warning, index) => (
              <li key={index} className="rounded-md border-l-4 border-l-red-600 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-base">
                      {warning.type === 'interaction' ? 'Drug Interaction' : 
                       warning.type === 'unclear' ? 'Unclear Information' : 'Error'}
                    </span>
                    {warning.severity === 'high' && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-md font-bold">
                        High
                      </span>
                    )}
                    {warning.severity === 'medium' && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-bold flex items-center">
                        Medium
                      </span>
                    )}
                    {warning.severity === 'low' && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-md font-bold">
                        Low
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium text-base">{warning.message}</p>
                  {warning.detail && (
                    <p className="text-gray-700 text-sm mt-1">
                      <span className="font-bold">Recommendation:</span> {warning.detail}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-4 flex items-center justify-between">
            <p className={`${isAcknowledged ? 'text-orange-700' : 'text-red-700'} font-semibold`}>
              {isAcknowledged 
                ? 'You have acknowledged these warnings - proceed with caution' 
                : 'These warnings require acknowledgment before proceeding'}
            </p>
            <Button 
              variant={isAcknowledged ? "outline" : "destructive"}
              size="sm" 
              className={isAcknowledged 
                ? "border-orange-500 text-orange-700 hover:bg-orange-50" 
                : "bg-red-600 hover:bg-red-700 text-white font-bold px-4"}
              onClick={onAcknowledge}
            >
              {isAcknowledged ? "Warnings Acknowledged ✓" : "Acknowledge Warnings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrescriptionProcessor = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [processingError, setProcessingError] = useState<ProcessingError | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPrescription | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);
  const [editablePatient, setEditablePatient] = useState({
    name: '',
    dateOfBirth: '',
    id: ''
  });
  const [editableMedication, setEditableMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: ''
  });
  const [editablePrescriber, setEditablePrescriber] = useState({
    name: '',
    npi: '',
    date: ''
  });

  let timerInterval: NodeJS.Timeout | null = null;

  const handleNewPrescription = () => {
    setFiles([]);
    setFilePreview(null);
    setExtractedData(null);
    setVerificationStatus('pending');
    setProcessingError(null);
    setProcessingTime(0);
    setIsEditing(false);
    setWarningsAcknowledged(false);
    setEditablePatient({ name: '', dateOfBirth: '', id: '' });
    setEditableMedication({ name: '', dosage: '', frequency: '', instructions: '' });
    setEditablePrescriber({ name: '', npi: '', date: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
        // Reset file input to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error selecting files:", error);
      setProcessingError({
        error: "Error selecting files",
        details: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                        file.type === 'application/pdf';
      
      const isValidSize = file.size <= 15 * 1024 * 1024; // 15MB max
      
      if (!isValidType) {
        setProcessingError({
          error: "Invalid file type",
          details: `${file.name} has an unsupported file type. Only images and PDFs are supported.`
        });
        return false;
      }
      
      if (!isValidSize) {
        setProcessingError({
          error: "File too large",
          details: `${file.name} exceeds the 15MB file size limit. Larger files may cause timeout issues.`
        });
        return false;
      }
      
      return isValidType && isValidSize;
    });
    
    // Only take the first valid file - we only need one prescription
    if (validFiles.length > 0) {
      setFiles([validFiles[0]]);
      setFilePreview(URL.createObjectURL(validFiles[0]));
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
      e.dataTransfer.clearData();
    }
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setProcessingError({
        error: "No files to process",
        details: "Please select or drop a file first."
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingTime(0);
    
    let seconds = 0;
    timerInterval = setInterval(() => {
      seconds += 1;
      setProcessingTime(seconds);
      if (seconds >= 90) { // Extended timeout to 90 seconds
        if (timerInterval) clearInterval(timerInterval);
        if (isProcessing) {
          setProcessingError({
            error: "Processing timed out",
            details: "The AI analysis process took too long. Try with a clearer image, reduce file size, or use a PDF."
          });
          setIsProcessing(false);
        }
      }
    }, 1000);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('prescription', file);
      
      // Add a client-side timeout that's longer than the interval check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
      
      const response = await fetch('/api/process-prescription', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process prescription', { 
          cause: errorData.details 
        });
      }

      const data = await response.json();
      setExtractedData(data);
      
      // Also populate the editable data
      setEditablePatient(data.patientInfo);
      setEditableMedication(data.medication);
      setEditablePrescriber(data.prescriber);
      
      // Automatically enable editing mode for all fields
      setIsEditing(true);
    } catch (error: any) {
      console.error('Error processing prescription:', error);
      
      let errorMsg = error.message || 'Error processing prescription';
      let errorDetails = error.cause || 'Please try again with a clearer image or a different file format.';
      
      setProcessingError({
        error: errorMsg,
        details: errorDetails
      });
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      setIsProcessing(false);
    }
  };

  const handleEditablePatientChange = (field: string, value: string) => {
    setEditablePatient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditableMedicationChange = (field: string, value: string) => {
    setEditableMedication(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditablePrescriberChange = (field: string, value: string) => {
    setEditablePrescriber(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePrescription = async () => {
    try {
      // Create the prescription record in Supabase
      // This is just a mockup - you would need to implement the actual saving logic
      
      // Find or create patient, medication, and prescriber records first
      // Then create the prescription linking them
      
      // For now just show a success message
      alert("Prescription saved successfully");
      
      // Redirect to prescriptions page
      router.push('/prescriptions');
    } catch (error) {
      console.error('Error saving prescription:', error);
      setProcessingError({
        error: 'Failed to save prescription',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5 text-gray-500" />;
    if (file.type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setFilePreview(null);
  };

  // Add handler function for acknowledging warnings
  const handleAcknowledgeWarnings = () => {
    setWarningsAcknowledged(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Process New Prescription</h1>
      
      {!extractedData && (
        <Card className={`border-2 ${isDragging ? 'border-primary border-dashed bg-primary/5' : 'border-border'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}>
          <CardHeader>
            <CardTitle>Upload Prescription</CardTitle>
            <CardDescription>
              Upload or drag a prescription to scan using Gemini 1.5 AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File selection area */}
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <div className="mb-2 font-medium">
                Drop prescription image or PDF here
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                Supported formats: JPG, PNG, PDF (max 15MB)
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}>
                Browse files
              </Button>
            </div>
            
            {/* Selected file preview */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected File:</Label>
                <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(files[0])}
                    <span className="text-sm font-medium truncate">{files[0].name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(files[0].size)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFile(0)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* File preview image */}
            {filePreview && files[0]?.type.startsWith('image/') && (
              <div className="space-y-2">
                <Label>Preview:</Label>
                <div className="relative border rounded-md overflow-hidden">
                  <img 
                    src={filePreview} 
                    alt="Prescription preview" 
                    className="w-full object-contain max-h-[300px]"
                  />
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end">
              <Button
                onClick={handleProcessFiles}
                disabled={files.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    Analyze Prescription
                  </>
                )}
              </Button>
            </div>
            
            {/* Processing indicators */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gemini 1.5 analyzing prescription...</span>
                  <span className="text-sm text-muted-foreground">{processingTime}s</span>
                </div>
                <Progress value={Math.min(processingTime / 90 * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Processing large or complex prescriptions may take up to 90 seconds
                </p>
              </div>
            )}
            
            {/* Error display */}
            {processingError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{processingError.error}</AlertTitle>
                <AlertDescription>
                  {processingError.details}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Extracted Information - Editable Form */}
      {extractedData && (
        <Card className="relative">
          {/* Sticky warning banner */}
          {extractedData.warnings && 
           extractedData.warnings.length > 0 && 
           !warningsAcknowledged && (
            <div className="sticky top-0 z-50 w-full bg-red-600 text-white py-2 px-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-bold">Warning: {extractedData.warnings.length} safety issue{extractedData.warnings.length > 1 ? 's' : ''} detected</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-white text-white hover:bg-red-700"
                onClick={() => {
                  // Scroll to warnings section
                  document.getElementById('warnings-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Warnings
              </Button>
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prescription Information</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "View Mode" : "Edit Mode"}
              </Button>
            </div>
            <CardDescription>
              {isEditing 
                ? "Edit the prescription details below before saving" 
                : "Details extracted from the prescription document"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Warnings - Make the section ID for scrolling */}
            {extractedData.warnings && extractedData.warnings.length > 0 && (
              <WarningCard 
                warnings={extractedData.warnings} 
                isAcknowledged={warningsAcknowledged} 
                onAcknowledge={handleAcknowledgeWarnings}
              />
            )}
            
            {/* Patient Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-name">Patient Name</Label>
                  {isEditing ? (
                    <Input 
                      id="patient-name" 
                      value={editablePatient.name} 
                      onChange={e => handleEditablePatientChange('name', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editablePatient.name}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient-dob">Date of Birth</Label>
                  {isEditing ? (
                    <Input 
                      id="patient-dob" 
                      value={editablePatient.dateOfBirth} 
                      onChange={e => handleEditablePatientChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editablePatient.dateOfBirth}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient-id">Patient ID</Label>
                  {isEditing ? (
                    <Input 
                      id="patient-id" 
                      value={editablePatient.id} 
                      onChange={e => handleEditablePatientChange('id', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editablePatient.id}</div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="patient-select">Select Existing Patient (Optional)</Label>
                    <Select onValueChange={setSelectedPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing patient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">John Doe</SelectItem>
                        <SelectItem value="2">Jane Smith</SelectItem>
                        <SelectItem value="3">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Medication Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Medication Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="med-name">Medication</Label>
                  {isEditing ? (
                    <Input 
                      id="med-name" 
                      value={editableMedication.name} 
                      onChange={e => handleEditableMedicationChange('name', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editableMedication.name}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="med-dosage">Dosage</Label>
                  {isEditing ? (
                    <Input 
                      id="med-dosage" 
                      value={editableMedication.dosage} 
                      onChange={e => handleEditableMedicationChange('dosage', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editableMedication.dosage}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="med-frequency">Frequency</Label>
                  {isEditing ? (
                    <Input 
                      id="med-frequency" 
                      value={editableMedication.frequency} 
                      onChange={e => handleEditableMedicationChange('frequency', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editableMedication.frequency}</div>
                  )}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="med-instructions">Instructions</Label>
                  {isEditing ? (
                    <Textarea 
                      id="med-instructions" 
                      value={editableMedication.instructions} 
                      onChange={e => handleEditableMedicationChange('instructions', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editableMedication.instructions}</div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="medication-select">Select Existing Medication (Optional)</Label>
                    <Select onValueChange={setSelectedMedicationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing medication" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Amoxicillin 500mg</SelectItem>
                        <SelectItem value="2">Lisinopril 10mg</SelectItem>
                        <SelectItem value="3">Metformin 850mg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Prescriber Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Prescriber Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prescriber-name">Prescriber Name</Label>
                  {isEditing ? (
                    <Input 
                      id="prescriber-name" 
                      value={editablePrescriber.name} 
                      onChange={e => handleEditablePrescriberChange('name', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editablePrescriber.name}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prescriber-npi">NPI Number</Label>
                  {isEditing ? (
                    <Input 
                      id="prescriber-npi" 
                      value={editablePrescriber.npi} 
                      onChange={e => handleEditablePrescriberChange('npi', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editablePrescriber.npi}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prescription-date">Date Prescribed</Label>
                  {isEditing ? (
                    <Input 
                      id="prescription-date" 
                      value={editablePrescriber.date} 
                      onChange={e => handleEditablePrescriberChange('date', e.target.value)}
                    />
                  ) : (
                    <div className="border p-2 rounded-md">{editablePrescriber.date}</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional prescription fields could be added here */}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleNewPrescription}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePrescription}
              disabled={extractedData.warnings && extractedData.warnings.length > 0 && !warningsAcknowledged}
              className={extractedData.warnings && extractedData.warnings.length > 0 && !warningsAcknowledged 
                ? "opacity-50 cursor-not-allowed" 
                : ""}
            >
              {extractedData.warnings && extractedData.warnings.length > 0 && !warningsAcknowledged 
                ? "Acknowledge Warnings to Save" 
                : "Save Prescription"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default PrescriptionProcessor; 