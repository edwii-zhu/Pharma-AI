'use client';

import { useState, useEffect } from 'react';
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PrescriptionStatus = 'pending' | 'verified' | 'filled' | 'picked_up' | 'cancelled';

interface PrescriptionData {
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
  };
  medications: {
    name: string;
    dosage_form: string;
    strength: string;
  };
  prescribers: {
    first_name: string;
    last_name: string;
  };
}

interface Prescription {
  id: string;
  patient: string;
  medication: string;
  dosage: string;
  date: string;
  status: PrescriptionStatus;
  details: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            id,
            created_at,
            updated_at,
            patient_id,
            prescriber_id,
            medication_id,
            dosage,
            frequency,
            duration,
            quantity,
            refills,
            instructions,
            date_written,
            date_filled,
            status,
            verification_pharmacist_id,
            original_document_url,
            notes,
            patients (first_name, last_name),
            medications (name, dosage_form, strength),
            prescribers (first_name, last_name)
          `)
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          const formattedPrescriptions = data.map((item: any) => ({
            id: item.id,
            patient: `${item.patients.first_name} ${item.patients.last_name}`,
            medication: `${item.medications.name} ${item.medications.strength}`,
            dosage: item.dosage,
            date: new Date(item.date_written).toLocaleDateString(),
            status: item.status,
            details: `${item.frequency}, ${item.instructions}`
          }));
          
          setPrescriptions(formattedPrescriptions);
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    }

    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: PrescriptionStatus) => {
    switch (status) {
      case 'filled':
      case 'picked_up':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'verified':
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
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

  const renderPrescriptionsList = (prescriptions: Prescription[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    if (prescriptions.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">No prescriptions found</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <div 
            key={prescription.id} 
            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => router.push(`/prescriptions/${prescription.id}`)}
          >
            <div className="flex items-center space-x-4">
              <div className="font-semibold">
                {prescription.id.substring(0, 8)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{prescription.patient}</p>
                <p className="text-sm text-muted-foreground">{prescription.medication} - {prescription.details}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm">{prescription.date}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getStatusIcon(prescription.status)}
                  {getStatusBadge(prescription.status)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Prescriptions</h1>
                <p className="text-muted-foreground">
                  Manage and process patient prescriptions
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => router.push('/prescriptions/new')}>
                  <Plus className="mr-2 h-4 w-4" /> New Prescription
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search prescriptions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Prescriptions</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="filled">Filled</TabsTrigger>
                <TabsTrigger value="picked_up">Picked Up</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>All Prescriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderPrescriptionsList(filteredPrescriptions)}
                  </CardContent>
                </Card>
              </TabsContent>

              {(['pending', 'verified', 'filled', 'picked_up', 'cancelled'] as const).map((status) => (
                <TabsContent key={status} value={status}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize">{status.replace('_', ' ')} Prescriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderPrescriptionsList(filteredPrescriptions.filter(p => p.status === status))}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
} 