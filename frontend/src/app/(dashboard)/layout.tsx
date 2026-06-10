import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-background" 
      suppressHydrationWarning
    >
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Panel Viewport */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Sticky Top Header Navbar */}
        <Navbar />

        {/* Scrollable Main Layout Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Notifications Right Panel Drawer */}
      <NotificationPanel />
    </div>
  );
}
