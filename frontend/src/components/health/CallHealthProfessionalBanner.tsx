'use client';

import React from 'react';
import { Phone, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallHealthProfessionalBannerProps {
  title: string;
  description: string;
  buttonLabel: string;
  onCallClick: () => void;
  variant?: 'ambulance' | 'outbreak' | 'hospital' | 'vaccination' | 'general';
}

const VARIANT_STYLES: Record<string, { gradient: string; iconBg: string; badge: string; badgeText: string }> = {
  ambulance: {
    gradient: 'from-red-955/80 via-emerg-red/60 to-red-900/80',
    iconBg: 'bg-red-500/20 border-red-400/30',
    badge: 'bg-red-500/20 border-red-400/30 text-red-300',
    badgeText: 'Emergency Dispatcher',
  },
  outbreak: {
    gradient: 'from-amber-900/80 via-orange-850/60 to-red-900/70',
    iconBg: 'bg-amber-500/20 border-amber-400/30',
    badge: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
    badgeText: 'Epidemiologist Center',
  },
  hospital: {
    gradient: 'from-med-green/80 via-emerald-800/60 to-teal-900/70',
    iconBg: 'bg-emerald-500/20 border-emerald-400/30',
    badge: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
    badgeText: 'Admissions Coordinator',
  },
  vaccination: {
    gradient: 'from-indigo-900/80 via-violet-850/60 to-purple-900/70',
    iconBg: 'bg-indigo-500/20 border-indigo-400/30',
    badge: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300',
    badgeText: 'Immunization Director',
  },
  general: {
    gradient: 'from-teal-900/80 via-med-green/60 to-emerald-950/80',
    iconBg: 'bg-teal-500/20 border-teal-400/30',
    badge: 'bg-teal-500/20 border-teal-400/30 text-teal-300',
    badgeText: 'Chief Health Officer',
  },
};

export function CallHealthProfessionalBanner({
  title,
  description,
  buttonLabel,
  onCallClick,
  variant = 'general',
}: CallHealthProfessionalBannerProps) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.general;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r ${styles.gradient} p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg`}
    >
      {/* Background pattern dots */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Left: Icon + Text */}
      <div className="flex items-start gap-4 relative z-10">
        <div className={`shrink-0 h-11 w-11 rounded-xl border ${styles.iconBg} flex items-center justify-center`}>
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white leading-tight">{title}</h3>
            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.badge}`}>
              <ShieldCheck className="w-2.5 h-2.5" />
              {styles.badgeText}
            </span>
          </div>
          <p className="text-xs text-white/70 leading-normal max-w-md">{description}</p>
        </div>
      </div>

      {/* Right: CTA Button */}
      <Button
        onClick={onCallClick}
        className="shrink-0 relative z-10 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs h-10 px-5 flex items-center gap-2 cursor-pointer backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
      >
        <Phone className="w-3.5 h-3.5" />
        {buttonLabel}
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
