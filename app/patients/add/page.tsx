'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Upload, Loader2, FileText, Image, FileAudio, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createPatient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { 
  processMultipleFiles, 
  ProcessedFileResult, 
  ensureBucketExists, 
  safeProcessMultipleFiles 
} from "@/lib/file-processor";
import { supabase } from "@/lib/supabase";

type PatientInsert = Database['public']['Tables']['patients']['Insert'];

export default function AddPatientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileProcessingResult, setFileProcessingResult] = useState<ProcessedFileResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // State for the form fields
  const [formData, setFormData] = useState<PatientInsert>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    address: '',
    phone: '',
    email: '',
    insurance_provider: '',
    insurance_member_id: '',
    insurance_group_number: '',
    allergies: [],
    medical_conditions: []
  });
  
  // State for allergies and medical conditions (text areas)
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [medicalConditionsText, setMedicalConditionsText] = useState<string>('');
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  
  // Check storage availability on mount
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
          console.warn("Storage API not available, switching to mock mode:", error.message);
          setIsMockMode(true);
          
          toast({
            title: "Storage service unavailable",
            description: "Running in mock mode. Files will be processed but not uploaded.",
          });
        }
      } catch (err) {
        console.error("Error checking storage:", err);
        setIsMockMode(true);
        toast({
          title: "Storage check failed",
          description: "Could not verify storage service. Running in mock mode.",
        });
      }
    };
    
    checkStorage();
  }, [toast]);
  
  // Update allergies and medical_conditions arrays when text changes
  useEffect(() => {
    if (allergiesText.trim()) {
      const allergiesArray = allergiesText
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      setFormData((prev: PatientInsert) => ({
        ...prev,
        allergies: allergiesArray
      }));
    } else {
      setFormData((prev: PatientInsert) => ({
        ...prev,
        allergies: []
      }));
    }
  }, [allergiesText]);
  
  useEffect(() => {
    if (medicalConditionsText.trim()) {
      const conditionsArray = medicalConditionsText
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      setFormData((prev: PatientInsert) => ({
        ...prev,
        medical_conditions: conditionsArray
      }));
    } else {
      setFormData((prev: PatientInsert) => ({
        ...prev,
        medical_conditions: []
      }));
    }
  }, [medicalConditionsText]);
  
  // Update form with processed data from files
  useEffect(() => {
    if (fileProcessingResult?.structuredData) {
      const data = fileProcessingResult.structuredData;
      
      // Only update fields that are empty or if the processed data is available
      setFormData((prev: PatientInsert) => ({
        ...prev,
        first_name: prev.first_name || data.firstName || '',
        last_name: prev.last_name || data.lastName || '',
        date_of_birth: prev.date_of_birth || data.dateOfBirth || '',
        address: prev.address || data.address || '',
        phone: prev.phone || data.phone || '',
        email: prev.email || data.email || '',
        insurance_provider: prev.insurance_provider || data.insuranceProvider || '',
        insurance_member_id: prev.insurance_member_id || data.insuranceMemberId || '',
        insurance_group_number: prev.insurance_group_number || data.insuranceGroupNumber || '',
      }));
      
      // Update allergies and medical conditions if they exist in the processed data
      if (data.allergies && data.allergies.length > 0) {
        setAllergiesText((prev: string) => prev || (data.allergies ? data.allergies.join(', ') : ''));
      }
      
      if (data.medicalConditions && data.medicalConditions.length > 0) {
        setMedicalConditionsText((prev: string) => prev || (data.medicalConditions ? data.medicalConditions.join(', ') : ''));
      }
    }
  }, [fileProcessingResult]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: PatientInsert) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file selection
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
      toast({
        title: "Error selecting files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const addFiles = (newFiles: File[]) => {
     // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                          file.type === 'application/pdf' || 
                          file.type.startsWith('audio/');
      
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB max
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} has an unsupported file type. Only images, PDFs, and audio files are supported.`,
          variant: "destructive"
        });
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB file size limit.`,
          variant: "destructive"
        });
      }
      
      return isValidType && isValidSize;
    });
    
    setFiles((prev: File[]) => [...prev, ...validFiles]);
    
    if (validFiles.length > 0) {
      toast({
        title: "Files added",
        description: `${validFiles.length} file(s) added successfully.`,
      });
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
  
  // Process files
  const handleProcessFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please select or drop some files first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingFiles(true);
    setFileProcessingResult(null); // Clear previous results
    
    try {
      // We don't have a patient ID yet since we're creating a new patient
      // For the purpose of this demo, we'll use a temporary ID
      const tempPatientId = 'temp-' + Date.now().toString();
      
      toast({
        title: "Processing files...",
        description: `Starting to process ${files.length} file(s)${isMockMode ? ' in mock mode' : ''}... This may take a moment.`,
      });
      
      // In mock mode, we skip the actual upload and just simulate processing
      if (isMockMode) {
        await simulateMockProcessing();
        return; // Exit early for mock mode
      }
      
      // Check if we can access the "patients" bucket before proceeding
      try {
        const bucketReady = await ensureBucketExists('patients');
        
        if (!bucketReady) {
          console.warn("Storage bucket is not accessible, running file processing in mock mode.");
          setIsMockMode(true);
          toast({
            title: "Storage Unavailable",
            description: "Processing files locally without uploading.",
            variant: "destructive"
          });
          await simulateMockProcessing(); // Simulate processing locally
          return;
        }
      } catch (checkError) {
        console.error("Error checking storage bucket:", checkError);
        setIsMockMode(true);
        toast({
          title: "Storage Error",
          description: "Could not verify storage. Processing files locally without uploading.",
          variant: "destructive"
        });
        await simulateMockProcessing(); // Simulate processing locally
        return;
      }

      // Proceed with actual file processing and potential upload
      const { result, failedUploads } = await safeProcessMultipleFiles(files, tempPatientId);
      setFileProcessingResult(result);
      
      // Give feedback based on the result
      if (failedUploads > 0) {
         toast({
            title: "Processing Complete (with errors)",
            description: `Processed ${files.length - failedUploads} file(s). ${failedUploads} failed to upload. Check console for details. Form fields updated with extracted data.`,
            variant: failedUploads === files.length ? "destructive" : "default",
          });
      } else {
         toast({
            title: "Processing Complete",
            description: `Successfully processed ${files.length} file(s). Form fields updated with extracted data.`,
          });
      }

    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error processing files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFiles(false);
    }
  };
  
  // Simulate processing for mock mode
  const simulateMockProcessing = async () => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    // Create some mock structured data to populate the form
    const mockData: ProcessedFileResult = {
      extractedText: files.map(f => `Mock extracted text for ${f.name}`).join('\n'),
      structuredData: {
        firstName: formData.first_name || "MockFirstName",
        lastName: formData.last_name || "MockLastName",
        dateOfBirth: formData.date_of_birth || "2000-01-01",
        address: formData.address || "123 Mock St",
        phone: formData.phone || "555-000-1111",
        // Add other mock fields as needed
      }
    };
    
    setFileProcessingResult(mockData);
    toast({
      title: "Mock Processing Complete",
      description: `Simulated processing for ${files.length} file(s). Form fields updated.`,
    });
    setIsProcessingFiles(false);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth || !formData.phone || !formData.address) {
      toast({
        title: "Missing required fields",
        description: "Please fill in First Name, Last Name, DOB, Phone, and Address.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const newPatient = await createPatient(formData);
      toast({
        title: "Patient Created",
        description: `${newPatient.first_name} ${newPatient.last_name} added successfully.`,
      });
      router.push(`/patients/${newPatient.id}`); // Redirect to the new patient's detail page
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Error creating patient",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
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
    if (file.type.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };
  
  // Remove a selected file
  const removeFile = (index: number) => {
    setFiles((prevFiles: File[]) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Add New Patient</h1>
          </div>

          {/* Combined Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Patient Documents (Optional)</CardTitle>
                <CardDescription>
                  Upload images, PDFs, or audio files. Information extracted will pre-fill the form below.
                   {isMockMode && <span className="text-yellow-600 font-medium ml-2">(Mock Mode Active - Files won't be uploaded)</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-900'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Images, PDF, Audio (MAX. 50MB per file)</p>
                  </div>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    multiple 
                    onChange={handleFileSelect}
                    className="hidden" 
                    accept="image/*,application/pdf,audio/*"
                  />
                </div>
                
                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Selected Files:</h4>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-black">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {getFileIcon(file)}
                            <span className="text-sm font-medium truncate flex-1" title={file.name}>{file.name}</span>
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
                      disabled={isProcessingFiles || files.length === 0}
                      className="w-full sm:w-auto"
                    >
                      {isProcessingFiles ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        <>Process {files.length} File{files.length > 1 ? 's' : ''} & Fill Form</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Manual Entry Section */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>Enter the patient's details manually. Fields may be pre-filled if documents were processed.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                      <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} required placeholder="e.g., 555-123-4567" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} placeholder="e.g., patient@email.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                    <Textarea id="address" name="address" value={formData.address || ''} onChange={handleInputChange} required placeholder="e.g., 123 Main St, Anytown, USA 12345" />
                  </div>
                </div>
                
                {/* Insurance & Medical Info */}
                <div className="space-y-4">
                   <h3 className="text-lg font-semibold">Insurance & Medical</h3>
                  <div className="space-y-1">
                    <Label htmlFor="insurance_provider">Insurance Provider</Label>
                    <Input id="insurance_provider" name="insurance_provider" value={formData.insurance_provider || ''} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="insurance_group_number">Group Number</Label>
                      <Input id="insurance_group_number" name="insurance_group_number" value={formData.insurance_group_number || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Textarea 
                      id="allergies" 
                      name="allergies" 
                      value={allergiesText} 
                      onChange={(e) => setAllergiesText(e.target.value)} 
                      placeholder="Comma-separated, e.g., Penicillin, Aspirin, Sulfa drugs"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple allergies with commas.</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="medical_conditions">Medical Conditions</Label>
                    <Textarea 
                      id="medical_conditions" 
                      name="medical_conditions" 
                      value={medicalConditionsText} 
                      onChange={(e) => setMedicalConditionsText(e.target.value)} 
                      placeholder="Comma-separated, e.g., Hypertension, Diabetes Type 2, Asthma"
                      rows={3}
                    />
                     <p className="text-xs text-muted-foreground">Separate multiple conditions with commas.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isProcessingFiles}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  'Add Patient'
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 