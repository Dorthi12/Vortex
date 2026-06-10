'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, ShieldCheck, CheckCircle2, Info, Activity, Flame, Droplet, Users, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallHealthProfessionalModal } from '@/components/health/CallHealthProfessionalModal';

interface SectorOutbreak {
  id: string;
  name: string;
  dengue: number;
  typhoid: number;
  influenza: number;
  sanitationScore: number;
  status: 'Critical' | 'Warning' | 'Stable';
  containmentActive: boolean;
  notes: string;
  svgColor: string; // for heat map shading
}

const SECTOR_DATA: Record<string, SectorOutbreak> = {
  ward_a: {
    id: 'ward_a',
    name: 'Sector 4B North (Ward A)',
    dengue: 42,
    typhoid: 12,
    influenza: 88,
    sanitationScore: 54,
    status: 'Critical',
    containmentActive: true,
    notes: 'Standing water detected in empty commercial plots. Vector spraying teams dispatched daily.',
    svgColor: 'fill-red-500/35 hover:fill-red-500/50 stroke-emerg-red',
  },
  ward_b: {
    id: 'ward_b',
    name: 'Sector 4B East (Ward B)',
    dengue: 14,
    typhoid: 3,
    influenza: 45,
    sanitationScore: 78,
    status: 'Stable',
    containmentActive: false,
    notes: 'No major outbreak hotspots. Sanitation levels verified last Thursday.',
    svgColor: 'fill-emerald-500/20 hover:fill-emerald-500/35 stroke-med-green',
  },
  ward_c: {
    id: 'ward_c',
    name: 'Sector 4B South (Ward C)',
    dengue: 28,
    typhoid: 9,
    influenza: 62,
    sanitationScore: 63,
    status: 'Warning',
    containmentActive: true,
    notes: 'Minor water stagnation reported near railway colony. Chlorine tablets distributed to households.',
    svgColor: 'fill-amber-500/30 hover:fill-amber-500/45 stroke-amber-500',
  },
  ward_d: {
    id: 'ward_d',
    name: 'Sector 4B West (Ward D)',
    dengue: 5,
    typhoid: 1,
    influenza: 18,
    sanitationScore: 92,
    status: 'Stable',
    containmentActive: false,
    notes: 'High municipal sanitation ratings. Dynamic twin mapping shows stable environmental variables.',
    svgColor: 'fill-emerald-500/20 hover:fill-emerald-500/35 stroke-med-green',
  },
};

