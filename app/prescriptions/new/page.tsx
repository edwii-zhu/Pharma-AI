'use client';

import { MainNav } from "@/components/main-nav"
import PrescriptionProcessor from "@/components/PrescriptionProcessor"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="container py-6">
          <PrescriptionProcessor />
        </div>
      </main>
    </div>
  )
} 