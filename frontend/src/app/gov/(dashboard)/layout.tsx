import React from 'react';
import { GovSidebar } from './GovSidebar';
import { GovNavbar } from './GovNavbar';

export default function GovLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070D1A]">
      <GovSidebar />
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <GovNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
