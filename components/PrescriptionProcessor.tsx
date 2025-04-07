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
            details: "The OCR process took too long. Try with a clearer image, reduce file size, or use a PDF."
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
      
      // Handle specific abort error
      if (error.name === 'AbortError') {
        errorMsg = 'OCR process timeout';
        errorDetails = 'The request was terminated due to taking too long. Try with a clearer, smaller file.';
      }
      
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Process New Prescription</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Prescription</CardTitle>
          <CardDescription>
            Upload a high-quality image or PDF of the prescription to extract information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Images or PDF (MAX. 15MB)</p>
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              onChange={handleFileSelect}
              className="hidden" 
              accept="image/*,application/pdf"
            />
          </div>
          
          <Alert>
            <AlertTitle>For best OCR results:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 text-sm">
                <li>Use high-contrast, well-lit images</li>
                <li>Ensure text is clearly legible and not blurry</li>
                <li>PDFs generally work better than images</li>
                <li>Avoid shadows and glare on the prescription</li>
                <li>Keep file size below 5MB for faster processing</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected File:</h4>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-white">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getFileIcon(file)}
                      <span className="text-sm font-medium text-gray-800 truncate flex-1" title={file.name}>{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatFileSize(file.size)}</span>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-500 hover:text-red-600 flex-shrink-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </li>
                ))}
              </ul>
              <Button 
                type="button"
                onClick={handleProcessFiles}
                disabled={isProcessing || files.length === 0}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <>Process File & Extract Data</>
                )}
              </Button>
            </div>
          )}
          
          {/* File Preview */}
          {filePreview && (
            <div className="border rounded-md overflow-hidden mt-4 h-[450px] max-h-[450px]">
              {files[0]?.type.includes('pdf') ? (
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
          
          {/* Processing Status */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing prescription... {processingTime}s</span>
              </div>
              <Progress value={Math.min(processingTime, 90)} max={90} className="h-2" />
              <p className="text-xs text-muted-foreground">OCR processing can take up to 90 seconds for complex images</p>
              
              {processingTime >= 30 && (
                <Alert variant="default" className="mt-2 border-yellow-500">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>Processing Time</AlertTitle>
                  <AlertDescription>
                    This is taking longer than usual. Processing complex images may take up to 90 seconds.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Processing Error */}
          {processingError && !isProcessing && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{String(processingError.error)}</AlertTitle>
              <AlertDescription>
                {processingError.details && (
                  <p className="mt-1">{processingError.details}</p>
                )}
                <div className="mt-2">
                  <p className="text-sm font-medium">Suggestions to improve OCR:</p>
                  <ul className="text-sm list-disc ml-5 mt-1">
                    <li>Try with a clearer, higher resolution image</li>
                    <li>Ensure the prescription is well-lit with good contrast</li>
                    <li>Use a PDF instead of an image if available</li>
                    <li>Make sure text is not blurry and is clearly legible</li>
                    <li>Reduce file size to under 5MB if possible</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Extracted Information - Editable Form */}
      {extractedData && (
        <Card>
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
            
            {extractedData.warnings && extractedData.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Warnings</h3>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2">
                      {extractedData.warnings.map((warning, index) => (
                        <li key={index} className="mt-1">
                          <span className="font-medium">{warning.type === 'interaction' ? 'Drug Interaction' : warning.type === 'unclear' ? 'Unclear Information' : 'Error'}:</span> {warning.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleNewPrescription}>
              Cancel
            </Button>
            <Button onClick={handleSavePrescription}>
              Save Prescription
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default PrescriptionProcessor; 