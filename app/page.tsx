'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirects to the dashboard
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard page
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Loading...</h1>
        <p className="text-muted-foreground">Redirecting to dashboard</p>
      </div>
    </div>
  );
}