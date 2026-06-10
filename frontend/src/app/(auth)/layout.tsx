import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen w-full bg-white flex flex-col justify-between overflow-y-auto auth-layout-context"
      style={{
        '--form-label': '#0F4C81',
        '--form-text': '#1E293B',
        '--form-bg': '#FFFFFF',
        '--form-border': '#CBD5E1',
        'color': '#1E293B',
      } as React.CSSProperties}
    >
      {/* Top Brand Accent Color Band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-gov-navy via-royal-blue to-brand-yellow shrink-0" />

      {/* Top Portal Nav Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-brand-yellow" />
          <span className="font-bold tracking-widest text-base font-sans text-gov-navy">
            NETRAVAAH
          </span>
        </div>
        <span className="text-xs font-semibold text-neutral-text-muted uppercase tracking-wider">
          Official Governance Portal
        </span>
      </header>

      {/* Centered Auth Card Frame */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-neutral-slate/20">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          {children}
        </div>
      </main>

      {/* Secure Footer Bar */}
      <footer className="px-6 py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-neutral-text-muted shrink-0 bg-white">
        <span>© 2026 Government Administration • Ministry of Civic Integration & Intelligence</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-royal-blue transition-colors">Secure Connection</a>
          <a href="#" className="hover:text-royal-blue transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-royal-blue transition-colors">Portal Support</a>
        </div>
      </footer>
    </div>
  );
}
