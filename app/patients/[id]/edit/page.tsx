'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { getPatientById, updatePatient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];

// This is required for static site generation with dynamic routes
export async function generateStaticParams() {
  return [];
}

export default function EditPatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for allergies and medical conditions (text areas)
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [medicalConditionsText, setMedicalConditionsText] = useState<string>('');
  
  // State for form data
  const [formData, setFormData] = useState<PatientUpdate>({});
  
  useEffect(() => {
    async function fetchPatient() {
      try {
        setLoading(true);
        const data = await getPatientById(params.id);
        setPatient(data);
        
        // Initialize form data
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          address: data.address,
          phone: data.phone,
          email: data.email,
          insurance_provider: data.insurance_provider,
          insurance_policy_number: data.insurance_policy_number,
          insurance_group_number: data.insurance_group_number,
          allergies: data.allergies,
          medical_conditions: data.medical_conditions,
        });
        
        // Initialize text areas
        if (data.allergies && data.allergies.length > 0) {
          setAllergiesText(data.allergies.join(', '));
        }
        
        if (data.medical_conditions && data.medical_conditions.length > 0) {
          setMedicalConditionsText(data.medical_conditions.join(', '));
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
        setError("Failed to load patient data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPatient();
  }, [params.id]);
  
  // Update allergies array when text changes
  useEffect(() => {
    if (allergiesText.trim()) {
      const allergiesArray = allergiesText
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      setFormData(prev => ({
        ...prev,
        allergies: allergiesArray
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allergies: []
      }));
    }
  }, [allergiesText]);
  
  // Update medical_conditions array when text changes
  useEffect(() => {
    if (medicalConditionsText.trim()) {
      const conditionsArray = medicalConditionsText
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      setFormData(prev => ({
        ...prev,
        medical_conditions: conditionsArray
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        medical_conditions: []
      }));
    }
  }, [medicalConditionsText]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!formData.first_name || !formData.last_name || !formData.date_of_birth || !formData.phone || !formData.address) {
        throw new Error("Please fill in all required fields");
      }
      
      // Update the patient
      const updatedPatient = await updatePatient(params.id, formData);
      
      toast({
        title: "Patient updated successfully",
        description: `${updatedPatient.first_name} ${updatedPatient.last_name}'s information has been updated.`,
      });
      
      // Redirect to the patient detail page
      router.push(`/patients/${params.id}`);
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error updating patient",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
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
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Edit Patient</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Edit the patient's basic personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(123) 456-7890"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="patient@example.com"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="address"
                        name="address"
                        placeholder="Enter full address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        rows={2}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Insurance Information</CardTitle>
                    <CardDescription>
                      Edit the patient's insurance details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_provider">Insurance Provider</Label>
                      <Input
                        id="insurance_provider"
                        name="insurance_provider"
                        placeholder="Provider name"
                        value={formData.insurance_provider || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="insurance_policy_number">Policy Number</Label>
                        <Input
                          id="insurance_policy_number"
                          name="insurance_policy_number"
                          placeholder="Policy number"
                          value={formData.insurance_policy_number || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="insurance_group_number">Group Number</Label>
                        <Input
                          id="insurance_group_number"
                          name="insurance_group_number"
                          placeholder="Group number"
                          value={formData.insurance_group_number || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                    <CardDescription>
                      Edit any known allergies and medical conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="allergies">
                        Allergies <span className="text-xs text-muted-foreground">(Comma separated)</span>
                      </Label>
                      <Textarea
                        id="allergies"
                        placeholder="Penicillin, Peanuts, Latex, etc."
                        value={allergiesText}
                        onChange={(e) => setAllergiesText(e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="medical_conditions">
                        Medical Conditions <span className="text-xs text-muted-foreground">(Comma separated)</span>
                      </Label>
                      <Textarea
                        id="medical_conditions"
                        placeholder="Diabetes, Hypertension, Asthma, etc."
                        value={medicalConditionsText}
                        onChange={(e) => setMedicalConditionsText(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 