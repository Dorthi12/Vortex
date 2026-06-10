'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, ShieldCheck, CheckCircle2, User, Landmark, ClipboardCheck, Info, Navigation, Truck, BatteryCharging } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallHealthProfessionalModal } from '@/components/health/CallHealthProfessionalModal';

interface Ambulance {
  id: string;
  code: string;
  status: 'Dispatched' | 'Idle' | 'Maintenance';
  fuel: number; // %
  crew: string;
  eta: number; // mins (if dispatched)
  x: number; // svg x coordinate
  y: number; // svg y coordinate
  currentStreet: string;
  notes: string;
}

const MOCK_AMBULANCES: Record<string, Ambulance> = {
  amb_01: {
    id: 'amb_01',
    code: 'AMB-4B-01',
    status: 'Dispatched',
    fuel: 94,
    crew: 'Rahul Sen (EMT) + Dr. Roy',
    eta: 8,
    x: 120,
    y: 80,
    currentStreet: 'Sector 4B North Main St',
    notes: 'Responding to a cardiac alert registered in Ward A commercial plots.',
  },
  amb_02: {
    id: 'amb_02',
    code: 'AMB-4B-02',
    status: 'Idle',
    fuel: 100,
    crew: 'Priya Sharma (EMT) + Dr. Kale',
    eta: 0,
    x: 280,
    y: 90,
    currentStreet: 'Sector 4B Civic Care Clinic Standby',
    notes: 'Ready for emergency allocations. High battery telemetry charge.',
  },
  amb_03: {
    id: 'amb_03',
    code: 'AMB-4B-03',
    status: 'Dispatched',
    fuel: 48,
    crew: 'Vikram Singh (EMT) + Dr. Patil',
    eta: 14,
    x: 160,
    y: 160,
    currentStreet: 'Sector 4B Southern Link Bypass',
    notes: 'Transporting pediatric patient to Sector 4 Civic Care. Fuel refill required post-run.',
  },
  amb_04: {
    id: 'amb_04',
    code: 'AMB-4B-04',
    status: 'Maintenance',
    fuel: 12,
    crew: 'Amit Verma (Driver Only)',
    eta: 0,
    x: 310,
    y: 180,
    currentStreet: 'Municipal Fleet Workshop Depot',
    notes: 'Routine oxygen cylinder refilling and chassis diagnostics.',
  },
};

