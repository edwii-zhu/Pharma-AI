'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Phone, Mail, FileText, UserPlus, Search } from "lucide-react";
import { getPatients } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Patient = Database['public']['Tables']['patients']['Row'];

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patients");
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  // Format date of birth to a more readable format
  function formatDOB(dob: string): string {
    return new Date(dob).toLocaleDateString();
  }

  // Calculate age from date of birth
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

  // Format phone number
  function formatPhone(phone: string): string {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           patient.phone.includes(searchQuery) || 
           (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Handle patient row click
  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  // Handle add new patient
  const handleAddPatient = () => {
    router.push('/patients/add');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Patients</h1>
                <p className="text-muted-foreground">
                  Manage your pharmacy patients
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddPatient} className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Patient</span>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Patients</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <Card>
                  <CardHeader className="px-6 py-4">
                    <CardTitle>Patient List</CardTitle>
                    <CardDescription>
                      {patients.length} total patients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <p>Loading patients...</p>
                      </div>
                    ) : error ? (
                      <div className="flex justify-center items-center py-8 text-red-500">
                        <p>{error}</p>
                      </div>
                    ) : filteredPatients.length === 0 ? (
                      <div className="flex justify-center items-center py-8 text-muted-foreground">
                        {searchQuery ? (
                          <p>No patients found for "{searchQuery}"</p>
                        ) : (
                          <p>No patients found</p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Age</TableHead>
                              <TableHead className="hidden md:table-cell">DOB</TableHead>
                              <TableHead className="hidden lg:table-cell">Phone</TableHead>
                              <TableHead className="hidden xl:table-cell">Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPatients.map((patient) => (
                              <TableRow 
                                key={patient.id}
                                className="cursor-pointer"
                                onClick={() => handlePatientClick(patient.id)}
                              >
                                <TableCell className="font-medium">
                                  {patient.first_name} {patient.last_name}
                                </TableCell>
                                <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    <span>{formatDOB(patient.date_of_birth)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{formatPhone(patient.phone)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell">
                                  {patient.email && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5" />
                                      <span className="truncate max-w-[200px]">{patient.email}</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/patients/${patient.id}`);
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">View patient</span>
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
              <TabsContent value="recent" className="mt-4">
                <Card>
                  <CardHeader className="px-6 py-4">
                    <CardTitle>Recent Patients</CardTitle>
                    <CardDescription>
                      Patients added or updated recently
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <p>Loading recent patients...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Age</TableHead>
                              <TableHead className="hidden md:table-cell">DOB</TableHead>
                              <TableHead className="hidden lg:table-cell">Phone</TableHead>
                              <TableHead>Updated</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patients
                              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                              .slice(0, 5)
                              .map((patient) => (
                                <TableRow 
                                  key={patient.id}
                                  className="cursor-pointer"
                                  onClick={() => handlePatientClick(patient.id)}
                                >
                                  <TableCell className="font-medium">
                                    {patient.first_name} {patient.last_name}
                                  </TableCell>
                                  <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      <span>{formatDOB(patient.date_of_birth)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5" />
                                      <span>{formatPhone(patient.phone)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(patient.updated_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/patients/${patient.id}`);
                                      }}
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span className="sr-only">View patient</span>
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
      </main>
    </div>
  );
} 