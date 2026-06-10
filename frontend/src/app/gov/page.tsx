'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore } from '@/store/useGovStore';

export default function GovRoot() {
  const router = useRouter();
  const isGovAuthenticated = useGovStore(s => s.isGovAuthenticated);

  useEffect(() => {
    if (isGovAuthenticated) {
      router.replace('/gov/dashboard');
    } else {
      router.replace('/gov/login');
    }
  }, [isGovAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#070D1A] flex items-center justify-center">
      <div className="text-white text-sm font-mono opacity-60 animate-pulse">
        NETRAVAAH GOV · Initializing secure session...
      </div>
    </div>
  );
}