export default function AmbulanceTracking() {
  const { setActiveTab } = useUiStore();
  const [selectedAmb, setSelectedAmb] = useState<string>('amb_01');
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Health Services in sidebar
  useEffect(() => {
    setActiveTab('Health Services');
  }, [setActiveTab]);

  const activeAmb = MOCK_AMBULANCES[selectedAmb] || MOCK_AMBULANCES.amb_01;

  // Dispatch control actions
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  const handleDispatchAction = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 3000);
    }, 1200);
  };

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
          Emergency Logistics
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Ambulance Tracking
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Locate emergency vehicles in real-time, monitor EMT crew assignments, check fuel levels, and manage dispatch ETAs.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: SVG street locator tracker */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-md">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550">
              Live Fleet GPS Tracker (Sector 4B Grid)
            </CardTitle>
            <CardDescription className="text-xs">
              Click on an ambulance pin to inspect diagnostics and dispatch logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            
            {/* SVG street grid map */}
            <div className="relative w-full max-w-md aspect-video bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl p-4 flex items-center justify-center">
              <svg viewBox="0 0 400 240" className="w-full h-auto drop-shadow-sm">
                
                {/* Street Lines (Grid network) */}
                <line x1="30" y1="50" x2="370" y2="50" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />
                <line x1="30" y1="120" x2="370" y2="120" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />
                <line x1="30" y1="190" x2="370" y2="190" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />
                
                <line x1="80" y1="30" x2="80" y2="210" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />
                <line x1="200" y1="30" x2="200" y2="210" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />
                <line x1="320" y1="30" x2="320" y2="210" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />

                {/* Street Names */}
                <text x="210" y="44" className="text-[7px] font-bold fill-slate-400" textAnchor="start">North Main St</text>
                <text x="210" y="114" className="text-[7px] font-bold fill-slate-400" textAnchor="start">Central Link Ave</text>
                <text x="210" y="184" className="text-[7px] font-bold fill-slate-400" textAnchor="start">Bypass Hwy</text>

                {/* Ambulances pins */}
                {Object.values(MOCK_AMBULANCES).map((amb) => {
                  const isSelected = selectedAmb === amb.id;
                  
                  return (
                    <g 
                      key={amb.id} 
                      className="cursor-pointer group"
                      onClick={() => setSelectedAmb(amb.id)}
                    >
                      {/* Pulsing ring for active sirens */}
                      {amb.status === 'Dispatched' && (
                        <circle
                          cx={amb.x}
                          cy={amb.y}
                          r={isSelected ? 14 : 10}
                          className="fill-red-500/20 stroke-emerg-red animate-ping"
                          strokeWidth="1"
                        />
                      )}
                      
                      {/* Pin Circle */}
                      <circle
                        cx={amb.x}
                        cy={amb.y}
                        r={isSelected ? 10 : 8}
                        className={cn(
                          "transition-all duration-200 stroke-2",
                          amb.status === 'Dispatched' 
                            ? 'fill-emerg-red stroke-red-200' 
                            : amb.status === 'Idle' 
                              ? 'fill-med-green stroke-emerald-200' 
                              : 'fill-slate-500 stroke-slate-200',
                          isSelected && 'stroke-white'
                        )}
                      />

                      {/* Truck Icon marker inside pin */}
                      <text 
                        x={amb.x} 
                        y={amb.y + 2.5} 
                        className="text-[6px] fill-white font-extrabold text-center select-none" 
                        textAnchor="middle"
                      >
                        {amb.code.slice(-2)}
                      </text>

                      {/* Hover tooltip label */}
                      <rect
                        x={amb.x - 30}
                        y={amb.y - 24}
                        width="60"
                        height="12"
                        rx="2"
                        className="fill-gov-navy/90 stroke-slate-700 stroke-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      />
                      <text
                        x={amb.x}
                        y={amb.y - 15}
                        className="text-[7px] font-extrabold fill-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center"
                        textAnchor="middle"
                      >
                        {amb.code} ({amb.status})
                      </text>

                    </g>
                  );
                })}

              </svg>
            </div>

            {/* Map Legend */}
            <div className="flex gap-4 items-center justify-center mt-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-emerald-500 border border-emerald-250" /> Idle / Standby
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-red-500 border border-red-200 animate-pulse" /> Dispatched (Siren Active)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-slate-500 border border-slate-250" /> Maintenance Depot
              </span>
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Fleet Inspector */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Fleet Details Inspect */}
          <Card className={cn(
            "border-0 shadow-md transition-colors",
            activeAmb.status === 'Dispatched' 
              ? 'bg-red-50 dark:bg-red-950/15 border-l-4 border-l-emerg-red' 
              : activeAmb.status === 'Idle' 
                ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-l-4 border-l-med-green' 
                : 'bg-slate-50/50 dark:bg-slate-900/10 border-l-4 border-l-slate-450'
          )}>
            <CardHeader className="pb-3 border-b border-black/5">
              <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Ambulance Inspector</span>
              <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-slate-600" />
                {activeAmb.code}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              {/* Status & Fuel */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                <div className="bg-white/45 dark:bg-black/20 p-2.5 rounded-lg border border-black/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase">Fleet Status</span>
                  <span className={cn(
                    "inline-block font-black uppercase text-[8px] px-1.5 py-0.5 rounded border mt-1",
                    activeAmb.status === 'Dispatched' 
                      ? 'bg-red-500/15 text-emerg-red border-red-200/20 animate-pulse' 
                      : activeAmb.status === 'Idle' 
                        ? 'bg-emerald-500/15 text-med-green border-emerald-250/20' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                  )}>
                    {activeAmb.status}
                  </span>
                </div>
                <div className="bg-white/45 dark:bg-black/20 p-2.5 rounded-lg border border-black/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-med-green" /> Battery / Fuel
                  </span>
                  <strong className={cn("text-base font-black block mt-0.5", activeAmb.fuel < 30 ? "text-emerg-red" : "text-slate-800 dark:text-slate-200")}>
                    {activeAmb.fuel}%
                  </strong>
                </div>
              </div>

              {/* Transit Details */}
              <div className="space-y-3 bg-white/45 dark:bg-black/20 p-3 rounded-lg border border-black/5 text-xs font-semibold">
                {activeAmb.status === 'Dispatched' ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerg-red" /> Patient ETA:
                    </span>
                    <strong className="text-base font-black text-emerg-red">{activeAmb.eta} mins</strong>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-1 font-extrabold uppercase">
                    Vehicle on standby
                  </div>
                )}
                
                <div className="border-t border-black/5 pt-2 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold">Current Street:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-black">{activeAmb.currentStreet}</span>
                </div>
              </div>

              {/* Crew Details */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Paramedic Crew Assigned</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeAmb.crew}</span>
              </div>

              {/* Log Notes */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Active Dispatch Log Notes</span>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                  {activeAmb.notes}
                </p>
              </div>

              {/* Dispatch Action Panel */}
              {activeAmb.status === 'Idle' ? (
                <div className="pt-2">
                  <Button
                    onClick={handleDispatchAction}
                    disabled={isDispatching}
                    className="w-full bg-emerg-red hover:bg-red-800 text-white font-bold text-xs py-2 h-9 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-red-500/30"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {isDispatching ? 'Transmitting GPS Route...' : 'Dispatch Paramedics Now'}
                  </Button>
                  {dispatchSuccess && (
                    <div className="mt-2 text-center text-[9px] font-black uppercase text-emerg-red bg-red-500/10 border border-red-200/20 py-1 rounded animate-pulse">
                      GPS coordinates dispatched to cabin!
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    onClick={() => setIsProfModalOpen(true)}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 h-9 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-slate-500/30"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Ambulance Cab Driver
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Logistics Directive Card */}
          <Card className="bg-card border-border-subtle shadow-md">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerg-red" /> Fleet Operation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 text-xs">
                
                {/* Rule 1 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-red-500/10 text-emerg-red font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    R1
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">GPS Sync Priority</strong>
                    <p className="text-[11px] text-slate-500">Cab systems sync telemetry with Command Center every 5 seconds. Enforce alerts on offline triggers.</p>
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
        defaultService="ambulance" 
      />

    </div>
  );
}
