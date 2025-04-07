'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  Edit2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  AlertCircle
} from "lucide-react";
import { getPatientById, getPatientPrescriptions } from "@/lib/supabase"; // Keep Supabase fetches here
import { Database } from "@/lib/database.types";

type Patient = Database['public']['Tables']['patients']['Row'];
type Prescription = any; // Adjust type as needed

interface PatientDetailClientProps {
  patientId: string;
}

export default function PatientDetailClient({ patientId }: PatientDetailClientProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatientData() {
      try {
        setLoading(true);
        
        // Fetch patient details using the passed ID
        const patientData = await getPatientById(patientId);
        setPatient(patientData);
        
        // Fetch patient prescriptions using the passed ID
        const prescriptionsData = await getPatientPrescriptions(patientId);
        setPrescriptions(prescriptionsData);
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError("Failed to load patient data");
      } finally {
        setLoading(false);
      }
    }

    fetchPatientData();
  }, [patientId]); // Depend on the prop

  function formatDOB(dob: string): string {
    return new Date(dob).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatPhone(phone: string): string {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  function calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'verified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'filled':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'picked_up':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Consider moving MainNav out if it's static */}
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading patient data...</p>
        </main>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Consider moving MainNav out */}
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg max-w-xl">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error || "Patient not found"}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/patients')}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Patients
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // The rest of the JSX rendering logic goes here...
  // (Ensure all references to `patient` and `prescriptions` are handled)
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => router.push('/patients')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">{patient.first_name} {patient.last_name}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/patients/${patient.id}/edit`)}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Patient
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Patient Profile Card */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle>Patient Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="h-24 w-24 mb-2">
                      <AvatarFallback className="text-xl bg-primary/10">
                        {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h2>
                    <p className="text-muted-foreground">
                      {calculateAge(patient.date_of_birth)} years old
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Date of Birth</p>
                        <p className="text-sm text-muted-foreground">{formatDOB(patient.date_of_birth)}</p>
                      </div>
                    </div>
                    
                    {patient.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-muted-foreground break-all">{patient.email}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">{patient.address}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Details Tab View */}
              <div className="md:col-span-2">
                <Tabs defaultValue="insurance">
                  <TabsList>
                    <TabsTrigger value="insurance">Insurance</TabsTrigger>
                    <TabsTrigger value="medical">Medical History</TabsTrigger>
                    <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="insurance" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Insurance Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!patient.insurance_provider && !patient.insurance_group_number ? (
                          <div className="flex items-center gap-2 text-muted-foreground py-2">
                            <AlertCircle className="h-5 w-5" />
                            <p>No insurance information on file</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {patient.insurance_provider && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <p className="text-sm font-medium">Provider</p>
                                  <p className="text-muted-foreground">{patient.insurance_provider}</p>
                                </div>
                                {patient.insurance_group_number && (
                                  <div>
                                    <p className="text-sm font-medium">Group Number</p>
                                    <p className="text-muted-foreground">{patient.insurance_group_number}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="medical" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Medical Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium mb-2">Allergies</h3>
                            {!patient.allergies || patient.allergies.length === 0 ? (
                              <p className="text-muted-foreground">No known allergies</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {patient.allergies.map((allergy: string, index: number) => (
                                  <Badge key={index} variant="outline" className="bg-red-50 text-red-800 border-red-200">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h3 className="text-lg font-medium mb-2">Medical Conditions</h3>
                            {!patient.medical_conditions || patient.medical_conditions.length === 0 ? (
                              <p className="text-muted-foreground">No medical conditions on record</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {patient.medical_conditions.map((condition: string, index: number) => (
                                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="prescriptions" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Prescription History
                        </CardTitle>
                        <CardDescription>
                          {prescriptions.length} total prescriptions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {prescriptions.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground">
                            <p>No prescriptions found for this patient</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Medication</TableHead>
                                  <TableHead>Dosage</TableHead>
                                  <TableHead>Prescriber</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {prescriptions.map((prescription: Prescription) => (
                                  <TableRow key={prescription.id}>
                                    <TableCell className="font-medium">
                                      {/* @ts-ignore TODO: Fix type for nested medications */}
                                      {prescription.medications.name} {prescription.medications.strength}
                                    </TableCell>
                                    <TableCell>{prescription.dosage}</TableCell>
                                    <TableCell>
                                      {/* @ts-ignore TODO: Fix type for nested prescribers */}
                                      {prescription.prescribers.first_name} {prescription.prescribers.last_name}
                                    </TableCell>
                                    <TableCell>
                                      {/* @ts-ignore TODO: Fix type for date_written */}
                                      {new Date(prescription.date_written).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="outline" 
                                        className={getStatusBadgeClass(prescription.status)}
                                      >
                                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1).replace('_', ' ')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => router.push(`/prescriptions/${prescription.id}`)}
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span className="sr-only">View prescription</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 