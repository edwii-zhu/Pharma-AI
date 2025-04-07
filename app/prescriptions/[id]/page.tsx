'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer, FileText, Download, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase, debugGetPrescriptionById, checkSupabaseConfig } from "@/lib/supabase";

type PrescriptionStatus = 'pending' | 'verified' | 'filled' | 'picked_up' | 'cancelled';

interface Contraindication {
  type: 'drug-interaction' | 'condition' | 'allergy' | 'age' | 'other';
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface ContraindicationData {
  hasSevereContraindications: boolean;
  contraindications: Contraindication[];
}

interface PrescriptionDetail {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  prescriber_id: string;
  medication_id: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  quantity: number;
  refills: number;
  instructions: string;
  date_written: string;
  date_filled: string | null;
  status: PrescriptionStatus;
  verification_pharmacist_id: string | null;
  original_document_url: string | null;
  notes: string | null;
  patients: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
  };
  medications: {
    name: string;
    dosage_form: string;
    strength: string;
    description: string | null;
  };
  prescribers: {
    first_name: string;
    last_name: string;
  };
  contraindication_data?: ContraindicationData | null;
}

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;
  
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [runningDiagnosis, setRunningDiagnosis] = useState(false);

  useEffect(() => {
    async function fetchPrescriptionDetail() {
      try {
        setLoading(true);
        
        if (!prescriptionId) {
          throw new Error('Missing prescription ID parameter');
        }
        
        // Check Supabase configuration
        const configCheck = checkSupabaseConfig();
        console.log('Supabase config check:', configCheck);
        
        console.log('Fetching prescription data for ID:', prescriptionId);
        
        // Use the debug function for better error reporting
        const result = await debugGetPrescriptionById(prescriptionId);
        
        if (!result.success) {
          console.error('Debug query failed:', result.error);
          throw new Error(`Failed to fetch prescription: ${result.error}`);
        }
        
        console.log('Prescription data retrieved successfully');
        setPrescription(result.data as PrescriptionDetail);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching prescription details:', errorMessage);
        setError(`Failed to load prescription details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    if (prescriptionId) {
      fetchPrescriptionDetail();
    }
  }, [prescriptionId]);

  const generateLabel = async () => {
    try {
      setGeneratingLabel(true);
      setError(null); // Clear any previous errors
      
      console.log('Generating label for prescription:', prescriptionId);
      
      // Call our API to generate the label
      const response = await fetch('/api/generate-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prescriptionId }),
      });
      
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Label generation API error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Get PDF blob
      const pdfBlob = await response.blob();
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      console.log('Label generated successfully, size:', pdfBlob.size);
      
      // Create object URL for the PDF
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      // Clean up the object URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error generating prescription label:', errorMessage);
      setError(`Failed to generate label: ${errorMessage}`);
    } finally {
      setGeneratingLabel(false);
    }
  };

  const downloadLabel = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `prescription_label_${prescription?.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const printLabel = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  const getStatusBadge = (status: PrescriptionStatus) => {
    switch (status) {
      case 'filled':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Filled</Badge>;
      case 'picked_up':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Picked Up</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Verified</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low Risk</Badge>;
      default:
        return null;
    }
  };

  const runDiagnostics = async () => {
    try {
      setRunningDiagnosis(true);
      setDiagnosisResult(null);
      
      console.log('Running diagnostics...');
      
      // Check Supabase health via API
      const response = await fetch('/api/supabase-health');
      const healthData = await response.json();
      
      console.log('Health check result:', healthData);
      
      setDiagnosisResult(JSON.stringify(healthData, null, 2));
    } catch (err) {
      console.error('Diagnostics failed:', err);
      setDiagnosisResult(`Diagnostics error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRunningDiagnosis(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <main className="flex-1">
          <div className="container px-4 py-6">
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <main className="flex-1">
          <div className="container px-4 py-6">
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Prescription Details</h1>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Error Loading Prescription</CardTitle>
                <CardDescription>
                  There was a problem retrieving the prescription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error || 'Prescription not found'}</AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Prescription ID</h3>
                    <p className="font-mono bg-slate-100 p-2 rounded">{prescriptionId}</p>
                  </div>
                  
                  <div>
                    <Button 
                      onClick={runDiagnostics} 
                      variant="outline" 
                      disabled={runningDiagnosis}
                      className="w-full"
                    >
                      {runningDiagnosis ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Running Diagnostics...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Run Diagnostics
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {diagnosisResult && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Diagnostic Results</h3>
                      <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-[400px]">
                        {diagnosisResult}
                      </pre>
                    </div>
                  )}
                  
                  <div className="text-center pt-4">
                    <Button variant="default" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Prescription Details</h1>
              <p className="text-muted-foreground">
                View and manage prescription information
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Prescription Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Prescription #{prescription.id.substring(0, 8)}</CardTitle>
                    <CardDescription>
                      Prescribed on {new Date(prescription.date_written).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div>
                    {getStatusBadge(prescription.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Patient Information</h3>
                  <p className="font-medium">{prescription.patients.first_name} {prescription.patients.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    DOB: {new Date(prescription.patients.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Medication</h3>
                  <p className="font-medium">{prescription.medications.name} {prescription.medications.strength}</p>
                  <p className="text-sm text-muted-foreground">{prescription.medications.dosage_form}</p>
                  {prescription.medications.description && (
                    <p className="text-sm mt-2">{prescription.medications.description}</p>
                  )}
                </div>
                
                {/* Add contraindication warnings if they exist */}
                {prescription.contraindication_data && 
                prescription.contraindication_data.contraindications && 
                prescription.contraindication_data.contraindications.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Medication Warnings
                      </h3>
                      <div className="space-y-3">
                        {prescription.contraindication_data.contraindications.map((warning, index) => (
                          <Alert 
                            key={index} 
                            variant={warning.severity === 'high' ? 'destructive' : 'default'}
                            className={`border-l-4 ${warning.severity === 'high' ? 'border-l-red-500' : 
                              warning.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <AlertTitle className="flex items-center gap-2">
                                  {getSeverityIcon(warning.severity)}
                                  {warning.type.split('-').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')}
                                </AlertTitle>
                                <AlertDescription className="mt-1">
                                  <p>{warning.description}</p>
                                  <p className="text-sm mt-1"><span className="font-semibold">Recommendation:</span> {warning.recommendation}</p>
                                </AlertDescription>
                              </div>
                              <div>
                                {getSeverityBadge(warning.severity)}
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Dosage</h3>
                    <p>{prescription.dosage}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Frequency</h3>
                    <p>{prescription.frequency}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                    <p>{prescription.quantity}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Refills</h3>
                    <p>{prescription.refills}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Instructions</h3>
                  <p>{prescription.instructions}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Prescriber</h3>
                  <p>{prescription.prescribers.first_name} {prescription.prescribers.last_name}</p>
                </div>
                
                {prescription.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                      <p className="text-sm">{prescription.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  onClick={generateLabel}
                  disabled={generatingLabel || prescription.status === 'cancelled'}
                >
                  {generatingLabel ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : pdfUrl ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Label
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Label
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Label Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Prescription Label</CardTitle>
                <CardDescription>
                  AI-generated label with medication information and instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {pdfUrl ? (
                  <div className="w-full border rounded-md overflow-hidden">
                    <iframe
                      src={pdfUrl}
                      className="w-full h-[600px]" 
                      title="Prescription Label Preview"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No Label Generated</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a prescription label to view and print it
                    </p>
                    <Button 
                      onClick={generateLabel}
                      disabled={generatingLabel || prescription.status === 'cancelled'}
                    >
                      {generatingLabel ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Label
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
              {pdfUrl && (
                <CardFooter className="flex justify-center space-x-2">
                  <Button variant="outline" onClick={printLabel}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label
                  </Button>
                  <Button onClick={downloadLabel}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 