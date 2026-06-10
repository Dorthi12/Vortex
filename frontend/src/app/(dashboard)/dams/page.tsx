'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ChevronRight, 
  ArrowLeft, 
  Waves, 
  Activity, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface SpillwayGate {
  id: number;
  name: string;
  isOpen: boolean;
  flowRate: number; // cusecs when open
  status: 'closed' | 'open';
}

export default function DamsDashboard() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  // Reservoir & Gates states
  const [waterVolumePct, setWaterVolumePct] = useState<number>(78); // % capacity
  
  // Set default baselines based on location
  useEffect(() => {
    switch (userLocation) {
      case 'Yerawada':
        setWaterVolumePct(86);
        break;
      case 'Hadapsar':
        setWaterVolumePct(72);
        break;
      case 'Aundh':
        setWaterVolumePct(80);
        break;
      case 'Shivajinagar':
      default:
        setWaterVolumePct(78);
        break;
    }
  }, [userLocation]);

  const [gates, setGates] = useState<SpillwayGate[]>([
    { id: 1, name: 'Radial Gate 1', isOpen: true, flowRate: 3500, status: 'open' },
    { id: 2, name: 'Radial Gate 2', isOpen: false, flowRate: 3500, status: 'closed' },
    { id: 3, name: 'Radial Gate 3', isOpen: false, flowRate: 3500, status: 'closed' },
    { id: 4, name: 'Emergency Sluice Gate 4', isOpen: false, flowRate: 6000, status: 'closed' },
  ]);

  const toggleGate = (id: number) => {
    setGates(prev => prev.map(g => {
      if (g.id === id) {
        const nextState = !g.isOpen;
        return { ...g, isOpen: nextState, status: nextState ? 'open' : 'closed' };
      }
      return g;
    }));
  };

  // Compute total cusecs discharge rate dynamically
  const totalDischarge = gates.reduce((acc, g) => acc + (g.isOpen ? g.flowRate : 0), 2000); // 2000 base seepage flow

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2">
        <Link href="/infrastructure" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle">
          <ArrowLeft className="w-3.5 h-3.5" />
          Infrastructure Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-[#4682B4] font-bold">Dam Telemetry</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Waves className="w-8 h-8 text-[#4682B4] animate-pulse" />
          Dam Capacity & Spillway Controls
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Monitor Khadakwasla reservoir capacity, toggle spillway gates status, and audit live downstream discharge volumes.
        </p>
      </div>

      {/* Location Scope Banner */}
      <LocationScopeBanner />

      {/* Downstream Alert Banner */}
      {totalDischarge >= 10000 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500 text-white animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400 text-sm leading-none flex items-center gap-2">
                CRITICAL DISCHARGE WARNING: DOWNSTREAM CAUSEWAYS AT RISK
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
              </h3>
              <p className="text-xs text-red-600/90 dark:text-red-300/80 mt-1 font-medium">
                Current spillway discharge rate has passed 9,500 cusecs. Wards along river banks are advised to check flood monitors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Reservoir Capacity Gauge */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Vertical capacity gauge */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Activity className="w-4 h-4 text-[#4682B4]" />
                Reservoir Capacity Gauge
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              {/* SVG Gauge */}
              <div className="relative w-32 h-64 flex items-center justify-center mt-2">
                <svg className="w-full h-full" viewBox="0 0 80 160">
                  {/* Gauge frame */}
                  <rect x="25" y="10" width="30" height="120" rx="15" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" />
                  
                  {/* Danger Line (90%) - mapped to y=22 */}
                  <line x1="15" y1="22" x2="65" y2="22" className="stroke-red-500" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="8" y="18" className="fill-red-600 font-bold text-[6px] dark:fill-red-400">Danger: 90%</text>

                  {/* Water Fill */}
                  {/* Fill height goes from y=120 (0%) to y=20 (100%) */}
                  {/* Math: y_val = 120 - (waterVolumePct / 100) * 100 */}
                  <path
                    d={`M 26,115 L 26,${120 - (waterVolumePct / 100) * 100} C 35,${120 - (waterVolumePct / 100) * 100 - 4} 45,${120 - (waterVolumePct / 100) * 100 + 4} 54,${120 - (waterVolumePct / 100) * 100} L 54,115 Z`}
                    className={cn(
                      "transition-all duration-500 fill-blue-500/80",
                      waterVolumePct >= 90 ? 'fill-red-500/80' : 'fill-blue-500/80'
                    )}
                  />

                  {/* Tick Marks */}
                  {[0, 25, 50, 75, 100].map((t) => {
                    const y = 120 - (t / 100) * 100;
                    return (
                      <g key={t}>
                        <line x1="50" y1={y} x2="55" y2={y} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1" />
                        <text x="58" y={y + 2} className="fill-slate-500 dark:fill-slate-400 text-[6px] font-semibold">{t}%</text>
                      </g>
                    );
                  })}
                </svg>

                {/* Digital readout */}
                <div className="absolute bottom-2 bg-slate-900 text-white px-3 py-1 rounded border border-slate-700 text-center shadow">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold leading-none">Reservoir</span>
                  <span className="text-base font-black text-blue-400">{waterVolumePct}%</span>
                </div>
              </div>

              {/* Simulation buttons to tweak volume */}
              <div className="mt-4 w-full flex gap-2">
                <button 
                  onClick={() => setWaterVolumePct(prev => Math.min(95, prev + 5))}
                  className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Increase Volume
                </button>
                <button 
                  onClick={() => setWaterVolumePct(prev => Math.max(40, prev - 5))}
                  className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Decrease Volume
                </button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Spillway gate controls & Hydrograph area chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Spillway gate toggles */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Settings className="w-5 h-5 text-[#4682B4]" />
                Spillway Gates Control Desk
              </CardTitle>
              <CardDescription className="text-xs">
                Manually toggle radial gates and emergency sluices to adjust downstream release.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-slate-500 dark:text-slate-400 font-black uppercase text-[10px]">
                      <th className="py-2.5">Radial Gate</th>
                      <th className="py-2.5">Capacity Outflow</th>
                      <th className="py-2.5">Gate Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {gates.map(gate => (
                      <tr key={gate.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5">
                          <span className="block font-bold text-slate-800 dark:text-slate-100">{gate.name}</span>
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">{gate.flowRate.toLocaleString()} cusecs</td>
                        <td className="py-2.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            gate.isOpen ? 'bg-blue-500/10 text-blue-600 animate-pulse' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          )}>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              gate.isOpen ? 'bg-blue-500' : 'bg-slate-400'
                            )} />
                            {gate.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => toggleGate(gate.id)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                              gate.isOpen 
                                ? 'border-blue-500/30 text-blue-600 hover:bg-blue-500/5' 
                                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                          >
                            {gate.isOpen ? 'Close Gate' : 'Open Gate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total outflow display */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Spillway Outflow</span>
                  <span className="block text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {totalDischarge.toLocaleString()} Cusecs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">SLA Resolution Status</span>
                  <span className={cn(
                    "block text-xs font-bold uppercase mt-0.5",
                    totalDischarge >= 10000 ? 'text-red-500' : 'text-emerald-500'
                  )}>
                    {totalDischarge >= 10000 ? 'Discharge High' : 'Safe/Within Limits'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outflow Hydrograph SVG Chart */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <TrendingUp className="w-4 h-4 text-[#4682B4]" />
                12-Hour Outflow Hydrograph (Cusecs)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-6 flex flex-col items-center">
              
              <div className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <svg className="w-full aspect-[3/1]" viewBox="0 0 150 50">
                  {/* Grid lines */}
                  <line x1="0" y1="10" x2="150" y2="10" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />
                  <line x1="0" y1="25" x2="150" y2="25" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />
                  <line x1="0" y1="40" x2="150" y2="40" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />

                  {/* Discharge area chart */}
                  {/* Points: x=0 y=45, x=25 y=40, x=50 y=32, x=75 y=15, x=100 y=20, x=125 y=28, x=150 y=totalDischarge scaled */}
                  {/* Scaled totalDischarge: 45 - (totalDischarge / 20000) * 35 */}
                  <path
                    d={`M 0,45 L 20,40 L 40,32 L 60,18 L 80,12 L 100,24 L 120,30 L 150,${Math.max(5, 45 - (totalDischarge / 20000) * 35)} L 150,45 Z`}
                    className="fill-blue-500/10 stroke-[#4682B4] stroke-[1.5]"
                  />
                  {/* Interactive dot at last point */}
                  <circle
                    cx="150"
                    cy={Math.max(5, 45 - (totalDischarge / 20000) * 35)}
                    r="2.5"
                    className="fill-[#4682B4] stroke-white stroke-[0.5]"
                  />
                </svg>
              </div>

              {/* Hydrograph footer */}
              <div className="w-full flex justify-between text-[10px] text-slate-400 font-bold mt-2 px-1">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />12 hours ago</span>
                <span>Current Time</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
