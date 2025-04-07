import { getAllPatientIds, getPatientById } from "@/lib/supabase";
import PatientDetailClient from "./patient-detail-client";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  const patientIds = await getAllPatientIds();
  // Ensure patientIds is not null and map over it
  return (patientIds || []).map((patient) => ({
    id: patient.id.toString(), // Ensure the id is a string
  }));
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage(props: Props) {
  const params = await props.params;
  // Extract and validate the ID from params
  const { id } = params;

  try {
    // In Next.js 14, we need to await the data fetch in the server component
    await getPatientById(id);
    
    // Then pass the ID to the client component
    return <PatientDetailClient patientId={id} />;
  } catch (error) {
    console.error("Error verifying patient data:", error);
    return <PatientDetailClient patientId={id} />;
  }
} 