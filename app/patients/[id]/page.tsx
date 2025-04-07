import { getAllPatientIds } from "@/lib/supabase";
import PatientDetailClient from "./patient-detail-client";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  const patientIds = await getAllPatientIds();
  // Ensure patientIds is not null and map over it
  return (patientIds || []).map((patient) => ({
    id: patient.id.toString(), // Ensure the id is a string
  }));
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  // This is now a Server Component
  // It fetches data needed for generateStaticParams
  // and renders the client component, passing the ID
  return <PatientDetailClient patientId={params.id} />;
} 