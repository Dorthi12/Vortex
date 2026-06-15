// app/(dashboard)/simulation/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/health/simulation');
  }, [router]);
  return (
    <div className="flex h-[80vh] items-center justify-center text-white bg-transparent">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
        <p className="text-xs text-slate-400 font-bold">Redirecting to Healthcare Digital Twin...</p>
      </div>
    </div>
  );
}
