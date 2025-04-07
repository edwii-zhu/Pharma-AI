import type { Metadata } from "next";
import { MainNav } from "@/components/main-nav";
import PrescriptionProcessor from "@/components/PrescriptionProcessor";

export const metadata: Metadata = {
  title: "Process Prescription | Pharma-AI",
  description: "Process and verify a prescription using AI-powered scanning technology",
};

const Page = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="container mx-auto py-6 px-4 flex-1">
        <PrescriptionProcessor />
      </div>
    </div>
  );
};

export default Page;
