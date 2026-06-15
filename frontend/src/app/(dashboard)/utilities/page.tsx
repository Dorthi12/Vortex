// app/(dashboard)/utilities/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Droplet, Zap, AlertTriangle, ShieldCheck, RefreshCw, Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface UtilitySystem {
  waterTankPercent: number;
  waterPressurePsi: number;
  waterLeakages: number;
  sewerBlockages: number;
  sewerOverflowAlerts: boolean;
  activeStreetlights: number;
  failedStreetlights: number;
  streetlightKwh: number;
}

const INITIAL_UTILITIES: UtilitySystem = {
  waterTankPercent: 88.0,
  waterPressurePsi: 58.5,
  waterLeakages: 2,
  sewerBlockages: 4,
  sewerOverflowAlerts: false,
  activeStreetlights: 1240,
  failedStreetlights: 8,
  streetlightKwh: 485.2
};

export default function UtilitiesDashboard() {
  const [util, setUtil] = useState<UtilitySystem>(INITIAL_UTILITIES);
  const [tick, setTick] = useState<number>(0);

  // Fluctuating simulator telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentUtil = {
    ...util,
    waterPressurePsi: parseFloat((util.waterPressurePsi + Math.sin(tick) * 1.5).toFixed(1)),
    streetlightKwh: parseFloat((util.streetlightKwh + Math.cos(tick) * 2).toFixed(1))
  };

  // Rule-based alarms check
  const alarms = React.useMemo(() => {
    const list = [];
    if (currentUtil.waterPressurePsi > 65) {
      list.push("HIGH PRESSURE WARNING: Valve limits exceeded at sector 4 main junction.");
    }
    if (currentUtil.waterLeakages > 3) {
      list.push("WATER LOSS DETECTED: Secondary pipelines showing leakage index > 15%.");
    }
    if (currentUtil.sewerBlockages > 3) {
      list.push("SEWER RESTRICTION: Blockage sensors in Yerawada Sector 1 triggered.");
    }
    return list;
  }, [currentUtil]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 7</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Smart City Utility Monitoring</h1>
        </div>
      </div>

      <LocationScopeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Water Supply Grid */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-[#4682B4]" />
                Municipal Water Supply Network
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 flex-1 flex flex-col justify-around">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-450 uppercase">Tank Level Ratio</span>
                  <span className="font-mono font-black text-base text-[#4682B4]">{currentUtil.waterTankPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${currentUtil.waterTankPercent}%` }} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-450 uppercase">Pipeline Pressure (PSI)</span>
                  <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-450">{currentUtil.waterPressurePsi} PSI</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(currentUtil.waterPressurePsi / 80.0) * 100}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg flex justify-between text-xs font-bold">
                <span className="text-slate-450">Active Leaks Reported:</span>
                <span className="text-red-500 font-mono font-black">{currentUtil.waterLeakages} Locations</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Sewer Network blocks */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#4682B4]" />
                Sewer Network Alarms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-450 uppercase">Silt Blockage Index</span>
                  <span className="font-mono font-black text-amber-500">{currentUtil.sewerBlockages} Active Blocks</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs font-bold">
                <span className="text-slate-450 uppercase">Overflow Sensor States:</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                  currentUtil.sewerOverflowAlerts ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                )}>
                  {currentUtil.sewerOverflowAlerts ? 'Overflow Active' : 'Normal Capacity'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Streetlighting Energy logs */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#4682B4]" />
                Street Lighting & Consumption
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded">
                  <span className="block text-[8px] text-slate-400 uppercase">Active Masts</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{currentUtil.activeStreetlights} Lights</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded">
                  <span className="block text-[8px] text-slate-400 uppercase">Faulty Masts</span>
                  <span className="text-red-500 text-sm font-black">{currentUtil.failedStreetlights} Masts</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-450 uppercase">Grid Draw (kWh)</span>
                  <span className="font-mono font-black text-[#4682B4]">{currentUtil.streetlightKwh} kWh</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4682B4]" style={{ width: `${(currentUtil.streetlightKwh / 1000.0) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Alarms Overlay Card */}
      {alarms.length > 0 && (
        <Card className="border border-red-500/20 bg-red-500/5 mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Active System Fault Warnings (Rule Engine)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs font-bold text-red-700 dark:text-red-400">
            {alarms.map((alarm, idx) => (
              <p key={idx} className="flex items-start gap-1">
                <span>•</span>
                <span>{alarm}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