export default function OutbreakMonitoring() {
  const { setActiveTab } = useUiStore();
  const [selectedWard, setSelectedWard] = useState<string>('ward_a');
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Health Services in sidebar
  useEffect(() => {
    setActiveTab('Health Services');
  }, [setActiveTab]);

  const activeWard = SECTOR_DATA[selectedWard] || SECTOR_DATA.ward_a;

  // Calculate total metrics for dial
  const totalDengue = Object.values(SECTOR_DATA).reduce((acc, curr) => acc + curr.dengue, 0);
  const totalTyphoid = Object.values(SECTOR_DATA).reduce((acc, curr) => acc + curr.typhoid, 0);
  const averageSanitation = Math.round(
    Object.values(SECTOR_DATA).reduce((acc, curr) => acc + curr.sanitationScore, 0) / 4
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Overview */}
      <div>
        <Link 
          href="/health" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-med-green dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Health Overview
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-emerg-red font-black">
          Epidemiological Tracking
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Disease Outbreak Monitoring
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Track transmission clusters, vector density alerts, and municipal sanitation score indices across Sector 4B districts.
        </p>
      </div>

      {/* Outbreak Severity Banner */}
      <Card className="relative overflow-hidden border-0 shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
        bg-gradient-to-br from-red-650 via-emerg-red to-red-800 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-red-200/90">Epidemic Warning Level</span>
            <h3 className="text-xl font-black leading-none mt-0.5 text-white">
              WATCH STATUS: Active Vector Containment
            </h3>
            <p className="text-xs text-red-100/80 mt-1 max-w-lg font-medium">
              We have detected localized surges of Dengue and Typhoid in Pune Sector 4B North (Ward A). Chemical fogging is active.
            </p>
          </div>
        </div>
        <div className="shrink-0 relative z-10 text-center bg-white/25 border border-white/40 p-3 rounded-xl min-w-[90px] backdrop-blur-sm">
          <span className="block text-[8px] uppercase font-black text-red-200 tracking-widest">Active Cases</span>
          <strong className="text-2xl font-black text-white drop-shadow">{totalDengue + totalTyphoid}</strong>
        </div>
      </Card>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Heatmap Map Card */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-md">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550">
              Interactive Outbreak Heatmap (Sector 4B)
            </CardTitle>
            <CardDescription className="text-xs">
              Click on a ward quadrant to inspect regional case telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            
            {/* SVG Interactive Map */}
            <div className="relative w-full max-w-md aspect-video bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl p-4 flex items-center justify-center">
              <svg viewBox="0 0 400 240" className="w-full h-auto drop-shadow-sm">
                
                {/* Sector A - North (Critical Red) */}
                <path
                  d="M 50,30 L 220,30 L 200,120 L 50,120 Z"
                  className={cn("transition-all duration-200 cursor-pointer stroke-2", SECTOR_DATA.ward_a.svgColor, selectedWard === 'ward_a' && 'stroke-white fill-red-650/50')}
                  onClick={() => setSelectedWard('ward_a')}
                />
                <text x="110" y="70" className={cn("text-xs font-black fill-slate-900 dark:fill-white pointer-events-none select-none", selectedWard === 'ward_a' && 'fill-white font-extrabold')} textAnchor="middle">
                  Ward A (North)
                </text>

                {/* Sector B - East (Stable Green) */}
                <path
                  d="M 220,30 L 350,30 L 350,140 L 200,120 Z"
                  className={cn("transition-all duration-200 cursor-pointer stroke-2", SECTOR_DATA.ward_b.svgColor, selectedWard === 'ward_b' && 'stroke-white fill-emerald-600/35')}
                  onClick={() => setSelectedWard('ward_b')}
                />
                <text x="270" y="80" className={cn("text-xs font-black fill-slate-900 dark:fill-white pointer-events-none select-none", selectedWard === 'ward_b' && 'fill-white font-extrabold')} textAnchor="middle">
                  Ward B (East)
                </text>

                {/* Sector C - South (Warning Amber) */}
                <path
                  d="M 50,120 L 200,120 L 230,210 L 80,210 Z"
                  className={cn("transition-all duration-200 cursor-pointer stroke-2", SECTOR_DATA.ward_c.svgColor, selectedWard === 'ward_c' && 'stroke-white fill-amber-600/45')}
                  onClick={() => setSelectedWard('ward_c')}
                />
                <text x="140" y="170" className={cn("text-xs font-black fill-slate-900 dark:fill-white pointer-events-none select-none", selectedWard === 'ward_c' && 'fill-white font-extrabold')} textAnchor="middle">
                  Ward C (South)
                </text>

                {/* Sector D - West (Stable Green) */}
                <path
                  d="M 200,120 L 350,140 L 320,210 L 230,210 Z"
                  className={cn("transition-all duration-200 cursor-pointer stroke-2", SECTOR_DATA.ward_d.svgColor, selectedWard === 'ward_d' && 'stroke-white fill-emerald-600/35')}
                  onClick={() => setSelectedWard('ward_d')}
                />
                <text x="270" y="170" className={cn("text-xs font-black fill-slate-900 dark:fill-white pointer-events-none select-none", selectedWard === 'ward_d' && 'fill-white font-extrabold')} textAnchor="middle">
                  Ward D (West)
                </text>

              </svg>
            </div>

            {/* Map Legend */}
            <div className="flex gap-4 items-center justify-center mt-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-emerald-500/20 border border-med-green" /> Stable (&lt; 20 cases)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-amber-500/30 border border-amber-500" /> Watch (20-40 cases)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-red-500/30 border border-emerg-red" /> Critical (&gt; 40 cases)
              </span>
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Ward Inspect Panel & Booking */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Ward Inspector Card */}
          <Card className={cn(
            "border-0 shadow-md transition-colors",
            activeWard.status === 'Critical' 
              ? 'bg-red-50 dark:bg-red-950/15 border-l-4 border-l-emerg-red' 
              : activeWard.status === 'Warning' 
                ? 'bg-amber-50/50 dark:bg-amber-950/10 border-l-4 border-l-amber-500' 
                : 'bg-emerald-50/20 dark:bg-emerald-950/10 border-l-4 border-l-med-green'
          )}>
            <CardHeader className="pb-3 border-b border-black/5">
              <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Active Ward Inspection</span>
              <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                {activeWard.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/45 dark:bg-black/20 p-2 rounded-lg border border-black/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase">Dengue</span>
                  <strong className={cn("text-lg font-black", activeWard.dengue > 30 ? "text-emerg-red" : "text-slate-800 dark:text-slate-200")}>
                    {activeWard.dengue}
                  </strong>
                </div>
                <div className="bg-white/45 dark:bg-black/20 p-2 rounded-lg border border-black/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase">Typhoid</span>
                  <strong className="text-lg font-black text-slate-800 dark:text-slate-200">{activeWard.typhoid}</strong>
                </div>
                <div className="bg-white/45 dark:bg-black/20 p-2 rounded-lg border border-black/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase">Sanitation</span>
                  <strong className={cn("text-lg font-black", activeWard.sanitationScore < 60 ? "text-emerg-red" : "text-med-green")}>
                    {activeWard.sanitationScore}%
                  </strong>
                </div>
              </div>

              {/* Containment Status */}
              <div className="bg-white/45 dark:bg-black/20 p-3 rounded-lg border border-black/5 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className={cn("w-4 h-4", activeWard.containmentActive ? "text-med-green" : "text-slate-450")} />
                  Containment Teams:
                </span>
                <span className={cn(
                  "font-black uppercase text-[9px] px-1.5 py-0.5 rounded border",
                  activeWard.containmentActive 
                    ? "bg-emerald-500/10 text-med-green border-emerald-250/20" 
                    : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {activeWard.containmentActive ? 'Fogging Active' : 'No Outbreaks'}
                </span>
              </div>

              {/* Inspector Notes */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400">Environmental Inspector Logs</span>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                  {activeWard.notes}
                </p>
              </div>

              {/* Action Button */}
              {activeWard.status !== 'Stable' && (
                <Button
                  onClick={() => setIsProfModalOpen(true)}
                  className="w-full bg-emerg-red hover:bg-red-800 text-white font-bold text-xs py-2 h-9 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-red-500/30"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Dispatch Containment Officer
                </Button>
              )}

            </CardContent>
          </Card>

          {/* Guidelines / Prevention Card */}
          <Card className="bg-card border-border-subtle shadow-md">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-med-green" /> Containment Protocol Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 text-xs">
                
                {/* Protocol 1 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-med-green/10 text-med-green font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">Vector Source Reduction</strong>
                    <p className="text-[11px] text-slate-500">Drain stagnated ponds, treat puddles with bio-larvicide, and schedule weekly gutter clearing.</p>
                  </div>
                </div>

                {/* Protocol 2 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-med-green/10 text-med-green font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">Domestic Water Treatment</strong>
                    <p className="text-[11px] text-slate-500">Distribute chlorine tablets, screen overhead tanks, and enforce weekly dry days for storage tubs.</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      <CallHealthProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="outbreak" 
      />

    </div>
  );
}
